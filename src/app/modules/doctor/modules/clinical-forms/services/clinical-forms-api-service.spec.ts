import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AttachmentUploadEvent, ClinicalAttachmentType, DownloadedFile } from '../models/clinical-forms.models';
import { ClinicalFormsApiService } from './clinical-forms-api-service';
import { ClinicalFormsError, toClinicalFormsError } from './clinical-forms-error';

describe('ClinicalFormsApiService', () => {
  let api: ClinicalFormsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ClinicalFormsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectNoHospitalId(body: unknown): void {
    expect(JSON.stringify(body ?? {}).toLowerCase()).not.toContain('hospitalid');
  }

  it('unwraps getAccess', () => {
    let result: unknown;
    api.getAccess().subscribe((r) => (result = r));
    const req = http.expectOne((r) => r.url.endsWith('/ClinicalFormAccessAPI/getAccess'));
    expect(req.request.method).toBe('GET');
    req.flush({ isSuccess: true, message: 'ok', data: { isEnabled: true, permissions: ['ViewPatientForms'] } });
    expect(result).toEqual({ isEnabled: true, permissions: ['ViewPatientForms'] });
  });

  it('loads enabled and effective forms', () => {
    api.getEnabledForms().subscribe();
    http.expectOne((r) => r.url.endsWith('/HospitalClinicalFormAPI/getEnabledForms')).flush({ isSuccess: true, data: [] });
    api.getEffectiveForm('t-1').subscribe();
    http.expectOne((r) => r.url.endsWith('/HospitalClinicalFormAPI/getEffectiveForm/t-1')).flush({ isSuccess: true, data: {} });
  });

  it('sends draft, submit, amend and void with the row version and never a hospital id', () => {
    const answers = { intake: { complaint: 'Knee pain' } };

    api.createDraft('p-1', { templateId: 't-1', answers }).subscribe();
    const create = http.expectOne((r) => r.url.endsWith('/ClinicalFormSubmissionAPI/createDraft/p-1'));
    expect(create.request.method).toBe('POST');
    expectNoHospitalId(create.request.body);
    create.flush({ isSuccess: true, data: {} });

    api.saveDraft('s-1', answers, 'rv1').subscribe();
    const save = http.expectOne((r) => r.url.endsWith('/ClinicalFormSubmissionAPI/saveDraft/s-1'));
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual({ answers, rowVersion: 'rv1' });
    save.flush({ isSuccess: true, data: {} });

    api.submit('s-1', answers, 'rv2').subscribe();
    const submit = http.expectOne((r) => r.url.endsWith('/ClinicalFormSubmissionAPI/submit/s-1'));
    expect(submit.request.body).toEqual({ answers, rowVersion: 'rv2' });
    submit.flush({ isSuccess: true, data: {} });

    api.amend('s-1', answers, 'Corrected', 'rv3').subscribe();
    const amend = http.expectOne((r) => r.url.endsWith('/ClinicalFormSubmissionAPI/amend/s-1'));
    expect(amend.request.body).toEqual({ answers, reason: 'Corrected', rowVersion: 'rv3' });
    amend.flush({ isSuccess: true, data: {} });

    api.voidSubmission('s-1', 'Wrong patient', 'rv4').subscribe();
    const voided = http.expectOne((r) => r.url.endsWith('/ClinicalFormSubmissionAPI/void/s-1'));
    expect(voided.request.body).toEqual({ reason: 'Wrong patient', rowVersion: 'rv4' });
    voided.flush({ isSuccess: true, data: {} });
  });

  it('reads history, revisions and consents', () => {
    api.getPatientSubmissions('p-1', { templateId: 't-1', includeVoided: true }).subscribe();
    const list = http.expectOne((r) => r.url.endsWith('/ClinicalFormSubmissionAPI/getPatientSubmissions/p-1'));
    expect(list.request.params.get('templateId')).toBe('t-1');
    expect(list.request.params.get('includeVoided')).toBe('true');
    list.flush({ isSuccess: true, dataList: [], totalCount: 0 });

    api.getRevisions('s-1').subscribe();
    http.expectOne((r) => r.url.endsWith('/getRevisions/s-1')).flush({ isSuccess: true, data: [] });
    api.getRevision('s-1', 2).subscribe();
    http.expectOne((r) => r.url.endsWith('/getRevision/s-1/2')).flush({ isSuccess: true, data: {} });

    api.recordConsent('s-1', { consentType: 'general', isAccepted: true }).subscribe();
    const consent = http.expectOne((r) => r.url.endsWith('/recordConsent/s-1'));
    expect(consent.request.body).toEqual({ consentType: 'general', isAccepted: true });
    consent.flush({ isSuccess: true, data: { status: [], records: [] } });
  });

  it('calls the hospital configuration APIs with the exact contracts and never a hospital id', () => {
    api.getAvailableForms().subscribe();
    const available = http.expectOne((r) => r.url.endsWith('/HospitalClinicalFormAPI/getAvailableForms'));
    expect(available.request.method).toBe('GET');
    available.flush({ isSuccess: true, data: [] });

    api.enableForm({ templateId: 't-1' }).subscribe();
    const enable = http.expectOne((r) => r.url.endsWith('/HospitalClinicalFormAPI/enableForm'));
    expect(enable.request.method).toBe('POST');
    expect(enable.request.body).toEqual({ templateId: 't-1' });
    expectNoHospitalId(enable.request.body);
    enable.flush({ isSuccess: true, data: {} });

    api.disableForm('t-1').subscribe();
    const disable = http.expectOne((r) => r.url.endsWith('/HospitalClinicalFormAPI/disableForm/t-1'));
    expect(disable.request.method).toBe('POST');
    expectNoHospitalId(disable.request.body);
    disable.flush({ isSuccess: true, data: {} });

    api.updateConfiguration('t-1', { activeTemplateVersionId: 'v-1', configurationJson: null, rowVersion: 'rv' }).subscribe();
    const update = http.expectOne((r) => r.url.endsWith('/HospitalClinicalFormAPI/updateConfiguration/t-1'));
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ activeTemplateVersionId: 'v-1', configurationJson: null, rowVersion: 'rv' });
    expectNoHospitalId(update.request.body);
    update.flush({ isSuccess: true, data: {} });

    api.previewConfiguration('t-1', { templateVersionId: 'v-1', configurationJson: '{"schemaVersion":1}' }).subscribe();
    const preview = http.expectOne((r) => r.url.endsWith('/HospitalClinicalFormAPI/previewConfiguration/t-1'));
    expect(preview.request.method).toBe('POST');
    expect(preview.request.body).toEqual({ templateVersionId: 'v-1', configurationJson: '{"schemaVersion":1}' });
    expectNoHospitalId(preview.request.body);
    preview.flush({ isSuccess: true, data: { templateVersionId: 'v-1', versionNumber: 1, definition: {} } });
  });

  describe('error normalization', () => {
    function fail(status: number, body: object): ClinicalFormsError {
      let error: ClinicalFormsError | undefined;
      api.saveDraft('s-1', {}, 'rv').subscribe({ error: (e) => (error = e) });
      http.expectOne((r) => r.url.endsWith('/saveDraft/s-1')).flush(body, { status, statusText: 'x' });
      return error!;
    }

    it('maps 409 to a conflict', () => {
      const error = fail(409, { isSuccess: false, message: 'The record was changed by someone else. Reload and try again.' });
      expect(error instanceof ClinicalFormsError).toBeTrue();
      expect(error.kind).toBe('conflict');
      expect(error.isConflict).toBeTrue();
    });

    it('keeps structured validation errors from 400', () => {
      const error = fail(400, { isSuccess: false, message: 'The answers are invalid.', errors: [{ code: 'UnknownAnswer', path: 'answers.x', message: 'Not part of this form.' }] });
      expect(error.kind).toBe('validation');
      expect(error.message).toBe('The answers are invalid.');
      expect(error.errors[0].code).toBe('UnknownAnswer');
    });

    it('maps 403, 404 and 500', () => {
      expect(fail(403, { isSuccess: false, message: 'Your role cannot change this section.' }).kind).toBe('forbidden');
      expect(fail(404, { isSuccess: false, message: 'Submission not found.' }).kind).toBe('notFound');
      const server = fail(500, { isSuccess: false, message: 'Internal detail' });
      expect(server.kind).toBe('server');
      expect(server.message).not.toContain('Internal detail');
    });

    it('treats a 200 response with isSuccess=false as a failure', () => {
      let error: ClinicalFormsError | undefined;
      api.getEnabledForms().subscribe({ error: (e) => (error = e) });
      http.expectOne((r) => r.url.endsWith('/getEnabledForms')).flush({ isSuccess: false, message: 'Not available' });
      expect(error?.kind).toBe('validation');
      expect(error?.message).toBe('Not available');
    });

    it('maps network failures', () => {
      expect(toClinicalFormsError(new (class extends Error {})()).kind).toBe('server');
      let error: ClinicalFormsError | undefined;
      api.getAccess().subscribe({ error: (e) => (error = e) });
      http.expectOne((r) => r.url.endsWith('/getAccess')).error(new ProgressEvent('error'), { status: 0 });
      expect(error?.kind).toBe('network');
    });
  });

  describe('attachments and PDFs', () => {
    /** Blob bodies are read asynchronously; wait until the error arrives. */
    async function errorOf(trigger: (done: (e: ClinicalFormsError) => void) => void): Promise<ClinicalFormsError | undefined> {
      let error: ClinicalFormsError | undefined;
      trigger((e) => (error = e));
      for (let i = 0; i < 100 && !error; i++) await new Promise((resolve) => setTimeout(resolve, 10));
      return error;
    }

    it('uploads multipart form data with progress, never sending a hospital id', () => {
      const events: AttachmentUploadEvent[] = [];
      const file = new File([new Uint8Array(10)], 'opg.png', { type: 'image/png' });
      api.uploadAttachment('s-1', { file, attachmentType: ClinicalAttachmentType.Opg, sectionKey: 'investigations', fieldKey: 'images' })
        .subscribe((e) => events.push(e));
      const req = http.expectOne((r) => r.url.endsWith('/ClinicalFormAttachmentAPI/upload/s-1'));
      expect(req.request.method).toBe('POST');
      const body = req.request.body as FormData;
      expect(body.get('file')).toBeTruthy();
      expect(body.get('attachmentType')).toBe('2');
      expect(body.get('sectionKey')).toBe('investigations');
      expect(body.has('hospitalId')).toBeFalse();

      req.event({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
      req.flush({ isSuccess: true, data: { id: 'a-1', fileName: 'opg.png' } });
      expect(events[0]).toEqual({ kind: 'progress', percent: 50 });
      expect(events[1].kind).toBe('done');
    });

    it('maps rejected uploads to validation errors', () => {
      let error: ClinicalFormsError | undefined;
      api.uploadAttachment('s-1', { file: new File(['x'], 'a.png'), attachmentType: ClinicalAttachmentType.Other }).subscribe({ error: (e) => (error = e) });
      http.expectOne((r) => r.url.endsWith('/upload/s-1')).flush(
        { isSuccess: false, message: 'The file was rejected.', errors: [{ code: 'UnsafeFileContent', path: 'file', message: 'PDFs with scripts are not allowed.' }] },
        { status: 400, statusText: 'Bad Request' });
      expect(error?.kind).toBe('validation');
      expect(error?.errors[0].code).toBe('UnsafeFileContent');
    });

    it('lists and deletes attachments with a reason', () => {
      api.getAttachments('s-1').subscribe();
      http.expectOne((r) => r.url.endsWith('/ClinicalFormAttachmentAPI/getAttachments/s-1')).flush({ isSuccess: true, data: [] });
      api.deleteAttachment('a-1', 'Wrong image').subscribe();
      const del = http.expectOne((r) => r.url.endsWith('/ClinicalFormAttachmentAPI/delete/a-1'));
      expect(del.request.method).toBe('POST');
      expect(del.request.body).toEqual({ reason: 'Wrong image' });
      del.flush({ isSuccess: true, data: {} });
    });

    it('downloads attachments and PDFs as blobs through the authorized endpoints', () => {
      let file: DownloadedFile | undefined;
      api.downloadAttachment({ id: 'a-1', fileName: 'opg.png', contentType: 'image/png' }).subscribe((f) => (file = f));
      const req = http.expectOne((r) => r.url.endsWith('/ClinicalFormAttachmentAPI/download/a-1'));
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['png'], { type: 'image/png' }));
      expect(file?.fileName).toBe('opg.png');
      expect(file?.contentType).toBe('image/png');

      api.downloadPdf('s-1', 'form.pdf').subscribe();
      http.expectOne((r) => r.url.endsWith('/ClinicalFormPdfAPI/submission/s-1')).flush(new Blob(['%PDF'], { type: 'application/pdf' }));
      api.downloadPdf('s-1', 'form.pdf', 2).subscribe();
      http.expectOne((r) => r.url.endsWith('/ClinicalFormPdfAPI/submission/s-1/revision/2')).flush(new Blob(['%PDF'], { type: 'application/pdf' }));
    });

    it('decodes JSON error bodies of failed downloads', async () => {
      let error = await errorOf((done) => {
        api.downloadPdf('s-1', 'form.pdf').subscribe({ error: done });
        http.expectOne((r) => r.url.endsWith('/submission/s-1')).flush(
          new Blob([JSON.stringify({ isSuccess: false, message: 'A PDF is available once the form has been submitted.', errors: [{ code: 'PdfNotAvailable', path: 'status', message: 'x' }] })], { type: 'application/json' }),
          { status: 400, statusText: 'Bad Request' });
      });
      expect(error?.kind).toBe('validation');
      expect(error?.message).toBe('A PDF is available once the form has been submitted.');
      expect(error?.errors[0].code).toBe('PdfNotAvailable');

      error = await errorOf((done) => {
        api.downloadAttachment({ id: 'a-9', fileName: 'x.png', contentType: 'image/png' }).subscribe({ error: done });
        http.expectOne((r) => r.url.endsWith('/download/a-9')).flush(new Blob(['{"isSuccess":false,"message":"File storage is not available."}']), { status: 503, statusText: 'x' });
      });
      expect(error?.kind).toBe('unavailable');
      expect(error?.message).toBe('File storage is not available.');

      error = await errorOf((done) => {
        api.downloadAttachment({ id: 'a-8', fileName: 'x.png', contentType: 'image/png' }).subscribe({ error: done });
        http.expectOne((r) => r.url.endsWith('/download/a-8')).flush(new Blob(['not json']), { status: 404, statusText: 'x' });
      });
      expect(error?.kind).toBe('notFound');
    });
  });
});
