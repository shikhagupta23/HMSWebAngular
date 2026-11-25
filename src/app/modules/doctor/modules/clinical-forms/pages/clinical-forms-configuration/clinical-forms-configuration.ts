import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../../../../../shared/services/toast-service';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsError, toClinicalFormsError } from '../../services/clinical-forms-error';
import {
  ClinicalFormVersionSummary,
  EnabledClinicalForm,
  FormDefinition,
  HospitalAvailableClinicalForm,
} from '../../models/clinical-forms.models';

export type ConfigurationStatus = 'enabled' | 'disabled' | 'notEnabled';

/** One row of the dashboard: a template and this hospital's state for it. */
export interface ConfigurationRow {
  form: HospitalAvailableClinicalForm;
  status: ConfigurationStatus;
  /** Version shown: the hospital's active version, otherwise the latest published one. */
  versionNumber: number | null;
  latestPublished: ClinicalFormVersionSummary | null;
  /** True when staff can currently use the form (getEnabledForms). */
  availableToStaff: boolean;
  lastUpdated: string | null;
}

/**
 * Hospital Admin dashboard for Clinical Forms (route: /clinical-forms/configuration).
 * Lists the published templates the hospital may use, with enable / disable / configure / preview.
 * The hospital is never sent: every call is scoped by the server to the Admin's own hospital.
 */
@Component({
  selector: 'app-clinical-forms-configuration',
  standalone: false,
  templateUrl: './clinical-forms-configuration.html',
})
export class ClinicalFormsConfiguration implements OnInit {
  private readonly api = inject(ClinicalFormsApiService);
  private readonly toast = inject(ToastService);

  readonly rows = signal<ConfigurationRow[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<ClinicalFormsError | null>(null);
  readonly search = signal('');
  /** Template ids with a request in flight (prevents duplicate submissions). */
  readonly pending = signal<ReadonlySet<string>>(new Set());
  readonly confirmingDisable = signal<string | null>(null);
  readonly actionError = signal<{ templateId: string; message: string } | null>(null);

  readonly preview = signal<{ templateId: string; formName: string; versionNumber: number; definition: FormDefinition; customized: boolean } | null>(null);
  readonly previewError = signal<string | null>(null);

  readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter((r) =>
      [r.form.formName, r.form.specialty, r.form.formKey, r.form.description ?? ''].some((v) => v.toLowerCase().includes(term)));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({ available: this.api.getAvailableForms(), enabled: this.api.getEnabledForms() }).subscribe({
      next: ({ available, enabled }) => {
        this.rows.set(toRows(available ?? [], enabled ?? []));
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(toClinicalFormsError(error));
        this.loading.set(false);
      },
    });
  }

  isPending(templateId: string): boolean {
    return this.pending().has(templateId);
  }

  enable(row: ConfigurationRow): void {
    if (this.isPending(row.form.templateId)) return;
    // Re-enabling keeps the hospital's saved configuration (configurationJson omitted = keep).
    this.run(row, this.api.enableForm({ templateId: row.form.templateId }), `${row.form.formName} is enabled for your hospital.`);
  }

  askDisable(row: ConfigurationRow): void {
    this.actionError.set(null);
    this.confirmingDisable.set(row.form.templateId);
  }

  confirmDisable(row: ConfigurationRow): void {
    if (this.isPending(row.form.templateId)) return;
    this.confirmingDisable.set(null);
    this.run(row, this.api.disableForm(row.form.templateId), `${row.form.formName} is disabled. Existing records remain available.`);
  }

  /** Read-only preview of the form as staff would see it with the saved hospital configuration. */
  showPreview(row: ConfigurationRow): void {
    if (this.isPending(row.form.templateId)) return;
    const state = row.form.configuration;
    this.previewError.set(null);
    this.setPending(row.form.templateId, true);
    this.api.previewConfiguration(row.form.templateId, {
      templateVersionId: state?.activeTemplateVersionId ?? null,
      configurationJson: state?.configurationJson ?? null,
    }).subscribe({
      next: (result) => {
        this.setPending(row.form.templateId, false);
        this.preview.set({
          templateId: row.form.templateId, formName: row.form.formName, versionNumber: result.versionNumber,
          definition: result.definition, customized: !!state?.configurationJson,
        });
      },
      error: (raw) => {
        this.setPending(row.form.templateId, false);
        this.previewError.set(describe(toClinicalFormsError(raw)));
      },
    });
  }

  private run(row: ConfigurationRow, request: ReturnType<ClinicalFormsApiService['enableForm']>, success: string): void {
    const id = row.form.templateId;
    this.actionError.set(null);
    this.setPending(id, true);
    request.subscribe({
      next: () => {
        this.setPending(id, false);
        this.toast.success(success);
        this.load();
      },
      error: (raw) => {
        this.setPending(id, false);
        const error = toClinicalFormsError(raw);
        this.actionError.set({ templateId: id, message: describe(error) });
        if (error.kind !== 'validation') this.toast.error(describe(error));
      },
    });
  }

  private setPending(templateId: string, value: boolean): void {
    this.pending.update((current) => {
      const next = new Set(current);
      if (value) next.add(templateId);
      else next.delete(templateId);
      return next;
    });
  }
}

export function toRows(available: HospitalAvailableClinicalForm[], enabled: EnabledClinicalForm[]): ConfigurationRow[] {
  const enabledIds = new Set(enabled.map((e) => e.templateId));
  return available
    .map((form) => {
      const state = form.configuration ?? null;
      const latest = [...(form.publishedVersions ?? [])].sort((a, b) => b.versionNumber - a.versionNumber)[0] ?? null;
      const status: ConfigurationStatus = !state ? 'notEnabled' : state.isEnabled ? 'enabled' : 'disabled';
      return {
        form,
        status,
        versionNumber: state?.activeVersionNumber ?? latest?.versionNumber ?? null,
        latestPublished: latest,
        availableToStaff: enabledIds.has(form.templateId),
        lastUpdated: state ? (state.isEnabled ? state.enabledAt : state.disabledAt) ?? null : null,
      } satisfies ConfigurationRow;
    })
    .sort((a, b) => a.form.formName.localeCompare(b.form.formName));
}

/** User-facing message for configuration failures (server messages are already generic). */
export function describe(error: ClinicalFormsError): string {
  if (error.kind === 'forbidden') return 'You do not have permission to manage clinical forms for this hospital.';
  if (error.kind === 'validation' && error.errors.length > 0) return error.errors.map((e) => e.message).join(' ');
  return error.message;
}
