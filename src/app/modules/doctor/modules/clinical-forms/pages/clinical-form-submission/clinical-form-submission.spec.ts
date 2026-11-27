import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { ClinicalFormsModule } from '../../clinical-forms-module';
import { ClinicalFormSubmission } from './clinical-form-submission';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsError } from '../../services/clinical-forms-error';
import { ApiService } from '../../../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../../../shared/constants/api-endpoints';
import { ToastService } from '../../../../../../shared/services/toast-service';
import { testDefinition } from '../../testing/test-definition';
import { HAIR_TRANSPLANTATION_CONSENT_V1 } from '../../testing/hair-transplantation-consent-v1.definition';
import {
  AttachmentUploadEvent,
  ClinicalAttachmentType,
  ClinicalFormAttachment,
  ClinicalFormConsentRecord,
  ClinicalFormConsents,
  ClinicalFormPermission,
  ClinicalFormSubmissionDetail,
  ConsentSignerType,
  SubmissionStatus,
} from '../../models/clinical-forms.models';

const PATIENT = 'p-1';
const APPT = 'a-1';
const RECEPTIONIST: ClinicalFormPermission[] = ['ViewPatientForms', 'FillPatientForms'];
const DOCTOR: ClinicalFormPermission[] = ['ViewPatientForms', 'FillPatientForms', 'ClinicalEdit', 'VoidSubmission'];

