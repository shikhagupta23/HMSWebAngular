import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { ClinicalFormsModule } from '../../clinical-forms-module';
import { PatientClinicalForms } from './patient-clinical-forms';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsAccessService } from '../../services/clinical-forms-access-service';
import { ClinicalFormsError } from '../../services/clinical-forms-error';
import { ApiService } from '../../../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../../../shared/constants/api-endpoints';
import { ToastService } from '../../../../../../shared/services/toast-service';
import {
  ClinicalFormAccess,
  ClinicalFormPermission,
  ClinicalFormSubmissionDetail,
  ClinicalFormSubmissionSummary,
  EnabledClinicalForm,
  PagedResponse,
  SubmissionStatus,
} from '../../models/clinical-forms.models';

const PATIENT = 'aaaaaaaa-0000-0000-0000-000000000001';
const APPT = 'bbbbbbbb-0000-0000-0000-000000000001';
const CANCELLED_APPT = 'bbbbbbbb-0000-0000-0000-000000000002';
const OTHER_PATIENT_APPT = 'bbbbbbbb-0000-0000-0000-000000000099';
const DENTAL: EnabledClinicalForm = {
  templateId: 't-dental', formKey: 'dental-intake', formName: 'Dental Patient Intake', specialty: 'dental', templateVersionId: 'v-1', versionNumber: 1,
};

function summary(id: string, status: SubmissionStatus, appointmentId: string | null): ClinicalFormSubmissionSummary {
  return {
    id, patientId: PATIENT, templateId: DENTAL.templateId, formKey: DENTAL.formKey, formName: DENTAL.formName, templateVersionId: 'v-1',
    versionNumber: 1, appointmentId, status, currentRevisionNumber: 0, createdAt: '2026-11-20T09:00:00Z', createdBy: 'u-1',
  };
}

function paged(list: ClinicalFormSubmissionSummary[]): PagedResponse<ClinicalFormSubmissionSummary> {
  return { isSuccess: true, message: '', dataList: list, pageNumber: 1, pageSize: 50, totalCount: list.length, totalPages: 1 };
}

