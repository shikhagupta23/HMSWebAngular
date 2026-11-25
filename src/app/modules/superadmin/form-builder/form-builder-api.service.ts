import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';
import { ClinicalFormApiResponse, PagedResponse } from '../../doctor/modules/clinical-forms/models/clinical-forms.models';
import { ClinicalFormsError, toClinicalFormsError } from '../../doctor/modules/clinical-forms/services/clinical-forms-error';
import {
  CreateDraftVersionRequest,
  CreateFormTemplateRequest,
  FormTemplateDetail,
  FormTemplateSummary,
  FormVersionDetail,
  UpdateDraftVersionRequest,
  UpdateFormTemplateRequest,
} from './form-builder.models';

/**
 * Client for the global template API (SuperAdmin only; the server authorizes every call).
 * Failures surface as ClinicalFormsError, like the rest of Clinical Forms.
 */
@Injectable({ providedIn: 'root' })
export class FormBuilderApiService {
  private readonly api = inject(ApiService);
  private readonly urls = ApiEndpoints.CLINICAL_FORM_TEMPLATES;

  getTemplates(): Observable<FormTemplateSummary[]> {
    return this.api.get<PagedResponse<FormTemplateSummary>>(this.urls.TEMPLATES, { page: '1', pageSize: '100', includeInactive: 'true' }).pipe(
      map((r) => r?.dataList ?? []),
      catchError((error) => throwError(() => toClinicalFormsError(error))),
    );
  }

  getTemplate(id: string): Observable<FormTemplateDetail> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<FormTemplateDetail>>(this.urls.TEMPLATE(id)));
  }

  createTemplate(request: CreateFormTemplateRequest): Observable<FormTemplateDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<FormTemplateDetail>>(this.urls.CREATE_TEMPLATE, request));
  }

  updateTemplate(id: string, request: UpdateFormTemplateRequest): Observable<FormTemplateDetail> {
    return this.unwrap(this.api.put<ClinicalFormApiResponse<FormTemplateDetail>>(this.urls.UPDATE_TEMPLATE(id), request));
  }

  setTemplateStatus(id: string, isActive: boolean): Observable<FormTemplateDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<FormTemplateDetail>>(this.urls.SET_TEMPLATE_STATUS(id), { isActive }));
  }

  getVersion(id: string): Observable<FormVersionDetail> {
    return this.unwrap(this.api.get<ClinicalFormApiResponse<FormVersionDetail>>(this.urls.VERSION(id)));
  }

  createDraftVersion(templateId: string, request: CreateDraftVersionRequest): Observable<FormVersionDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<FormVersionDetail>>(this.urls.CREATE_DRAFT_VERSION(templateId), request));
  }

  updateDraftVersion(id: string, request: UpdateDraftVersionRequest): Observable<FormVersionDetail> {
    return this.unwrap(this.api.put<ClinicalFormApiResponse<FormVersionDetail>>(this.urls.UPDATE_DRAFT_VERSION(id), request));
  }

  deleteDraftVersion(id: string, rowVersion: string): Observable<boolean> {
    return this.unwrap(this.api.delete<ClinicalFormApiResponse<boolean>>(this.urls.DELETE_DRAFT_VERSION(id, rowVersion)));
  }

  publishVersion(id: string, rowVersion: string): Observable<FormVersionDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<FormVersionDetail>>(this.urls.PUBLISH_VERSION(id), { rowVersion }));
  }

  archiveVersion(id: string, rowVersion: string): Observable<FormVersionDetail> {
    return this.unwrap(this.api.post<ClinicalFormApiResponse<FormVersionDetail>>(this.urls.ARCHIVE_VERSION(id), { rowVersion }));
  }

  private unwrap<T>(request: Observable<ClinicalFormApiResponse<T>>): Observable<T> {
    return request.pipe(
      map((response) => {
        if (!response || response.isSuccess === false)
          throw new ClinicalFormsError('validation', 200, response?.message || 'The request was not successful.', response?.errors ?? []);
        return response.data;
      }),
      catchError((error) => throwError(() => (error instanceof ClinicalFormsError ? error : toClinicalFormsError(error)))),
    );
  }
}