describe('ClinicalFormSubmission page', () => {
  let fixture: ComponentFixture<ClinicalFormSubmission>;
  let api: jasmine.SpyObj<ClinicalFormsApiService>;
  let toast: jasmine.SpyObj<ToastService>;
  let patientRecordId: string;

  function submission(permissions: ClinicalFormPermission[], status = SubmissionStatus.Draft, extra: Partial<ClinicalFormSubmissionDetail> = {}): ClinicalFormSubmissionDetail {
    const definition = testDefinition();
    definition.consents![0].allowGuardian = true;
    definition.consents![0].witnessOptional = true;
    return {
      id: 's-1', patientId: PATIENT, templateId: 't-1', formKey: 'physio-assessment', formName: 'Physiotherapy Assessment',
      templateVersionId: 'v-3', versionNumber: 3, status, currentRevisionNumber: status === SubmissionStatus.Draft ? 0 : 1,
      createdAt: '2026-11-23T00:00:00Z', createdBy: 'u-1', appointmentId: APPT,
      answers: { intake: { complaint: 'Knee pain' }, assessment: { pain: 4 } }, definition, rowVersion: 'AAAAAAAAB9E=', permissions,
      sections: [
        { key: 'intake', title: 'Intake', clinical: false, canEdit: permissions.includes('FillPatientForms') },
        { key: 'assessment', title: 'Assessment', clinical: true, canEdit: permissions.includes('ClinicalEdit') },
        { key: 'consent', title: 'Consent', clinical: false, canEdit: permissions.includes('FillPatientForms') },
      ],
      ...extra,
    };
  }

  const consents = (satisfied: boolean, records: ClinicalFormConsentRecord[] = []): ClinicalFormConsents => ({
    submissionId: 's-1',
    status: [{ consentType: 'physio-general', consentVersion: '1.0', consentText: 'I agree to the assessment.', required: true, satisfied }],
    records,
  });

  async function render(detail: ClinicalFormSubmissionDetail, consentStatus = consents(false), query: Record<string, string> = {}) {
    api = jasmine.createSpyObj<ClinicalFormsApiService>('ClinicalFormsApiService',
      ['getSubmission', 'getConsents', 'saveDraft', 'checkSubmission', 'submit', 'amend', 'voidSubmission', 'recordConsent', 'getRevisions', 'getRevision',
        'getAttachments', 'uploadAttachment', 'deleteAttachment', 'downloadAttachment', 'downloadPdf']);
    api.getSubmission.and.returnValue(of(detail));
    api.getConsents.and.returnValue(of(consentStatus));
    api.getRevisions.and.returnValue(of([]));
    api.getAttachments.and.returnValue(of(attachmentList));
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'warning', 'info']);

    const sharedApi = {
      get: (url: string) => url === ApiEndpoints.User.GET_BY_ID(PATIENT)
        ? of({ isSuccess: true, data: { userId: patientRecordId, fullName: 'Asha Verma', gender: 'Female', dob: '1990-05-01' } })
        : of({ dataList: [
          { appointmentId: APPT, patientId: PATIENT, appointmentViewId: 501, appointmentDate: '2026-11-23T10:00:00', doctorName: 'Rao', appointmentStatus: 1 },
        ] }),
    };

    await TestBed.configureTestingModule({
      imports: [ClinicalFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ submissionId: 's-1' })),
            snapshot: { paramMap: convertToParamMap({ submissionId: 's-1' }), queryParamMap: convertToParamMap(query) },
          },
        },
        { provide: ClinicalFormsApiService, useValue: api },
        { provide: ApiService, useValue: sharedApi },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicalFormSubmission);
    await settle();
  }

  let attachmentList: ClinicalFormAttachment[];
  beforeEach(() => {
    patientRecordId = PATIENT;
    attachmentList = [];
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (test: string) => el().querySelector<HTMLElement>(`[data-test="${test}"]`);
  const button = (test: string) => el().querySelector<HTMLButtonElement>(`[data-test="${test}"]`);
  const type = (selector: string, value: string) => {
    const input = el().querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  // ------------------------------------------------------------------ context & permissions

  describe('patient and appointment context', () => {
    it('shows the server-held patient and appointment and prefills patient-record fields', async () => {
      await render(submission(RECEPTIONIST));
      expect(q('context-patient')?.textContent).toContain('Asha Verma');
      expect(q('context-appointment')?.textContent).toContain('#501');
      expect(el().querySelector('[data-field="intake.name"] [data-test="patient-value"]')?.textContent).toContain('Asha Verma');
      expect(el().querySelector('[data-field="intake.name"] input')).toBeNull(); // read only, never sent
    });

    it('never shows a patient record that is not the submission\'s patient', async () => {
      patientRecordId = 'someone-else';
      await render(submission(RECEPTIONIST));
      expect(q('context-patient')?.textContent).toContain('Patient details unavailable');
      expect(el().textContent).not.toContain('Asha Verma');
    });

    it('uses the submission snapshot for submitted records', async () => {
      await render(submission(DOCTOR, SubmissionStatus.Submitted, { patientSnapshot: { fullName: 'Asha V. (at submission)', gender: 'Female' } }), consents(true));
      expect(q('context-patient')?.textContent).toContain('Asha V. (at submission)');
    });

    it('blocks editing when opened from a different patient or appointment', async () => {
      await render(submission(DOCTOR), consents(true), { patientId: 'p-2' });
      expect(q('context-mismatch')?.textContent).toContain('different patient');
      expect(button('save-draft')!.disabled).toBeTrue();
      expect(button('submit')!.disabled).toBeTrue();
      expect(el().querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.disabled).toBeTrue();
      expect(button('consent-accept')).toBeNull();
    });

    it('flags an appointment mismatch', async () => {
      await render(submission(RECEPTIONIST), consents(false), { patientId: PATIENT, appointmentId: 'a-other' });
      expect(q('context-mismatch')?.textContent).toContain('not linked to the appointment');
    });
  });

  describe('role-specific section editing', () => {
    it('receptionist: edits intake only, cannot submit, and saves without touching clinical sections', async () => {
      const detail = submission(RECEPTIONIST);
      await render(detail);
      expect(button('submit')).toBeNull();
      expect(el().querySelector('[data-section="assessment"] [data-test="read-only-badge"]')).toBeTruthy();
      expect(el().querySelector<HTMLInputElement>('[data-field="assessment.pain"] input')!.disabled).toBeTrue();
      expect(q('section-access')?.textContent).toContain('Assessment');

      api.saveDraft.and.returnValue(of({ ...detail, rowVersion: 'AAAAAAAAB9I=' }));
      button('save-draft')!.click();
      await settle();
      // The assessment section is omitted, so the server keeps the doctor's answers (section-level merge).
      expect(api.saveDraft).toHaveBeenCalledWith('s-1', { intake: { complaint: 'Knee pain' } }, 'AAAAAAAAB9E=');
      expect(toast.success).toHaveBeenCalledWith('Draft saved.');
    });

    it('doctor: edits clinical sections and the saved payload includes them', async () => {
      const detail = submission(DOCTOR);
      await render(detail);
      expect(el().querySelector<HTMLInputElement>('[data-field="assessment.pain"] input')!.disabled).toBeFalse();
      api.saveDraft.and.returnValue(of(detail));
      button('save-draft')!.click();
      await settle();
      expect(api.saveDraft.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ assessment: jasmine.objectContaining({ pain: 4 }) }));
    });

    it('repeats the same actions below the form and they work from there', async () => {
      const detail = submission(DOCTOR);
      await render(detail);
      const top = q('actions-top')!;
      const bottom = q('actions-bottom')!;
      const labels = (root: HTMLElement) => Array.from(root.querySelectorAll('button')).map((b) => b.textContent?.trim());
      expect(labels(bottom)).toEqual(labels(top));
      expect(labels(bottom)).toContain('Save draft');

      api.saveDraft.and.returnValue(of(detail));
      bottom.querySelector<HTMLButtonElement>('[data-test="save-draft"]')!.click();
      await settle();
      expect(api.saveDraft).toHaveBeenCalledTimes(1);
    });

    it('view-only users get no actions and a read-only form', async () => {
      await render(submission(['ViewPatientForms']));
      expect(button('save-draft')).toBeNull();
      expect(button('submit')).toBeNull();
      expect(button('void')).toBeNull();
      expect(el().querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.disabled).toBeTrue();
    });
  });

  // ------------------------------------------------------------------ consent

  describe('consent', () => {
    it('shows the exact server wording and version', async () => {
      await render(submission(RECEPTIONIST));
      expect(q('consent-text')?.textContent?.trim()).toBe('I agree to the assessment.');
      expect(q('consent-version')?.textContent).toContain('Version 1.0');
      expect(q('consent-missing')).toBeTruthy();
    });

    it('lists each consent of a form under its own heading with its own signature pad', async () => {
      const hair = structuredClone(HAIR_TRANSPLANTATION_CONSENT_V1);
      await render(submission(RECEPTIONIST, SubmissionStatus.Draft, { definition: hair, sections: [] }), {
        submissionId: 's-1', records: [],
        status: hair.consents!.map((c) => ({ consentType: c.consentType, consentVersion: c.consentVersion, consentText: c.text, required: true, requiresSignature: true, satisfied: false })),
      });
      const titles = Array.from(el().querySelectorAll('[data-test="consent-title"]')).map((t) => t.textContent?.trim());
      expect(titles).toEqual(['Hair Transplantation Consent and Declaration', 'Hairline Design Acknowledgement']);
      expect(el().querySelectorAll('[data-test="signature-area"]').length).toBe(2);
      expect(el().querySelector('[data-consent="hair-transplant-procedure"] [data-test="consent-text"]')?.textContent).toContain('10. I have been given sufficient time');
      expect(el().querySelector('[data-consent="hair-transplant-procedure"] [data-test="signer"] option[value="2"]')).toBeNull(); // no guardian on this form
    });

    it('records a patient acceptance without guardian details', async () => {
      await render(submission(RECEPTIONIST));
      api.recordConsent.and.returnValue(of(consents(true)));
      button('consent-accept')!.click();
      await settle();
      expect(api.recordConsent).toHaveBeenCalledWith('s-1', {
        consentType: 'physio-general', isAccepted: true, signerType: ConsentSignerType.Patient, guardianName: null, guardianRelationship: null, witnessName: null,
        signatureImage: null,
      });
      expect(q('consent-satisfied')).toBeTruthy();
    });

    it('requires guardian name and relationship when a guardian responds', async () => {
      await render(submission(RECEPTIONIST));
      const signer = el().querySelector<HTMLSelectElement>('[data-test="signer"]')!;
      signer.value = String(ConsentSignerType.Guardian);
      signer.dispatchEvent(new Event('change'));
      await settle();

      button('consent-accept')!.click();
      await settle();
      expect(api.recordConsent).not.toHaveBeenCalled();
      expect(q('consent-error')?.textContent).toContain('guardian');

      type('[data-test="guardian-name"]', 'Ravi Verma');
      type('[data-test="guardian-relationship"]', 'Father');
      type('[data-test="witness-name"]', 'Nurse Kaur');
      await settle();
      api.recordConsent.and.returnValue(of(consents(true)));
      button('consent-accept')!.click();
      await settle();
      expect(api.recordConsent).toHaveBeenCalledWith('s-1', {
        consentType: 'physio-general', isAccepted: true, signerType: ConsentSignerType.Guardian,
        guardianName: 'Ravi Verma', guardianRelationship: 'Father', witnessName: 'Nurse Kaur',
        signatureImage: null,
      });
    });

    it('offers guardian only when the consent allows it', async () => {
      const detail = submission(RECEPTIONIST);
      detail.definition.consents![0].allowGuardian = false;
      await render(detail);
      const options = Array.from(el().querySelectorAll<HTMLOptionElement>('[data-test="signer"] option')).map((o) => o.textContent?.trim());
      expect(options).toEqual(['Patient']);
    });

    it('records a refusal and shows the server\'s consent errors in the panel', async () => {
      await render(submission(RECEPTIONIST));
      api.recordConsent.and.returnValue(throwError(() => new ClinicalFormsError('validation', 400, 'The consent is invalid.',
        [{ code: 'InvalidFieldConfiguration', path: 'signerType', message: 'This consent does not allow a guardian to sign.' }])));
      button('consent-refuse')!.click();
      await settle();
      expect(api.recordConsent.calls.mostRecent().args[1].isAccepted).toBeFalse();
      expect(q('consent-error')?.textContent).toContain('does not allow a guardian');
    });

    it('blocks submission until the required consent is accepted', async () => {
      await render(submission(DOCTOR));
      button('submit')!.click();
      await settle();
      expect(api.submit).not.toHaveBeenCalled();
      expect(q('issues')?.textContent).toContain('must accept the consent before submission');
    });
  });

  // ------------------------------------------------------------------ lifecycle

  describe('lifecycle', () => {
    it('checks completeness locally and with the server', async () => {
      await render(submission(DOCTOR), consents(true));
      api.checkSubmission.and.returnValue(of({ canSubmit: false, issues: [{ code: 'RequiredMissing', path: 'answers.assessment.history', message: 'This field is required.' }] }));
      button('check')!.click();
      await settle();
      expect(api.checkSubmission).toHaveBeenCalledWith('s-1');
      expect(q('issues')?.textContent).toContain('Assessment › History');
      expect(q('check-ready')).toBeNull();
    });

    it('reports a complete form as ready', async () => {
      const detail = submission(DOCTOR);
      detail.definition.sections.forEach((s) => s.fields.forEach((f) => (f.required = false)));
      await render(detail, consents(true));
      api.checkSubmission.and.returnValue(of({ canSubmit: true, issues: [] }));
      button('check')!.click();
      await settle();
      expect(q('check-ready')).toBeTruthy();
    });

    it('submits as a doctor with the answers and row version, then shows history', async () => {
      const detail = submission(DOCTOR);
      detail.definition.sections.forEach((s) => s.fields.forEach((f) => (f.required = false)));
      await render(detail, consents(true));
      api.submit.and.returnValue(of({ ...detail, status: SubmissionStatus.Submitted, rowVersion: 'rv-2' }));
      api.getRevisions.and.returnValue(of([{ revisionNumber: 1, changeType: 1, changedBy: 'u-1', changedAt: '2026-11-23T11:00:00Z', answersHash: 'h' }]));

      button('submit')!.click();
      await settle();

      expect(api.submit).toHaveBeenCalledWith('s-1', jasmine.objectContaining({ intake: { complaint: 'Knee pain' } }), 'AAAAAAAAB9E=');
      expect(q('status')?.textContent).toContain('Submitted');
      expect(el().querySelectorAll('[data-test="revision-row"]').length).toBe(1);
      expect(toast.success).toHaveBeenCalledWith('Form submitted.');
    });

    it('shows server validation errors at the field and in the summary', async () => {
      await render(submission(RECEPTIONIST));
      api.saveDraft.and.returnValue(throwError(() => new ClinicalFormsError('validation', 400, 'The answers are invalid.',
        [
          { code: 'InvalidAnswer', path: 'answers.intake.phone', message: 'A valid phone number is required.' },
          { code: 'InvalidAnswer', path: 'answers.intake', message: 'The section is incomplete.' },
        ])));
      button('save-draft')!.click();
      await settle();

      expect(q('action-error')?.textContent).toContain('The answers are invalid.');
      expect(el().querySelector('[data-field="intake.phone"] [data-test="server-errors"]')?.textContent).toContain('A valid phone number is required.');
      expect(el().querySelector('[data-section="intake"] [data-test="section-errors"]')?.textContent).toContain('The section is incomplete.');
      expect(q('issues')?.textContent).toContain('Intake › Contact number: A valid phone number is required.');
    });

    it('requires a reason to amend and sends it with the changes', async () => {
      const detail = submission(DOCTOR, SubmissionStatus.Submitted);
      detail.definition.sections.forEach((s) => s.fields.forEach((f) => (f.required = false)));
      await render(detail, consents(true));
      expect(el().querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.disabled).toBeTrue();

      button('amend')!.click();
      await settle();
      expect(el().querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.disabled).toBeFalse();

      button('save-amendment')!.click();
      await settle();
      expect(api.amend).not.toHaveBeenCalled();
      expect(q('action-error')?.textContent).toContain('reason for the amendment');

      type('#cf-amend-reason', 'Corrected pain score');
      api.amend.and.returnValue(of({ ...detail, status: SubmissionStatus.Amended, currentRevisionNumber: 2 }));
      await settle();
      button('save-amendment')!.click();
      await settle();
      expect(api.amend).toHaveBeenCalledWith('s-1', jasmine.any(Object), 'Corrected pain score', 'AAAAAAAAB9E=');
      expect(q('status')?.textContent).toContain('Amended (revision 2)');
    });

    it('does not offer amendment to receptionists', async () => {
      await render(submission(RECEPTIONIST, SubmissionStatus.Submitted), consents(true));
      expect(button('amend')).toBeNull();
      expect(button('void')).toBeNull(); // VoidSubmission is not a receptionist permission
    });

    it('voids a submitted form with a required reason', async () => {
      const detail = submission(DOCTOR, SubmissionStatus.Submitted);
      await render(detail, consents(true));
      button('void')!.click();
      await settle();
      button('confirm-void')!.click();
      await settle();
      expect(api.voidSubmission).not.toHaveBeenCalled();
      expect(q('action-error')?.textContent).toContain('reason for voiding');

      type('#cf-void-reason', 'Recorded for the wrong patient');
      api.voidSubmission.and.returnValue(of({ ...detail, status: SubmissionStatus.Voided, voidReason: 'Recorded for the wrong patient' }));
      await settle();
      button('confirm-void')!.click();
      await settle();
      expect(api.voidSubmission).toHaveBeenCalledWith('s-1', 'Recorded for the wrong patient', 'AAAAAAAAB9E=');
      expect(q('void-reason')?.textContent).toContain('wrong patient');
      expect(button('void')).toBeNull();
      expect(button('consent-accept')).toBeNull();
    });

    it('discards a draft', async () => {
      const detail = submission(RECEPTIONIST);
      await render(detail);
      expect(button('void')?.textContent).toContain('Discard draft');
      button('void')!.click();
      await settle();
      type('#cf-void-reason', 'Started by mistake');
      api.voidSubmission.and.returnValue(of({ ...detail, status: SubmissionStatus.Voided, voidReason: 'Started by mistake' }));
      await settle();
      button('confirm-void')!.click();
      await settle();
      expect(api.voidSubmission).toHaveBeenCalledWith('s-1', 'Started by mistake', 'AAAAAAAAB9E=');
      expect(toast.success).toHaveBeenCalledWith('Draft discarded.');
    });

    it('lists revisions and shows a past revision read-only', async () => {
      const detail = submission(DOCTOR, SubmissionStatus.Amended);
      await render(detail, consents(true));
      expect(api.getRevisions).toHaveBeenCalledWith('s-1');
      api.getRevisions.and.returnValue(of([
        { revisionNumber: 2, changeType: 2, changeReason: 'Corrected', changedBy: 'u-1', changedAt: '2026-11-23T12:00:00Z', answersHash: 'b' },
        { revisionNumber: 1, changeType: 1, changedBy: 'u-1', changedAt: '2026-11-23T11:00:00Z', answersHash: 'a' },
      ]));
      fixture.componentInstance.loadRevisions();
      await settle();
      const rows = el().querySelectorAll('[data-test="revision-row"]');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('Amended');
      expect(rows[0].textContent).toContain('Corrected');

      api.getRevision.and.returnValue(of({ revisionNumber: 1, changeType: 1, changedBy: 'u-1', changedAt: '2026-11-23T11:00:00Z', answersHash: 'a',
        answers: { intake: { complaint: 'Original complaint' } }, patientSnapshot: { fullName: 'Asha Verma' } }));
      rows[1].querySelector<HTMLButtonElement>('[data-test="view-revision"]')!.click();
      await settle();
      const view = q('revision-view')!;
      expect(api.getRevision).toHaveBeenCalledWith('s-1', 1);
      expect(view.querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.value).toBe('Original complaint');
      expect(view.querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.disabled).toBeTrue();
    });
  });

  // ------------------------------------------------------------------ errors

  describe('error states', () => {
    it('asks the user to reload on a 409 conflict, disables actions, and never overwrites', async () => {
      await render(submission(RECEPTIONIST));
      api.saveDraft.and.returnValue(throwError(() => new ClinicalFormsError('conflict', 409, 'Changed by someone else.')));
      button('save-draft')!.click();
      await settle();

      expect(q('conflict')).toBeTruthy();
      expect(toast.warning).toHaveBeenCalled();
      expect(button('save-draft')!.disabled).toBeTrue();
      expect(api.saveDraft).toHaveBeenCalledTimes(1);

      api.getSubmission.calls.reset();
      button('reload')!.click();
      await settle();
      expect(api.getSubmission).toHaveBeenCalledWith('s-1');
      expect(q('conflict')).toBeNull();
      expect(button('save-draft')!.disabled).toBeFalse();
    });

    it('treats a 409 on consent capture as a conflict too', async () => {
      await render(submission(RECEPTIONIST));
      api.recordConsent.and.returnValue(throwError(() => new ClinicalFormsError('conflict', 409, 'Changed by someone else.')));
      button('consent-accept')!.click();
      await settle();
      expect(q('conflict')).toBeTruthy();
    });

    it('shows a permission message on 403', async () => {
      await render(submission(RECEPTIONIST));
      api.saveDraft.and.returnValue(throwError(() => new ClinicalFormsError('forbidden', 403, 'Your role cannot change this section.')));
      button('save-draft')!.click();
      await settle();
      expect(q('action-error')?.textContent).toContain('Your role cannot change this section.');
    });

    it('shows not found for submissions outside the hospital', async () => {
      await render(submission([]));
      api.getSubmission.and.returnValue(throwError(() => new ClinicalFormsError('notFound', 404, 'Submission not found.')));
      fixture.componentInstance.load();
      await settle();
      expect(q('load-error')?.textContent).toContain('Submission not found.');
    });

    it('offers retry on network errors', async () => {
      await render(submission([]));
      api.getSubmission.and.returnValue(throwError(() => new ClinicalFormsError('network', 0, 'The server could not be reached.')));
      fixture.componentInstance.load();
      await settle();
      expect(q('load-error')?.querySelector('button')?.textContent).toContain('Retry');
    });
  });

  // ------------------------------------------------------------------ Phase 6: signatures, attachments, PDF

  describe('consent signatures', () => {
    const signedConsents = (records: ClinicalFormConsentRecord[] = []): ClinicalFormConsents => ({
      submissionId: 's-1',
      status: [{ consentType: 'physio-general', consentVersion: '1.0', consentText: 'I agree to the assessment.', required: true, satisfied: false, requiresSignature: true, allowGuardian: true }],
      records,
    });
    const record = (extra: Partial<ClinicalFormConsentRecord> = {}): ClinicalFormConsentRecord => ({
      id: 'c-1', consentType: 'physio-general', consentVersion: '1.0', consentText: 'I agree to the assessment.', consentTextHash: 'h', isAccepted: true,
      signerType: ConsentSignerType.Patient, patientNameSnapshot: 'Asha Verma', respondedAt: '2026-11-23T10:00:00Z', capturedBy: 'u-1', isCurrent: true,
      hasSignature: true, signatureAttachmentId: 'sig-1', ...extra,
    });
    const SIGNATURE = 'data:image/png;base64,iVBORw0KGgo=';

    it('requires a drawn signature before accepting, then sends it with the response', async () => {
      await render(submission(RECEPTIONIST), signedConsents());
      expect(q('signature-area')).toBeTruthy();
      expect(el().querySelector('[data-test="signature-area"]')?.textContent).toContain('Patient signature');

      button('consent-accept')!.click();
      await settle();
      expect(api.recordConsent).not.toHaveBeenCalled();
      expect(q('consent-error')?.textContent).toContain('must sign');

      fixture.componentInstance.onSignature('physio-general', SIGNATURE);
      api.recordConsent.and.returnValue(of(signedConsents([record()])));
      await settle();
      button('consent-accept')!.click();
      await settle();
      expect(api.recordConsent).toHaveBeenCalledWith('s-1', jasmine.objectContaining({ isAccepted: true, signatureImage: SIGNATURE, signerType: ConsentSignerType.Patient }));
      expect(fixture.componentInstance.consentSignatures()['physio-general']).toBeNull(); // cleared for the next response
      expect(q('consent-signed')).toBeTruthy();
    });

    it('labels the pad for the guardian when a guardian responds', async () => {
      await render(submission(RECEPTIONIST), signedConsents());
      fixture.componentInstance.updateCapture('physio-general', { signerType: ConsentSignerType.Guardian });
      await settle();
      expect(el().querySelector('[data-test="signature-area"]')?.textContent).toContain('Guardian signature');
    });

    it('records a refusal without a signature', async () => {
      await render(submission(RECEPTIONIST), signedConsents());
      api.recordConsent.and.returnValue(of(signedConsents([record({ isAccepted: false, hasSignature: false, signatureAttachmentId: null })])));
      button('consent-refuse')!.click();
      await settle();
      expect(api.recordConsent).toHaveBeenCalledWith('s-1', jasmine.objectContaining({ isAccepted: false, signatureImage: null }));
    });

    it('shows a recorded signature through the authorized download', async () => {
      await render(submission(RECEPTIONIST), signedConsents([record()]));
      api.downloadAttachment.and.returnValue(of({ blob: new Blob(['x'], { type: 'image/png' }), fileName: 'signature.png', contentType: 'image/png' }));
      button('view-signature')!.click();
      await settle();
      expect(api.downloadAttachment).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'sig-1' }));
      expect(q('viewer-image')?.getAttribute('src')).toMatch(/^blob:/);
      button('viewer-close')!.click();
      await settle();
      expect(q('file-viewer')).toBeNull();
    });

    it('flags an acceptance that is missing a required signature', async () => {
      await render(submission(RECEPTIONIST), signedConsents([record({ hasSignature: false, signatureAttachmentId: null })]));
      expect(q('consent-unsigned')).toBeTruthy();
    });
  });

  describe('attachments', () => {
    const file = (extra: Partial<ClinicalFormAttachment> = {}): ClinicalFormAttachment => ({
      id: 'a-1', submissionId: 's-1', attachmentType: ClinicalAttachmentType.Opg, fileName: 'opg.png', contentType: 'image/png', fileSize: 2048,
      sha256: 'f'.repeat(64), uploadedBy: 'u-1', uploadedAt: '2026-11-23T10:00:00Z', isReferenced: false, isSignature: false, ...extra,
    });

    function choose(input: HTMLInputElement, name: string, type: string, bytes = 100): void {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(bytes)], name, { type }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
    }

    it('lists files, hides signatures, and protects files used in the form', async () => {
      attachmentList = [file(), file({ id: 'a-2', fileName: 'photo.jpg', isReferenced: true }), file({ id: 'sig', fileName: 'signature.png', isSignature: true })];
      await render(submission(RECEPTIONIST));
      const rows = el().querySelectorAll('[data-test="file-row"]');
      expect(rows.length).toBe(2);
      expect(rows[0].querySelector('[data-test="file-delete"]')).toBeTruthy();
      expect(rows[1].querySelector('[data-test="file-delete"]')).toBeNull();
      expect(rows[1].textContent).toContain('In form');
    });

    it('removes a file only with a reason', async () => {
      attachmentList = [file()];
      await render(submission(RECEPTIONIST));
      button('file-delete')!.click();
      await settle();
      button('confirm-delete')!.click();
      await settle();
      expect(api.deleteAttachment).not.toHaveBeenCalled();
      expect(q('delete-error')?.textContent).toContain('reason');

      type('[data-test="delete-reason"]', 'Wrong patient image');
      api.deleteAttachment.and.returnValue(of(file()));
      await settle();
      button('confirm-delete')!.click();
      await settle();
      expect(api.deleteAttachment).toHaveBeenCalledWith('a-1', 'Wrong patient image');
      expect(el().querySelectorAll('[data-test="file-row"]').length).toBe(0);
    });

    it('shows the server reason when removal is refused', async () => {
      attachmentList = [file()];
      await render(submission(RECEPTIONIST));
      button('file-delete')!.click();
      await settle();
      type('[data-test="delete-reason"]', 'x');
      api.deleteAttachment.and.returnValue(throwError(() => new ClinicalFormsError('validation', 400, 'Invalid',
        [{ code: 'AttachmentInUse', path: 'attachmentId', message: 'The file is used in the form. Remove it from the form and save first.' }])));
      await settle();
      button('confirm-delete')!.click();
      await settle();
      expect(q('delete-error')?.textContent).toContain('used in the form');
    });

    it('uploads with progress and rejects unsupported files before sending', async () => {
      await render(submission(RECEPTIONIST));
      const input = el().querySelector<HTMLInputElement>('[data-test="panel-upload-input"]')!;
      choose(input, 'setup.exe', 'application/octet-stream');
      await settle();
      expect(api.uploadAttachment).not.toHaveBeenCalled();
      expect(q('panel-upload-error')?.textContent).toContain('Only PDF, JPEG and PNG');

      const events = new Subject<AttachmentUploadEvent>();
      api.uploadAttachment.and.returnValue(events);
      choose(input, 'opg.png', 'image/png');
      await settle();
      expect(api.uploadAttachment).toHaveBeenCalledWith('s-1', jasmine.objectContaining({ attachmentType: ClinicalAttachmentType.Other }));
      events.next({ kind: 'progress', percent: 40 });
      await settle();
      expect(q('panel-upload-progress')?.getAttribute('aria-valuenow')).toBe('40');
      events.next({ kind: 'done', attachment: file() });
      events.complete();
      await settle();
      expect(q('panel-upload-progress')).toBeNull();
      expect(el().querySelectorAll('[data-test="file-row"]').length).toBe(1);
    });

    it('shows upload validation errors from the server', async () => {
      await render(submission(RECEPTIONIST));
      api.uploadAttachment.and.returnValue(throwError(() => new ClinicalFormsError('validation', 400, 'The file was rejected.',
        [{ code: 'FileContentMismatch', path: 'file', message: 'The file content does not match its type or the file is damaged.' }])));
      choose(el().querySelector<HTMLInputElement>('[data-test="panel-upload-input"]')!, 'xray.png', 'image/png');
      await settle();
      expect(q('panel-upload-error')?.textContent).toContain('does not match its type');
    });

    it('follows the lifecycle rules for who may change files', async () => {
      await render(submission(RECEPTIONIST, SubmissionStatus.Submitted), consents(true));
      expect(q('panel-upload')).toBeNull(); // receptionists cannot change submitted records
      fixture.destroy();
      TestBed.resetTestingModule();

      await render(submission(DOCTOR, SubmissionStatus.Submitted), consents(true));
      expect(q('panel-upload')).toBeTruthy();
      fixture.destroy();
      TestBed.resetTestingModule();

      await render(submission(DOCTOR, SubmissionStatus.Voided), consents(true));
      expect(q('panel-upload')).toBeNull();
    });

    it('uploads into an attachment field and saves the reference with the draft', async () => {
      const detail = submission(DOCTOR);
      await render(detail);
      api.uploadAttachment.and.returnValue(of<AttachmentUploadEvent>({ kind: 'done', attachment: file({ id: 'img-1', attachmentType: ClinicalAttachmentType.ClinicalPhoto, fileName: 'knee.jpg' }) }));
      choose(el().querySelector<HTMLInputElement>('[data-field="assessment.images"] [data-test="attachment-input"]')!, 'knee.jpg', 'image/jpeg');
      await settle();

      expect(api.uploadAttachment).toHaveBeenCalledWith('s-1', jasmine.objectContaining({
        sectionKey: 'assessment', fieldKey: 'images', attachmentType: ClinicalAttachmentType.ClinicalPhoto,
      }));
      expect(el().querySelector('[data-field="assessment.images"] [data-test="attached-file"]')?.textContent).toContain('knee.jpg');

      api.saveDraft.and.returnValue(of(detail));
      button('save-draft')!.click();
      await settle();
      expect(api.saveDraft.calls.mostRecent().args[1]['assessment']['images']).toEqual(['img-1']);
    });

    it('does not offer field uploads to roles that cannot edit the section', async () => {
      await render(submission(RECEPTIONIST));
      expect(el().querySelector('[data-field="assessment.images"] [data-test="attachment-input"]')).toBeNull();
    });
  });

  describe('PDF', () => {
    const pdf = () => ({ blob: new Blob(['%PDF-1.7'], { type: 'application/pdf' }), fileName: 'physio-assessment-rev1.pdf', contentType: 'application/pdf' });

    it('is not offered for drafts', async () => {
      await render(submission(DOCTOR));
      expect(q('pdf-preview')).toBeNull();
    });

    it('previews the current version in the page and downloads it', async () => {
      await render(submission(DOCTOR, SubmissionStatus.Submitted), consents(true));
      api.downloadPdf.and.returnValue(of(pdf()));
      button('pdf-preview')!.click();
      await settle();
      expect(api.downloadPdf).toHaveBeenCalledWith('s-1', 'physio-assessment-rev1.pdf', undefined);
      expect(q('viewer-pdf')).toBeTruthy();

      const save = spyOn(fixture.componentInstance, 'triggerDownload');
      button('pdf-download')!.click();
      await settle();
      expect(save).toHaveBeenCalledWith(jasmine.objectContaining({ fileName: 'physio-assessment-rev1.pdf' }));
    });

    it('generates the PDF of a historical revision', async () => {
      await render(submission(DOCTOR, SubmissionStatus.Amended), consents(true));
      api.getRevisions.and.returnValue(of([{ revisionNumber: 1, changeType: 1, changedBy: 'u-1', changedAt: '2026-11-23T11:00:00Z', answersHash: 'a' }]));
      fixture.componentInstance.loadRevisions();
      await settle();
      api.downloadPdf.and.returnValue(of(pdf()));
      button('revision-pdf')!.click();
      await settle();
      expect(api.downloadPdf).toHaveBeenCalledWith('s-1', 'physio-assessment-rev1.pdf', 1);
      expect(q('file-viewer')?.textContent).toContain('revision 1');
    });

    it('reports failed downloads and retries', async () => {
      await render(submission(DOCTOR, SubmissionStatus.Submitted), consents(true));
      api.downloadPdf.and.returnValue(throwError(() => new ClinicalFormsError('unavailable', 503, 'The PDF could not be generated. Please try again later.')));
      button('pdf-preview')!.click();
      await settle();
      expect(q('file-error')?.textContent).toContain('could not be generated');

      api.downloadPdf.and.returnValue(of(pdf()));
      button('file-retry')!.click();
      await settle();
      expect(api.downloadPdf).toHaveBeenCalledTimes(2);
      expect(q('viewer-pdf')).toBeTruthy();
    });

    it('explains access-denied and network failures', async () => {
      await render(submission(DOCTOR, SubmissionStatus.Submitted), consents(true));
      api.downloadPdf.and.returnValue(throwError(() => new ClinicalFormsError('forbidden', 403, 'Forbidden')));
      button('pdf-preview')!.click();
      await settle();
      expect(q('file-error')?.textContent).toContain('do not have permission');

      api.downloadPdf.and.returnValue(throwError(() => new ClinicalFormsError('network', 0, 'Offline')));
      button('file-retry')!.click();
      await settle();
      expect(q('file-error')?.textContent).toContain('Check your connection');
    });
  });
});