describe('PatientClinicalForms (entry point)', () => {
  let fixture: ComponentFixture<PatientClinicalForms>;
  let api: jasmine.SpyObj<ClinicalFormsApiService>;
  let router: Router;
  let access: ClinicalFormAccess;

  async function render(options: {
    query?: Record<string, string>;
    submissions?: ClinicalFormSubmissionSummary[] | Observable<never>;
    permissions?: ClinicalFormPermission[];
  } = {}) {
    access = { isEnabled: true, permissions: options.permissions ?? ['ViewPatientForms', 'FillPatientForms'] };
    api = jasmine.createSpyObj<ClinicalFormsApiService>('ClinicalFormsApiService', ['getPatientSubmissions', 'getEnabledForms', 'createDraft']);
    api.getPatientSubmissions.and.returnValue(
      options.submissions instanceof Observable ? options.submissions : of(paged(options.submissions ?? [])));
    api.getEnabledForms.and.returnValue(of([DENTAL]));

    const sharedApi = {
      get: (url: string) => {
        if (url === ApiEndpoints.User.GET_BY_ID(PATIENT))
          return of({ isSuccess: true, data: { userId: PATIENT, fullName: 'Asha Verma', gender: 'Female', patientViewId: 1042 } });
        // Existing appointment history API; the other patient's appointment must never be accepted.
        return of({ dataList: [
          { appointmentId: APPT, patientId: PATIENT, appointmentViewId: 501, appointmentDate: '2026-11-23T10:00:00', doctorName: 'Rao', appointmentStatus: 0 },
          { appointmentId: CANCELLED_APPT, patientId: PATIENT, appointmentViewId: 502, appointmentDate: '2026-11-22T10:00:00', appointmentStatus: 4 },
        ] });
      },
    };
    const accessService = { load: () => of(access), access: () => access, isEnabled: () => true, has: (p: ClinicalFormPermission) => access.permissions.includes(p) };

    await TestBed.configureTestingModule({
      imports: [ClinicalFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ patientId: PATIENT })),
            snapshot: { paramMap: convertToParamMap({ patientId: PATIENT }), queryParamMap: convertToParamMap(options.query ?? {}) },
          },
        },
        { provide: ClinicalFormsApiService, useValue: api },
        { provide: ClinicalFormsAccessService, useValue: accessService },
        { provide: ApiService, useValue: sharedApi },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']) },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(PatientClinicalForms);
    await settle();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (test: string) => el().querySelector<HTMLElement>(`[data-test="${test}"]`);
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('opened from the patient page: shows the form history read-only, without starting forms', async () => {
    await render({ submissions: [summary('s-1', SubmissionStatus.Submitted, APPT), summary('s-2', SubmissionStatus.Voided, null)] });
    expect(api.getPatientSubmissions).toHaveBeenCalledWith(PATIENT, { includeVoided: true });
    expect(q('page-title')?.textContent).toContain('Form history');
    expect(q('patient-name')?.textContent).toContain('Asha Verma');
    expect(el().querySelector('[data-form="dental-intake"]')).toBeNull();
    expect(q('start')).toBeNull();
    expect(q('history-hint')?.textContent).toContain('All Appointments');
    expect(el().querySelectorAll('[data-test="submission-row"]').length).toBe(1); // voided hidden by default
    expect(el().querySelector('[data-test="submission-row"]')?.textContent).toContain('#501');

    el().querySelector<HTMLInputElement>('#cf-include-voided')!.click();
    await settle();
    expect(el().querySelectorAll('[data-test="submission-row"]').length).toBe(2);
  });

  it('history leaves visit drafts to the appointment lists and offers older unlinked drafts', async () => {
    await render({ submissions: [summary('s-visit', SubmissionStatus.Draft, APPT), summary('s-old', SubmissionStatus.Draft, null)] });
    expect(el().querySelectorAll('[data-test="submission-row"]').length).toBe(0);
    expect(q('visit-drafts')?.textContent).toContain('1 form(s)');
    q('open-draft')!.click();
    await settle();
    expect(router.navigate).toHaveBeenCalledWith(['/clinical-forms/submissions', 's-old'], { queryParams: { patientId: PATIENT, appointmentId: null } });
  });

  it('starts Dental Intake for the appointment it was opened from', async () => {
    await render({ query: { appointmentId: APPT } });
    expect(q('page-title')?.textContent).toContain('Visit forms');
    expect(q('appointment-context')?.textContent).toContain('#501');
    api.createDraft.and.returnValue(of({ id: 's-new' } as ClinicalFormSubmissionDetail));

    q('start')!.click();
    await settle();

    expect(api.createDraft).toHaveBeenCalledWith(PATIENT, { templateId: 't-dental', appointmentId: APPT });
    expect(router.navigate).toHaveBeenCalledWith(['/clinical-forms/submissions', 's-new'], { queryParams: { patientId: PATIENT, appointmentId: APPT } });
  });

  it('shows a submitted form of the visit as "View form" instead of starting another', async () => {
    await render({ query: { appointmentId: APPT }, submissions: [summary('s-1', SubmissionStatus.Submitted, APPT)] });
    expect(q('start')).toBeNull();
    expect(q('open-existing')?.textContent).toContain('View form');
  });

  it('rejects an appointment that does not belong to the patient', async () => {
    await render({ query: { appointmentId: OTHER_PATIENT_APPT } });
    expect(q('context-error')?.textContent).toContain('does not belong to this patient');
    expect(q('appointment-context')).toBeNull();
    expect(q('start')).toBeNull();
    expect(api.createDraft).not.toHaveBeenCalled();
  });

  it('does not allow a cancelled appointment', async () => {
    await render({ query: { appointmentId: CANCELLED_APPT } });
    expect(q('context-error')?.textContent).toContain('cancelled');
    expect(q('start')).toBeNull();
  });

  it('opens the existing submission instead of creating a duplicate for the same appointment', async () => {
    await render({ query: { appointmentId: APPT }, submissions: [summary('s-1', SubmissionStatus.Draft, APPT)] });
    expect(q('start')).toBeNull();
    expect(q('existing-for-appointment')).toBeTruthy();
    expect(q('open-existing')?.textContent).toContain('Continue filling');

    q('open-existing')!.click();
    await settle();
    expect(api.createDraft).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/clinical-forms/submissions', 's-1'], { queryParams: { patientId: PATIENT, appointmentId: APPT } });
  });

  it('allows a new submission for the appointment once the previous one was voided', async () => {
    await render({ query: { appointmentId: APPT }, submissions: [summary('s-1', SubmissionStatus.Voided, APPT)] });
    expect(q('start')).toBeTruthy();
  });

  it('handles the server\'s duplicate rejection (409) by refreshing and offering the existing record', async () => {
    await render({ query: { appointmentId: APPT } });
    api.createDraft.and.returnValue(throwError(() => new ClinicalFormsError('conflict', 409, 'This form already has an active submission for the appointment.')));
    api.getPatientSubmissions.and.returnValue(of(paged([summary('s-other', SubmissionStatus.Draft, APPT)])));

    q('start')!.click();
    await settle();

    expect(q('create-error')?.textContent).toContain('already been started');
    expect(q('open-existing')).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows server validation messages when a draft cannot be created', async () => {
    await render({ query: { appointmentId: APPT } });
    api.createDraft.and.returnValue(throwError(() => new ClinicalFormsError('validation', 400, 'Invalid.',
      [{ code: 'FormNotEnabled', path: 'templateId', message: 'This form is not enabled for the hospital.' }])));
    q('start')!.click();
    await settle();
    expect(q('create-error')?.textContent).toContain('not enabled for the hospital');
  });

  it('does not offer to start forms to roles that can only view', async () => {
    await render({ query: { appointmentId: APPT }, permissions: ['ViewPatientForms'] });
    expect(q('start')).toBeNull();
    expect(q('cannot-start')).toBeTruthy();
  });

  it('shows not found for a patient outside the user\'s hospital', async () => {
    await render({ submissions: throwError(() => new ClinicalFormsError('notFound', 404, 'Patient not found.')) });
    expect(q('load-error')?.textContent).toContain('Patient not found.');
    expect(q('start')).toBeNull();
  });
});
