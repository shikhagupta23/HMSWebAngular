import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../../../../../shared/services/toast-service';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsAccessService } from '../../services/clinical-forms-access-service';
import { ClinicalFormsError, toClinicalFormsError } from '../../services/clinical-forms-error';
import {
  APPOINTMENT_CANCELLED,
  ClinicalFormsAppointment,
  ClinicalFormsContextService,
  ClinicalFormsPatient,
  appointmentStatusText,
  sameId,
} from '../../services/clinical-forms-context-service';
import { ClinicalFormSubmissionSummary, EnabledClinicalForm, SubmissionStatus } from '../../models/clinical-forms.models';

/**
 * Patient workspace for clinical forms (route: /clinical-forms/patients/:patientId?appointmentId=…).
 * Entry point from the existing patient details and appointment screens: lists the patient's
 * submissions and starts a form for the patient, optionally linked to one of the patient's appointments.
 *
 * The patient is authorized by the server (getPatientSubmissions returns 404 for a patient outside the
 * user's hospital); duplicates per appointment + form are rejected by the server (409) and surfaced here.
 */
@Component({
  selector: 'app-patient-clinical-forms',
  standalone: false,
  templateUrl: './patient-clinical-forms.html',
})
export class PatientClinicalForms implements OnInit {
  private readonly api = inject(ClinicalFormsApiService);
  private readonly context = inject(ClinicalFormsContextService);
  private readonly accessService = inject(ClinicalFormsAccessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Status = SubmissionStatus;
  readonly statusText = appointmentStatusText;

  readonly patientId = signal('');
  readonly patient = signal<ClinicalFormsPatient | null>(null);
  readonly appointments = signal<ClinicalFormsAppointment[]>([]);
  readonly forms = signal<EnabledClinicalForm[]>([]);
  readonly submissions = signal<ClinicalFormSubmissionSummary[]>([]);
  readonly selectedAppointmentId = signal<string | null>(null);
  readonly includeVoided = signal(false);

  readonly loading = signal(true);
  readonly loadError = signal<ClinicalFormsError | null>(null);
  /** Requested appointment that is not one of this patient's (bookable) appointments. */
  readonly contextError = signal<string | null>(null);
  readonly creating = signal<string | null>(null);
  readonly createError = signal<string | null>(null);

  readonly canStart = computed(() => this.accessService.access().permissions.includes('FillPatientForms'));
  readonly selectableAppointments = computed(() => this.appointments().filter((a) => a.status !== APPOINTMENT_CANCELLED));
  readonly selectedAppointment = computed(() =>
    this.appointments().find((a) => sameId(a.appointmentId, this.selectedAppointmentId())) ?? null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.patientId.set(params.get('patientId') ?? '');
      this.load();
    });
  }

  load(): void {
    const patientId = this.patientId();
    this.loading.set(true);
    this.loadError.set(null);
    this.contextError.set(null);
    this.createError.set(null);

    forkJoin({
      access: this.accessService.load(),
      submissions: this.api.getPatientSubmissions(patientId, { includeVoided: true }),
      forms: this.api.getEnabledForms(),
      patient: this.context.getPatient(patientId),
      appointments: this.context.getAppointments(patientId),
    }).subscribe({
      next: ({ submissions, forms, patient, appointments }) => {
        this.submissions.set(submissions.dataList ?? []);
        this.forms.set(forms ?? []);
        this.patient.set(patient);
        this.appointments.set(appointments);
        this.applyRequestedAppointment(this.route.snapshot.queryParamMap.get('appointmentId'));
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(toClinicalFormsError(error));
        this.loading.set(false);
      },
    });
  }

  /** Accepts an appointment from the entry point only if it is one of this patient's non-cancelled appointments. */
  private applyRequestedAppointment(requested: string | null): void {
    if (!requested) {
      this.selectedAppointmentId.set(null);
      return;
    }
    const match = this.appointments().find((a) => sameId(a.appointmentId, requested));
    if (!match) {
      this.selectedAppointmentId.set(null);
      this.contextError.set('The selected appointment does not belong to this patient. Choose one of the patient’s appointments.');
    } else if (match.status === APPOINTMENT_CANCELLED) {
      this.selectedAppointmentId.set(null);
      this.contextError.set('The selected appointment is cancelled. Forms cannot be started for it.');
    } else {
      this.selectedAppointmentId.set(match.appointmentId);
    }
  }

  selectAppointment(appointmentId: string): void {
    this.contextError.set(null);
    this.createError.set(null);
    this.selectedAppointmentId.set(appointmentId || null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { appointmentId: appointmentId || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  visibleSubmissions(): ClinicalFormSubmissionSummary[] {
    return this.includeVoided() ? this.submissions() : this.submissions().filter((s) => s.status !== SubmissionStatus.Voided);
  }

  /** The active (non-voided) submission of this form for the selected appointment, if any. */
  activeForAppointment(templateId: string): ClinicalFormSubmissionSummary | null {
    const appointmentId = this.selectedAppointmentId();
    if (!appointmentId) return null;
    return this.submissions().find((s) => s.templateId === templateId && s.status !== SubmissionStatus.Voided
      && sameId(s.appointmentId, appointmentId)) ?? null;
  }

  /** Drafts of this form for the patient that are not tied to an appointment. */
  openDraftsWithoutAppointment(templateId: string): ClinicalFormSubmissionSummary[] {
    return this.submissions().filter((s) => s.templateId === templateId && s.status === SubmissionStatus.Draft && !s.appointmentId);
  }

  appointmentLabel(appointmentId: string | null | undefined): string {
    if (!appointmentId) return 'No appointment';
    const appointment = this.appointments().find((a) => sameId(a.appointmentId, appointmentId));
    return appointment?.appointmentViewId ? `#${appointment.appointmentViewId}` : 'Appointment';
  }

  start(form: EnabledClinicalForm): void {
    if (this.creating()) return;
    const existing = this.activeForAppointment(form.templateId);
    if (existing) {
      this.open(existing);
      return;
    }
    const appointmentId = this.selectedAppointmentId();
    this.creating.set(form.templateId);
    this.createError.set(null);
    this.api.createDraft(this.patientId(), { templateId: form.templateId, appointmentId }).subscribe({
      next: (submission) => {
        this.creating.set(null);
        this.toast.success('Draft created.');
        this.router.navigate(['/clinical-forms/submissions', submission.id], {
          queryParams: { patientId: this.patientId(), appointmentId: appointmentId ?? null },
        });
      },
      error: (raw) => {
        this.creating.set(null);
        const error = toClinicalFormsError(raw);
        if (error.isConflict) {
          // Someone already started this form for the appointment: refresh and offer the existing record.
          this.createError.set('This form has already been started for the selected appointment. Open the existing submission instead.');
          this.refreshSubmissions();
          return;
        }
        this.createError.set(error.errors[0]?.message ?? error.message);
      },
    });
  }

  open(submission: ClinicalFormSubmissionSummary): void {
    this.router.navigate(['/clinical-forms/submissions', submission.id], {
      queryParams: { patientId: this.patientId(), appointmentId: submission.appointmentId ?? null },
    });
  }

  private refreshSubmissions(): void {
    this.api.getPatientSubmissions(this.patientId(), { includeVoided: true }).subscribe({
      next: (result) => this.submissions.set(result.dataList ?? []),
      error: () => undefined,
    });
  }
}
