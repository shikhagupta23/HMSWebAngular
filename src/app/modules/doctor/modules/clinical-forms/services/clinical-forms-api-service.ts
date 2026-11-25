import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { ApiService } from '../../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';
import {
  AttachmentUploadEvent,
  ClinicalFormAccess,
  ClinicalFormAttachment,
  ClinicalFormApiResponse,
  ClinicalFormConsents,
  ClinicalFormRevisionDetail,
  ClinicalFormRevisionSummary,
  ClinicalFormSubmissionCheck,
  ClinicalFormSubmissionDetail,
  ClinicalFormSubmissionSummary,
  CreateSubmissionRequest,
  DownloadedFile,
  EffectiveClinicalForm,
  EnableHospitalClinicalFormRequest,
  EnabledClinicalForm,
  HospitalAvailableClinicalForm,
  HospitalClinicalFormPreview,
  HospitalClinicalFormState,
  PreviewHospitalClinicalFormRequest,
  UpdateHospitalClinicalFormRequest,
  FormAnswers,
  PagedResponse,
  RecordConsentRequest,
  UploadAttachmentRequest,
} from '../models/clinical-forms.models';
import { ClinicalFormsError, toClinicalFormsError } from './clinical-forms-error';

/**
 * Typed client for the Clinical Forms APIs. Built on the shared ApiService, so the existing auth and
 * loader interceptors apply. Every call unwraps the ApiResponse envelope and fails with a
 * ClinicalFormsError (validation/forbidden/notFound/conflict/...) instead of a raw HttpErrorResponse.
 * The hospital is never sent: the server takes it from the authenticated user.
 */
@Injectable({ providedIn: 'root' })
export class ClinicalFormsApiService {
  private readonly api = inject(ApiService);
  /** Direct HttpClient for upload progress and binary downloads (the global auth/loader interceptors still apply). */
  private readonly http = inject(HttpClient);
  private readonly urls = ApiEndpoints.CLINICAL_FORMS;

  // ------------------------------------------------------------------ access & forms

