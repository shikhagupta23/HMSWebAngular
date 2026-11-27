import { Component, DestroyRef, ElementRef, Injector, OnDestroy, OnInit, afterNextRender, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToastService } from '../../../../../../shared/services/toast-service';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsError, toClinicalFormsError } from '../../services/clinical-forms-error';
import {
  ClinicalFormsAppointment,
  ClinicalFormsContextService,
  appointmentStatusText,
  patientFormContext,
  sameId,
} from '../../services/clinical-forms-context-service';
import { ClinicalFormModel, FormIssue } from '../../engine/clinical-form-model';
import { ClinicalFormAttachmentHandler } from '../../renderer/clinical-form-attachment-handler';
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_TYPE_LABELS,
  ClinicalAttachmentType,
  ClinicalFormAttachment,
  ClinicalFormConsentRecord,
  ClinicalFormConsents,
  ClinicalFormRevisionDetail,
  ClinicalFormRevisionSummary,
  ClinicalFormSubmissionDetail,
  ClinicalFormValidationError,
  ConsentDefinition,
  ConsentSignerType,
  PatientFormContext,
  DownloadedFile,
  SubmissionStatus,
  UPLOADABLE_ATTACHMENT_TYPES,
} from '../../models/clinical-forms.models';

/** Per-consent capture inputs (who responds for the patient). */
export interface ConsentCapture {
  signerType: ConsentSignerType;
  guardianName: string;
  guardianRelationship: string;
  witnessName: string;
}

/** A file shown in the in-page viewer (object URL of an authorized download). */
export interface ViewedFile {
  title: string;
  kind: 'pdf' | 'image';
  url: SafeResourceUrl;
  rawUrl: string;
  file: DownloadedFile;
}

export const REVISION_CHANGE_TYPES: Partial<Record<number, string>> = { 1: 'Submitted', 2: 'Amended', 3: 'Voided' };

/**
 * Generic submission editor for any clinical form: draft editing, completeness check, consent capture,
 * submission, amendment, voiding/discarding and revision history. Available actions come from the
 * server's per-record permissions and section rights; every action is re-authorized and re-validated
 * by the server. Patient and appointment shown are the ones the server holds for this submission.
 */
@Component({
  selector: 'app-clinical-form-submission',
  standalone: false,
  templateUrl: './clinical-form-submission.html',
})
export class ClinicalFormSubmission implements OnInit, OnDestroy {
  private readonly api = inject(ClinicalFormsApiService);
  private readonly context = inject(ClinicalFormsContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly Status = SubmissionStatus;
  readonly SignerType = ConsentSignerType;
  readonly changeTypes = REVISION_CHANGE_TYPES;
  readonly appointmentStatusText = appointmentStatusText;
  readonly attachmentLabels = ATTACHMENT_TYPE_LABELS;
  readonly uploadTypes = UPLOADABLE_ATTACHMENT_TYPES;
  readonly attachmentAccept = ATTACHMENT_ACCEPT;

  readonly submission = signal<ClinicalFormSubmissionDetail | null>(null);
  readonly consents = signal<ClinicalFormConsents | null>(null);
  readonly patient = signal<PatientFormContext | null>(null);
  readonly patientName = signal<string | null>(null);
  readonly appointment = signal<ClinicalFormsAppointment | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<ClinicalFormsError | null>(null);
  readonly busy = signal(false);
  readonly conflict = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly issues = signal<FormIssue[]>([]);
  /** Result of the last completeness check (null = not checked since the last change of state). */
  readonly checkResult = signal<{ ready: boolean; serverChecked: boolean } | null>(null);
  readonly amending = signal(false);
  readonly voiding = signal(false);
  /** The entry point's patient/appointment differs from the server's: block editing. */
  readonly contextMismatch = signal<string | null>(null);

  readonly consentCapture = signal<Record<string, ConsentCapture>>({});
  readonly consentErrors = signal<Record<string, string>>({});
  readonly showConsentHistory = signal(false);

  readonly revisions = signal<ClinicalFormRevisionSummary[] | null>(null);
  readonly revisionsError = signal<string | null>(null);
  readonly viewedRevision = signal<ClinicalFormRevisionDetail | null>(null);

  /** Drawn signature per consent type (PNG data URL), cleared after a response is recorded. */
  readonly consentSignatures = signal<Record<string, string | null>>({});
  /** Per consent type: bumped to clear that signature pad after a response is recorded. */
  readonly padResets = signal<Record<string, number>>({});

  readonly attachments = signal<ClinicalFormAttachment[]>([]);
  readonly attachmentsError = signal<string | null>(null);
  readonly uploadProgress = signal<number | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  uploadType: ClinicalAttachmentType = ClinicalAttachmentType.Other;
  uploadDescription = '';
  deleteReason = '';

  readonly viewer = signal<ViewedFile | null>(null);
  readonly fileLoading = signal<string | null>(null);
  readonly fileError = signal<{ message: string; retry: () => void } | null>(null);

  amendReason = '';
  voidReason = '';
  private model: ClinicalFormModel | null = null;

  readonly permissions = computed(() => new Set(this.submission()?.permissions ?? []));
  readonly status = computed(() => this.submission()?.status ?? SubmissionStatus.Draft);
  readonly blocked = computed(() => this.conflict() || !!this.contextMismatch());
  readonly canSaveDraft = computed(() => this.status() === SubmissionStatus.Draft && this.permissions().has('FillPatientForms'));
  readonly canSubmit = computed(() => this.status() === SubmissionStatus.Draft && this.permissions().has('ClinicalEdit'));
  readonly canAmend = computed(() =>
    (this.status() === SubmissionStatus.Submitted || this.status() === SubmissionStatus.Amended) && this.permissions().has('ClinicalEdit'));
  readonly canVoid = computed(() => {
    const status = this.status();
    if (status === SubmissionStatus.Voided) return false;
    return status === SubmissionStatus.Draft ? this.permissions().has('FillPatientForms') : this.permissions().has('VoidSubmission');
  });
  readonly canRecordConsent = computed(() => this.status() !== SubmissionStatus.Voided && this.permissions().has('FillPatientForms') && !this.blocked());
  readonly readOnly = computed(() => {
    if (this.contextMismatch()) return true;
    const status = this.status();
    if (status === SubmissionStatus.Voided) return true;
    if (status === SubmissionStatus.Draft) return !this.canSaveDraft() && !this.canSubmit();
    return !this.amending();
  });
  readonly sectionAccess = computed(() => this.submission()?.sections ?? []);
  /** Server rules: drafts → users who fill forms; submitted/amended → clinicians; voided → nobody. */
  readonly canChangeAttachments = computed(() => {
    if (this.blocked()) return false;
    const status = this.status();
    if (status === SubmissionStatus.Voided) return false;
    return status === SubmissionStatus.Draft ? this.permissions().has('FillPatientForms') : this.permissions().has('ClinicalEdit');
  });
  readonly fileAttachments = computed(() => this.attachments().filter((a) => !a.isSignature));
  readonly missingConsents = computed(() => (this.consents()?.status ?? []).filter((c) => c.required && !c.satisfied));

  /** Bridge for attachmentList fields in the renderer (the renderer itself never calls APIs). */
  readonly attachmentHandler: ClinicalFormAttachmentHandler = {
    attachments: () => this.attachments(),
    canUpload: () => this.canChangeAttachments(),
    upload: (sectionKey, fieldKey, attachmentType, file) =>
      this.api.uploadAttachment(this.submissionId, { file, attachmentType, sectionKey, fieldKey }).pipe(
        tap((event) => {
          if (event.kind === 'done') this.attachments.update((list) => [...list, event.attachment]);
        }),
      ),
    open: (attachment) => this.viewAttachment(attachment),
  };

  ngOnDestroy(): void {
    this.closeViewer();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  get submissionId(): string {
    return this.route.snapshot.paramMap.get('submissionId') ?? '';
  }

  // ------------------------------------------------------------------ loading

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.conflict.set(false);
    this.actionError.set(null);
    this.issues.set([]);
    this.checkResult.set(null);
    this.amending.set(false);
    this.voiding.set(false);
    this.contextMismatch.set(null);
    this.revisions.set(null);
    this.viewedRevision.set(null);
    this.deletingId.set(null);
    this.closeViewer();

    this.api.getSubmission(this.submissionId).subscribe({
      next: (submission) => {
        this.applySubmission(submission);
        this.checkContext(submission);
        this.loading.set(false);
        this.loadPatient(submission);
        this.loadAppointment(submission);
        this.loadConsents();
        this.loadAttachments();
        if (submission.status !== SubmissionStatus.Draft) this.loadRevisions();
      },
      error: (error) => {
        this.loadError.set(toClinicalFormsError(error));
        this.loading.set(false);
      },
    });
  }

  /** Compares the entry point's patient/appointment (query params) with the server-validated submission. */
  private checkContext(submission: ClinicalFormSubmissionDetail): void {
    const query = this.route.snapshot.queryParamMap;
    const expectedPatient = query.get('patientId');
    const expectedAppointment = query.get('appointmentId');
    if (expectedPatient && !sameId(expectedPatient, submission.patientId)) {
      this.contextMismatch.set('This form belongs to a different patient than the one you came from. It is shown read-only; open it from the correct patient.');
    } else if (expectedAppointment && !sameId(expectedAppointment, submission.appointmentId)) {
      this.contextMismatch.set('This form is not linked to the appointment you came from. It is shown read-only; open it from the correct appointment.');
    }
  }

  /**
   * Patient context for conditions and patientBinding fields. Submitted records use the historical
   * snapshot captured at submission; drafts read the existing patient record (no duplicated patient data).
   */
  private loadPatient(submission: ClinicalFormSubmissionDetail): void {
    const snapshot = submission.patientSnapshot;
    if (snapshot) {
      this.patient.set(patientFormContext(snapshot));
      this.patientName.set(typeof snapshot['fullName'] === 'string' ? snapshot['fullName'] : null);
      return;
    }
    this.context.getPatient(submission.patientId).subscribe((p) => {
      // getPatient returns null unless the record is exactly the submission's patient.
      this.patient.set(p ? patientFormContext(p) : null);
      this.patientName.set(p?.fullName ?? null);
    });
  }

  private loadAppointment(submission: ClinicalFormSubmissionDetail): void {
    this.appointment.set(null);
    if (!submission.appointmentId) return;
    this.context.getAppointments(submission.patientId).subscribe((list) =>
      this.appointment.set(list.find((a) => sameId(a.appointmentId, submission.appointmentId)) ?? null));
  }

  private loadConsents(): void {
    this.api.getConsents(this.submissionId).subscribe({
      next: (consents) => this.setConsents(consents),
      error: () => this.consents.set(null),
    });
  }

  loadRevisions(): void {
    this.revisionsError.set(null);
    this.api.getRevisions(this.submissionId).subscribe({
      next: (revisions) => this.revisions.set(revisions ?? []),
      error: (error) => this.revisionsError.set(toClinicalFormsError(error).message),
    });
  }

  viewRevision(revisionNumber: number): void {
    this.api.getRevision(this.submissionId, revisionNumber).subscribe({
      next: (revision) => this.viewedRevision.set(revision),
      error: (error) => this.revisionsError.set(toClinicalFormsError(error).message),
    });
  }

  revisionPatient(revision: ClinicalFormRevisionDetail): PatientFormContext | null {
    return revision.patientSnapshot ? patientFormContext(revision.patientSnapshot) : this.patient();
  }

  onModelReady(model: ClinicalFormModel): void {
    this.model = model;
  }

  // ------------------------------------------------------------------ actions

  saveDraft(): void {
    if (!this.model || this.blocked()) return;
    this.model.clearServerErrors();
    const issues = this.model.validate('draft');
    this.issues.set(issues);
    if (issues.length > 0) return;
    this.run(this.api.saveDraft(this.submissionId, this.model.answers(), this.rowVersion), 'Draft saved.');
  }

  /**
   * Completeness check: local rules on what is on screen, required consents, and the server's check of
   * the last saved draft (the server is authoritative; unsaved changes are checked on submit).
   */
  checkCompleteness(): void {
    if (!this.model) return;
    this.model.clearServerErrors();
    const issues = [...this.model.validate('submit'), ...this.consentIssues()];
    this.issues.set(issues);
    this.actionError.set(null);
    this.busy.set(true);
    this.api.checkSubmission(this.submissionId).subscribe({
      next: (check) => {
        this.busy.set(false);
        const serverIssues = this.showServerErrors(check.issues ?? []);
        const all = [...issues, ...serverIssues.filter((s) => !issues.some((i) => i.message === s.message && i.path === s.path))];
        this.issues.set(all);
        this.checkResult.set({ ready: all.length === 0 && check.canSubmit, serverChecked: true });
      },
      error: (error) => {
        this.busy.set(false);
        this.checkResult.set({ ready: issues.length === 0, serverChecked: false });
        this.handleError(error);
      },
    });
  }

  submit(): void {
    if (!this.model || this.blocked()) return;
    this.model.clearServerErrors();
    const issues = [...this.model.validate('submit'), ...this.consentIssues()];
    this.issues.set(issues);
    if (issues.length > 0) return;
    this.run(this.api.submit(this.submissionId, this.model.answers(), this.rowVersion), 'Form submitted.');
  }

  startAmendment(): void {
    this.amendReason = '';
    this.actionError.set(null);
    this.amending.set(true);
    this.revealPanel('amend-panel');
  }

  cancelAmendment(): void {
    this.amending.set(false);
    this.issues.set([]);
    this.actionError.set(null);
    // Rebuild the form from the stored answers.
    const current = this.submission();
    if (current) this.submission.set({ ...current });
  }

  amend(): void {
    if (!this.model || this.blocked()) return;
    if (!this.amendReason.trim()) {
      this.actionError.set('Please enter the reason for the amendment.');
      return;
    }
    this.model.clearServerErrors();
    const issues = this.model.validate('submit');
    this.issues.set(issues);
    if (issues.length > 0) return;
    this.run(this.api.amend(this.submissionId, this.model.answers(), this.amendReason.trim(), this.rowVersion), 'Amendment saved.');
  }

  startVoid(): void {
    this.voidReason = '';
    this.actionError.set(null);
    this.voiding.set(true);
    this.revealPanel('void-panel');
  }

  /** The actions also appear at the end of the form; bring the reason panel (near the top) into view. */
  private revealPanel(test: string): void {
    afterNextRender(() => {
      const panel = this.host.nativeElement.querySelector<HTMLElement>(`[data-test="${test}"]`);
      panel?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      panel?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    }, { injector: this.injector });
  }

  voidSubmission(): void {
    if (this.blocked()) return;
    if (!this.voidReason.trim()) {
      this.actionError.set(this.status() === SubmissionStatus.Draft ? 'Please enter the reason for discarding the draft.' : 'Please enter the reason for voiding.');
      return;
    }
    const message = this.status() === SubmissionStatus.Draft ? 'Draft discarded.' : 'Submission voided.';
    this.run(this.api.voidSubmission(this.submissionId, this.voidReason.trim(), this.rowVersion), message);
  }

  // ------------------------------------------------------------------ consent

  consentDefinition(consentType: string): ConsentDefinition | undefined {
    return this.submission()?.definition.consents?.find((c) => c.consentType === consentType);
  }

  /** Heading for a consent: the label of the form's consent field (forms may ask for several signed consents). */
  consentTitle(consentType: string): string {
    for (const section of this.submission()?.definition.sections ?? []) {
      const field = section.fields.find((f) => f.type === 'consent' && f.consentType === consentType);
      if (field?.label) return field.label;
    }
    return consentType;
  }

  capture(consentType: string): ConsentCapture {
    return this.consentCapture()[consentType] ?? { signerType: ConsentSignerType.Patient, guardianName: '', guardianRelationship: '', witnessName: '' };
  }

  updateCapture(consentType: string, change: Partial<ConsentCapture>): void {
    const next = { ...this.capture(consentType), ...change };
    if (next.signerType !== ConsentSignerType.Guardian) {
      next.guardianName = '';
      next.guardianRelationship = '';
    }
    this.consentCapture.update((all) => ({ ...all, [consentType]: next }));
    this.consentErrors.update((all) => ({ ...all, [consentType]: '' }));
  }

  currentRecord(consentType: string): ClinicalFormConsentRecord | null {
    return this.consents()?.records.find((r) => r.consentType === consentType && r.isCurrent) ?? null;
  }

  recordConsent(consentType: string, isAccepted: boolean): void {
    if (this.blocked()) return;
    const capture = this.capture(consentType);
    const definition = this.consentDefinition(consentType);
    const guardian = capture.signerType === ConsentSignerType.Guardian;
    if (guardian && !definition?.allowGuardian) {
      this.consentErrors.update((all) => ({ ...all, [consentType]: 'This consent must be given by the patient.' }));
      return;
    }
    if (guardian && (!capture.guardianName.trim() || !capture.guardianRelationship.trim())) {
      this.consentErrors.update((all) => ({ ...all, [consentType]: 'Enter the guardian’s name and relationship to the patient.' }));
      return;
    }
    const signature = this.consentSignatures()[consentType] ?? null;
    if (isAccepted && this.requiresSignature(consentType) && !signature) {
      this.consentErrors.update((all) => ({ ...all, [consentType]: guardian ? 'The guardian must sign before accepting.' : 'The patient must sign before accepting.' }));
      return;
    }

    this.busy.set(true);
    this.actionError.set(null);
    this.consentErrors.update((all) => ({ ...all, [consentType]: '' }));
    this.api.recordConsent(this.submissionId, {
      consentType,
      isAccepted,
      signerType: capture.signerType,
      guardianName: guardian ? capture.guardianName.trim() : null,
      guardianRelationship: guardian ? capture.guardianRelationship.trim() : null,
      witnessName: definition?.witnessOptional && capture.witnessName.trim() ? capture.witnessName.trim() : null,
      signatureImage: signature,
    }).subscribe({
      next: (consents) => {
        this.setConsents(consents);
        this.busy.set(false);
        this.consentSignatures.update((all) => ({ ...all, [consentType]: null }));
        this.padResets.update((all) => ({ ...all, [consentType]: (all[consentType] ?? 0) + 1 }));
        if (signature) this.loadAttachments();
        this.issues.update((list) => list.filter((i) => i.path !== `consent.${consentType}`));
        this.toast.success(isAccepted ? 'Consent recorded.' : 'Refusal recorded.');
      },
      error: (raw) => {
        const error = toClinicalFormsError(raw);
        this.busy.set(false);
        if (error.isConflict || error.kind === 'unauthorized') {
          this.handleError(raw);
          return;
        }
        const detail = error.errors.map((e) => e.message).join(' ');
        this.consentErrors.update((all) => ({ ...all, [consentType]: detail || error.message }));
      },
    });
  }

  requiresSignature(consentType: string): boolean {
    const status = this.consents()?.status.find((c) => c.consentType === consentType);
    return status?.requiresSignature ?? !!this.consentDefinition(consentType)?.requireSignature;
  }

  onSignature(consentType: string, image: string | null): void {
    this.consentSignatures.update((all) => ({ ...all, [consentType]: image }));
    if (image) this.consentErrors.update((all) => ({ ...all, [consentType]: '' }));
  }

  signerLabel(consentType: string): string {
    return this.capture(consentType).signerType === ConsentSignerType.Guardian ? 'Guardian signature' : 'Patient signature';
  }

  viewSignature(record: ClinicalFormConsentRecord): void {
    if (!record.signatureAttachmentId) return;
    this.openFile(`Signature · ${record.consentType}`, `signature-${record.consentType}.png`,
      () => this.api.downloadAttachment({ id: record.signatureAttachmentId!, fileName: `signature-${record.consentType}.png`, contentType: 'image/png' }));
  }

  // ------------------------------------------------------------------ attachments

  loadAttachments(): void {
    this.attachmentsError.set(null);
    this.api.getAttachments(this.submissionId).subscribe({
      next: (list) => this.attachments.set(list ?? []),
      error: (error) => this.attachmentsError.set(toClinicalFormsError(error).message),
    });
  }

  /** General upload from the attachments panel (not tied to a form field). */
  onPanelFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.canChangeAttachments()) return;
    this.uploadError.set(null);
    const name = file.name.toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png'].some((ext) => name.endsWith(ext))) {
      this.uploadError.set('Only PDF, JPEG and PNG files are allowed.');
      return;
    }
    if (file.size === 0 || file.size > ATTACHMENT_MAX_BYTES) {
      this.uploadError.set(file.size === 0 ? 'The file is empty.' : 'The file exceeds the 10 MB limit.');
      return;
    }
    this.uploadProgress.set(0);
    this.api.uploadAttachment(this.submissionId, { file, attachmentType: this.uploadType, description: this.uploadDescription.trim() || null }).subscribe({
      next: (event) => {
        if (event.kind === 'progress') {
          this.uploadProgress.set(event.percent);
          return;
        }
        this.uploadProgress.set(null);
        this.uploadDescription = '';
        this.attachments.update((list) => [...list, event.attachment]);
        this.toast.success('File uploaded.');
      },
      error: (raw) => {
        this.uploadProgress.set(null);
        const error = toClinicalFormsError(raw);
        if (error.isConflict) {
          this.handleError(raw);
          return;
        }
        this.uploadError.set(error.errors[0]?.message ?? error.message);
      },
    });
  }

  startDelete(attachment: ClinicalFormAttachment): void {
    this.deleteReason = '';
    this.deleteError.set(null);
    this.deletingId.set(attachment.id);
  }

  confirmDelete(attachment: ClinicalFormAttachment): void {
    if (!this.deleteReason.trim()) {
      this.deleteError.set('Please enter the reason for removing the file.');
      return;
    }
    this.busy.set(true);
    this.api.deleteAttachment(attachment.id, this.deleteReason.trim()).subscribe({
      next: () => {
        this.busy.set(false);
        this.deletingId.set(null);
        this.attachments.update((list) => list.filter((a) => a.id !== attachment.id));
        this.toast.success('File removed.');
      },
      error: (raw) => {
        this.busy.set(false);
        const error = toClinicalFormsError(raw);
        this.deleteError.set(error.errors[0]?.message ?? error.message);
      },
    });
  }

  viewAttachment(attachment: ClinicalFormAttachment): void {
    this.openFile(attachment.fileName, attachment.fileName, () => this.api.downloadAttachment(attachment));
  }

  downloadAttachment(attachment: ClinicalFormAttachment): void {
    this.saveFile(attachment.fileName, () => this.api.downloadAttachment(attachment));
  }

  // ------------------------------------------------------------------ PDF

  pdfFileName(revisionNumber?: number | null): string {
    const s = this.submission();
    const rev = revisionNumber ?? s?.currentRevisionNumber ?? 0;
    return `${s?.formKey ?? 'clinical-form'}-rev${rev}.pdf`;
  }

  previewPdf(revisionNumber?: number | null): void {
    const title = revisionNumber ? `PDF · revision ${revisionNumber}` : 'PDF · current version';
    this.openFile(title, this.pdfFileName(revisionNumber), () => this.api.downloadPdf(this.submissionId, this.pdfFileName(revisionNumber), revisionNumber));
  }

  downloadPdf(revisionNumber?: number | null): void {
    this.saveFile(this.pdfFileName(revisionNumber), () => this.api.downloadPdf(this.submissionId, this.pdfFileName(revisionNumber), revisionNumber));
  }

  // ------------------------------------------------------------------ files

  private openFile(title: string, key: string, request: () => Observable<DownloadedFile>): void {
    this.fileError.set(null);
    this.fileLoading.set(key);
    request().subscribe({
      next: (file) => {
        this.fileLoading.set(null);
        this.closeViewer();
        const rawUrl = URL.createObjectURL(file.blob);
        this.viewer.set({
          title,
          kind: file.contentType === 'application/pdf' ? 'pdf' : 'image',
          rawUrl,
          // Object URL of an authorized download held in memory; never a server file URL.
          url: this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl),
          file,
        });
      },
      error: (raw) => {
        this.fileLoading.set(null);
        this.fileError.set({ message: this.fileErrorMessage(raw), retry: () => this.openFile(title, key, request) });
      },
    });
  }

  private saveFile(key: string, request: () => Observable<DownloadedFile>): void {
    this.fileError.set(null);
    this.fileLoading.set(key);
    request().subscribe({
      next: (file) => {
        this.fileLoading.set(null);
        this.triggerDownload(file);
      },
      error: (raw) => {
        this.fileLoading.set(null);
        this.fileError.set({ message: this.fileErrorMessage(raw), retry: () => this.saveFile(key, request) });
      },
    });
  }

  saveViewed(): void {
    const viewed = this.viewer();
    if (viewed) this.triggerDownload(viewed.file);
  }

  closeViewer(): void {
    const viewed = this.viewer();
    if (viewed) URL.revokeObjectURL(viewed.rawUrl);
    this.viewer.set(null);
  }

  /** Saves an in-memory file; the object URL is revoked right after. */
  triggerDownload(file: DownloadedFile): void {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private fileErrorMessage(raw: unknown): string {
    const error = toClinicalFormsError(raw);
    switch (error.kind) {
      case 'forbidden': return 'You do not have permission to open this file.';
      case 'notFound': return 'The file was not found. It may have been removed.';
      case 'network': return 'The file could not be downloaded. Check your connection and try again.';
      default: return error.message;
    }
  }

  private setConsents(consents: ClinicalFormConsents): void {
    this.consents.set(consents);
  }

  private consentIssues(): FormIssue[] {
    return this.missingConsents().map((c) => ({
      path: `consent.${c.consentType}`,
      label: 'Consent',
      message: 'The patient (or guardian) must accept the consent before submission.',
    }));
  }

  // ------------------------------------------------------------------ helpers

  private get rowVersion(): string {
    return this.submission()?.rowVersion ?? '';
  }

  private run(request: Observable<ClinicalFormSubmissionDetail>, successMessage: string): void {
    this.busy.set(true);
    this.actionError.set(null);
    this.checkResult.set(null);
    request.subscribe({
      next: (submission) => {
        this.applySubmission(submission);
        this.amending.set(false);
        this.voiding.set(false);
        this.issues.set([]);
        this.busy.set(false);
        this.toast.success(successMessage);
        this.loadConsents();
        this.loadAttachments();
        if (submission.status !== SubmissionStatus.Draft) this.loadRevisions();
        if (submission.patientSnapshot) this.loadPatient(submission);
      },
      error: (error) => this.handleError(error),
    });
  }

  private applySubmission(submission: ClinicalFormSubmissionDetail): void {
    this.submission.set(submission);
  }

  /** Puts server errors on their fields/sections; returns them as issues for the summary list. */
  private showServerErrors(errors: ClinicalFormValidationError[]): FormIssue[] {
    this.model?.applyServerErrors(errors);
    return errors.map((e) => ({ path: e.path, label: this.labelFor(e.path), message: e.message }));
  }

  private labelFor(path: string): string {
    const parts = (path ?? '').replace(/^answers\.?/, '').split('.');
    const section = this.submission()?.definition.sections.find((s) => s.key === parts[0]);
    if (!section) return parts.join('.') || 'Form';
    const field = section.fields.find((f) => f.key === parts[1]?.replace(/\[\d+\]$/, ''));
    return field ? `${section.title} › ${field.label}` : section.title;
  }

  private handleError(raw: unknown): void {
    const error = toClinicalFormsError(raw);
    this.busy.set(false);
    if (error.isConflict) {
      // Never overwrite someone else's change: ask the user to reload.
      this.conflict.set(true);
      this.toast.warning(error.message);
      return;
    }
    if ((error.kind === 'validation' || error.kind === 'forbidden') && error.errors.length > 0) {
      this.issues.set(this.showServerErrors(error.errors));
    }
    this.actionError.set(error.message);
    if (error.kind !== 'validation') this.toast.error(error.message);
  }
}