  getAccess(): Observable<ClinicalFormAccess> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<ClinicalFormAccess>>(this.urls.ACCESS));
  }

  getEnabledForms(): Observable<EnabledClinicalForm[]> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<EnabledClinicalForm[]>>(this.urls.ENABLED_FORMS));
  }

  getEffectiveForm(templateId: string): Observable<EffectiveClinicalForm> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<EffectiveClinicalForm>>(this.urls.EFFECTIVE_FORM(templateId)));
  }

  // ------------------------------------------------------------------ hospital configuration (Admin)
  // None of these send a hospital id: the server always uses the authenticated caller's hospital.

  getAvailableForms(): Observable<HospitalAvailableClinicalForm[]> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<HospitalAvailableClinicalForm[]>>(this.urls.AVAILABLE_FORMS));
  }

  enableForm(request: EnableHospitalClinicalFormRequest): Observable<HospitalClinicalFormState> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<HospitalClinicalFormState>>(this.urls.ENABLE_FORM, request));
  }

  disableForm(templateId: string): Observable<HospitalClinicalFormState> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<HospitalClinicalFormState>>(this.urls.DISABLE_FORM(templateId), {}));
  }

  updateConfiguration(templateId: string, request: UpdateHospitalClinicalFormRequest): Observable<HospitalClinicalFormState> {
    return this.unwrap(this.api.put<ClinicalFormApiResponse<HospitalClinicalFormState>>(this.urls.UPDATE_CONFIGURATION(templateId), request));
  }

  /** Resolves an overlay against a published version without saving anything. */
  previewConfiguration(templateId: string, request: PreviewHospitalClinicalFormRequest): Observable<HospitalClinicalFormPreview> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<HospitalClinicalFormPreview>>(this.urls.PREVIEW_CONFIGURATION(templateId), request));
  }

  // ------------------------------------------------------------------ submissions

  createDraft(patientId: string, request: CreateSubmissionRequest): Observable<ClinicalFormSubmissionDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<ClinicalFormSubmissionDetail>>(this.urls.CREATE_DRAFT(patientId), request));
  }

  getSubmission(id: string): Observable<ClinicalFormSubmissionDetail> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<ClinicalFormSubmissionDetail>>(this.urls.SUBMISSION(id)));
  }

  saveDraft(id: string, answers: FormAnswers, rowVersion: string): Observable<ClinicalFormSubmissionDetail> {
    return this.unwrap(this.api.put<ClinicalFormApiResponse<ClinicalFormSubmissionDetail>>(this.urls.SAVE_DRAFT(id), { answers, rowVersion }));
  }

  checkSubmission(id: string): Observable<ClinicalFormSubmissionCheck> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<ClinicalFormSubmissionCheck>>(this.urls.CHECK_SUBMISSION(id)));
  }

  submit(id: string, answers: FormAnswers | null, rowVersion: string): Observable<ClinicalFormSubmissionDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<ClinicalFormSubmissionDetail>>(this.urls.SUBMIT(id), { answers, rowVersion }));
  }

  amend(id: string, answers: FormAnswers, reason: string, rowVersion: string): Observable<ClinicalFormSubmissionDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<ClinicalFormSubmissionDetail>>(this.urls.AMEND(id), { answers, reason, rowVersion }));
  }

  voidSubmission(id: string, reason: string, rowVersion: string): Observable<ClinicalFormSubmissionDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<ClinicalFormSubmissionDetail>>(this.urls.VOID(id), { reason, rowVersion }));
  }

  getPatientSubmissions(patientId: string, options: { page?: number; pageSize?: number; templateId?: string; includeVoided?: boolean } = {}): Observable<PagedResponse<ClinicalFormSubmissionSummary>> {
    const params: Record<string, string> = {
      page: String(options.page ?? 1),
      pageSize: String(options.pageSize ?? 50),
      includeVoided: String(!!options.includeVoided),
    };
    if (options.templateId) params['templateId'] = options.templateId;
    return this.api.get<PagedResponse<ClinicalFormSubmissionSummary>>(this.urls.PATIENT_SUBMISSIONS(patientId), params).pipe(
      catchError((error) => throwError(() => toClinicalFormsError(error))),
    );
  }

  getRevisions(id: string): Observable<ClinicalFormRevisionSummary[]> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<ClinicalFormRevisionSummary[]>>(this.urls.REVISIONS(id)));
  }

  getRevision(id: string, revisionNumber: number): Observable<ClinicalFormRevisionDetail> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<ClinicalFormRevisionDetail>>(this.urls.REVISION(id, revisionNumber)));
  }

  // ------------------------------------------------------------------ consent

  getConsents(id: string): Observable<ClinicalFormConsents> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<ClinicalFormConsents>>(this.urls.CONSENTS(id)));
  }

  recordConsent(id: string, request: RecordConsentRequest): Observable<ClinicalFormConsents> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<ClinicalFormConsents>>(this.urls.RECORD_CONSENT(id), request));
  }

  // ------------------------------------------------------------------ attachments

  /** Multipart upload with progress. The hospital, patient and storage location are decided by the server. */
  uploadAttachment(submissionId: string, request: UploadAttachmentRequest): Observable<AttachmentUploadEvent> {
    const form = new FormData();
    form.append('file', request.file, request.file.name);
    form.append('attachmentType', String(request.attachmentType));
    if (request.description) form.append('description', request.description);
    if (request.sectionKey) form.append('sectionKey', request.sectionKey);
    if (request.fieldKey) form.append('fieldKey', request.fieldKey);

    return this.http.post<ClinicalFormApiResponse<ClinicalFormAttachment>>(this.urls.UPLOAD_ATTACHMENT(submissionId), form, {
      reportProgress: true,
      observe: 'events',
    }).pipe(
      filter((event) => event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response),
      map((event): AttachmentUploadEvent => {
        if (event.type === HttpEventType.UploadProgress)
          return { kind: 'progress', percent: event.total ? Math.min(99, Math.round((100 * event.loaded) / event.total)) : 0 };
        const body = (event as { body: ClinicalFormApiResponse<ClinicalFormAttachment> | null }).body;
        if (!body || body.isSuccess === false)
          throw new ClinicalFormsError('validation', 200, body?.message || 'The file could not be uploaded.', body?.errors ?? []);
        return { kind: 'done', attachment: body.data };
      }),
      catchError((error) => throwError(() => toClinicalFormsError(error))),
    );
  }

  getAttachments(submissionId: string): Observable<ClinicalFormAttachment[]> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<ClinicalFormAttachment[]>>(this.urls.ATTACHMENTS(submissionId)));
  }

  deleteAttachment(attachmentId: string, reason: string): Observable<ClinicalFormAttachment> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<ClinicalFormAttachment>>(this.urls.DELETE_ATTACHMENT(attachmentId), { reason }));
  }

  /** Authenticated stream of an attachment (or signature) into memory; never a public URL. */
  downloadAttachment(attachment: Pick<ClinicalFormAttachment, 'id' | 'fileName' | 'contentType'>): Observable<DownloadedFile> {
    return this.downloadBlob(this.urls.DOWNLOAD_ATTACHMENT(attachment.id), attachment.fileName, attachment.contentType);
  }

  /** PDF of the current record, or of a historical revision when revisionNumber is given. */
  downloadPdf(submissionId: string, fileName: string, revisionNumber?: number | null): Observable<DownloadedFile> {
    const url = revisionNumber ? this.urls.REVISION_PDF(submissionId, revisionNumber) : this.urls.PDF(submissionId);
    return this.downloadBlob(url, fileName, 'application/pdf');
  }

  // ------------------------------------------------------------------ helpers

  private downloadBlob(url: string, fileName: string, contentType: string): Observable<DownloadedFile> {
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map((blob) => ({ blob, fileName, contentType: blob.type || contentType })),
      catchError((error) => from(readBlobError(error)).pipe(switchMap((normalized) => throwError(() => normalized)))),
    );
  }

  private unwrap<T>(request: Observable<ClinicalFormApiResponse<T>>): Observable<T> {
    return request.pipe(
      map((response) => {
        // Clinical Forms endpoints use real status codes, but guard against a 200 + isSuccess=false body.
        if (!response || response.isSuccess === false)
          throw new ClinicalFormsError('validation', 200, response?.message || 'The request was not successful.', response?.errors ?? []);
        return response.data;
      }),
      catchError((error) => throwError(() => toClinicalFormsError(error))),
    );
  }
}

/** Binary requests deliver JSON error bodies as Blobs; decode them so messages and validation errors survive. */
export async function readBlobError(error: unknown): Promise<ClinicalFormsError> {
  if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
    let body: unknown = null;
    try {
      const text = await error.error.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return toClinicalFormsError(new HttpErrorResponse({ error: body, status: error.status, statusText: error.statusText, url: error.url ?? undefined }));
  }
  return toClinicalFormsError(error);
}
