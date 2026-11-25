import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../../../shared/services/toast-service';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsError, toClinicalFormsError } from '../../services/clinical-forms-error';
import { HasUnsavedChanges } from '../../guards/clinical-forms.guard';
import {
  FieldCapabilities,
  MAX_CONSENT_TEXT_LENGTH,
  MAX_CONSENT_VERSION_LENGTH,
  MAX_LABEL_LENGTH,
  conditionReferences,
  fieldCapabilities,
  overlayErrorKey,
  parseOverlay,
  sectionDisableBlocker,
  serializeOverlay,
} from '../../engine/hospital-form-overlay';
import {
  ConsentDefinition,
  FieldDefinition,
  FormDefinition,
  HospitalAvailableClinicalForm,
  HospitalClinicalFormState,
  HospitalFormOverlay,
  SectionDefinition,
} from '../../models/clinical-forms.models';

/**
 * Hospital configuration of one enabled clinical form (route: /clinical-forms/configuration/:templateId).
 * Edits only what the hospital overlay supports (section on/off and titles, field labels, hiding optional
 * fields and options, making optional fields mandatory, hospital consent wording) on a working copy of
 * the saved overlay, so values the user does not touch are preserved. The template definition itself is
 * never editable here (SuperAdmin only). Every save is validated again by the server.
 */
@Component({
  selector: 'app-clinical-form-configuration-editor',
  standalone: false,
  templateUrl: './clinical-form-configuration-editor.html',
})
export class ClinicalFormConfigurationEditor implements OnInit, HasUnsavedChanges {
  private readonly api = inject(ClinicalFormsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly maxLabel = MAX_LABEL_LENGTH;
  readonly maxConsentText = MAX_CONSENT_TEXT_LENGTH;
  readonly maxConsentVersion = MAX_CONSENT_VERSION_LENGTH;

  readonly loading = signal(true);
  readonly loadError = signal<ClinicalFormsError | null>(null);
  readonly form = signal<HospitalAvailableClinicalForm | null>(null);
  readonly state = signal<HospitalClinicalFormState | null>(null);
  readonly base = signal<FormDefinition | null>(null);
  readonly versionId = signal<string>('');
  readonly versionLoading = signal(false);

  /** Working copy of the overlay; `revision` is bumped on every edit so the template re-reads it. */
  private overlay: HospitalFormOverlay = parseOverlay(null);
  private savedSerialized: string | null = null;
  readonly revision = signal(0);

  readonly errors = signal<Record<string, string[]>>({});
  readonly generalErrors = signal<string[]>([]);
  readonly saving = signal(false);
  readonly conflict = signal(false);
  readonly previewing = signal(false);
  readonly preview = signal<{ definition: FormDefinition; versionNumber: number; saved: boolean } | null>(null);
  readonly expanded = signal<ReadonlySet<string>>(new Set());

  private references = new Set<string>();
  private readonly capabilityCache = new Map<string, FieldCapabilities>();

  readonly versions = computed(() => [...(this.form()?.publishedVersions ?? [])].sort((a, b) => b.versionNumber - a.versionNumber));
  readonly dirty = computed(() => {
    this.revision();
    const state = this.state();
    if (!state) return false;
    return serializeOverlay(this.overlay) !== this.savedSerialized || this.versionId() !== state.activeTemplateVersionId;
  });

  get templateId(): string {
    return this.route.snapshot.paramMap.get('templateId') ?? '';
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  hasUnsavedChanges(): boolean {
    return this.dirty() && !this.saving();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  // ------------------------------------------------------------------ loading

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.conflict.set(false);
    this.preview.set(null);
    this.clearErrors();
    this.api.getAvailableForms().subscribe({
      next: (forms) => {
        const form = (forms ?? []).find((f) => f.templateId === this.templateId) ?? null;
        if (!form || !form.configuration) {
          this.loading.set(false);
          this.loadError.set(new ClinicalFormsError('notFound', 404, form
            ? 'Enable this form for your hospital before configuring it.'
            : 'This form is not available for your hospital.'));
          return;
        }
        let overlay: HospitalFormOverlay;
        try {
          overlay = parseOverlay(form.configuration.configurationJson);
        } catch {
          this.loading.set(false);
          this.loadError.set(new ClinicalFormsError('server', 500, 'The saved configuration could not be read. Please contact support.'));
          return;
        }
        this.form.set(form);
        this.state.set(form.configuration);
        this.overlay = overlay;
        this.savedSerialized = serializeOverlay(overlay);
        this.versionId.set(form.configuration.activeTemplateVersionId);
        this.revision.update((r) => r + 1);
        this.loadBase(form.configuration.activeTemplateVersionId, true);
      },
      error: (raw) => {
        this.loadError.set(toClinicalFormsError(raw));
        this.loading.set(false);
      },
    });
  }

  /** The version as published (no hospital changes): previewConfiguration with no overlay. */
  private loadBase(versionId: string, initial = false): void {
    this.versionLoading.set(true);
    this.api.previewConfiguration(this.templateId, { templateVersionId: versionId, configurationJson: null }).subscribe({
      next: (result) => {
        this.base.set(result.definition);
        this.references = conditionReferences(result.definition);
        this.capabilityCache.clear();
        this.versionLoading.set(false);
        if (initial) this.loading.set(false);
        this.revision.update((r) => r + 1);
      },
      error: (raw) => {
        this.versionLoading.set(false);
        if (initial) {
          this.loading.set(false);
          this.loadError.set(toClinicalFormsError(raw));
        } else {
          this.generalErrors.set([describe(toClinicalFormsError(raw))]);
        }
      },
    });
  }

  changeVersion(versionId: string): void {
    if (!versionId || versionId === this.versionId()) return;
    this.versionId.set(versionId);
    const version = this.versions().find((v) => v.id === versionId);
    if (this.overlay.appliesToTemplateVersion != null && version) this.overlay.appliesToTemplateVersion = version.versionNumber;
    this.preview.set(null);
    this.clearErrors();
    this.revision.update((r) => r + 1);
    this.loadBase(versionId);
  }

  // ------------------------------------------------------------------ reading the working copy

  sectionEnabled(section: SectionDefinition): boolean {
    this.revision();
    return this.overlay.sections?.[section.key]?.enabled !== false;
  }

  sectionTitle(section: SectionDefinition): string {
    this.revision();
    return this.overlay.sections?.[section.key]?.title ?? '';
  }

  disableBlocker(section: SectionDefinition): string | null {
    return sectionDisableBlocker(section);
  }

  fieldKey(section: SectionDefinition, field: FieldDefinition): string {
    return `${section.key}.${field.key}`;
  }

  capabilities(section: SectionDefinition, field: FieldDefinition): FieldCapabilities {
    const key = this.fieldKey(section, field);
    let cached = this.capabilityCache.get(key);
    if (!cached) {
      cached = fieldCapabilities(this.base()!, section, field, this.references);
      this.capabilityCache.set(key, cached);
    }
    return cached;
  }

  fieldOverride(section: SectionDefinition, field: FieldDefinition): { label?: string | null; hidden?: boolean | null; required?: boolean | null; hiddenOptions?: string[] | null } {
    this.revision();
    return this.overlay.fields?.[this.fieldKey(section, field)] ?? {};
  }

  isOptionHidden(section: SectionDefinition, field: FieldDefinition, value: string): boolean {
    return (this.fieldOverride(section, field).hiddenOptions ?? []).includes(value);
  }

  customizedCount(section: SectionDefinition): number {
    this.revision();
    return section.fields.filter((f) => !!this.overlay.fields?.[this.fieldKey(section, f)]).length;
  }

  consentOverride(consent: ConsentDefinition): { consentType: string; consentVersion: string; text: string } | undefined {
    this.revision();
    return this.overlay.consents?.find((c) => c.consentType === consent.consentType);
  }

  errorsFor(key: string): string[] {
    return this.errors()[key] ?? [];
  }

  isExpanded(sectionKey: string): boolean {
    return this.expanded().has(sectionKey);
  }

  toggleExpanded(sectionKey: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  }

  // ------------------------------------------------------------------ edits

  setSectionEnabled(section: SectionDefinition, enabled: boolean): void {
    if (!enabled && sectionDisableBlocker(section)) return;
    this.editSection(section.key, (entry) => (entry.enabled = enabled ? null : false));
  }

  setSectionTitle(section: SectionDefinition, title: string): void {
    this.editSection(section.key, (entry) => (entry.title = title.trim() === '' || title === section.title ? null : title));
  }

  setFieldLabel(section: SectionDefinition, field: FieldDefinition, label: string): void {
    if (!this.capabilities(section, field).canRelabel) return;
    this.editField(section, field, (entry) => (entry.label = label.trim() === '' || label === field.label ? null : label));
  }

  setFieldHidden(section: SectionDefinition, field: FieldDefinition, hidden: boolean): void {
    if (hidden && this.capabilities(section, field).hideBlocker) return;
    this.editField(section, field, (entry) => {
      entry.hidden = hidden ? true : null;
      if (hidden) entry.required = null; // hidden and required cannot be combined
    });
  }

  setFieldRequired(section: SectionDefinition, field: FieldDefinition, required: boolean): void {
    const caps = this.capabilities(section, field);
    if (required && (caps.requireBlocker || caps.alreadyRequired)) return;
    this.editField(section, field, (entry) => {
      entry.required = required ? true : null;
      if (required) entry.hidden = null;
    });
  }

  setOptionHidden(section: SectionDefinition, field: FieldDefinition, value: string, hidden: boolean): void {
    if (this.capabilities(section, field).hideableOptions.length === 0) return;
    this.editField(section, field, (entry) => {
      const current = new Set(entry.hiddenOptions ?? []);
      if (hidden) current.add(value);
      else current.delete(value);
      entry.hiddenOptions = current.size > 0 ? [...current] : null;
    });
  }

  setConsentCustomized(consent: ConsentDefinition, customized: boolean): void {
    const consents = [...(this.overlay.consents ?? [])];
    const index = consents.findIndex((c) => c.consentType === consent.consentType);
    if (customized && index < 0)
      consents.push({ consentType: consent.consentType, consentVersion: suggestVersion(consent.consentVersion), text: consent.text });
    if (!customized && index >= 0) consents.splice(index, 1);
    this.overlay.consents = consents;
    this.touched();
  }

  setConsentValue(consent: ConsentDefinition, property: 'consentVersion' | 'text', value: string): void {
    const entry = this.overlay.consents?.find((c) => c.consentType === consent.consentType);
    if (!entry) return;
    entry[property] = value;
    this.touched();
  }

  private editSection(key: string, change: (entry: { enabled?: boolean | null; title?: string | null }) => void): void {
    const sections = { ...(this.overlay.sections ?? {}) };
    const entry = { ...(sections[key] ?? {}) };
    change(entry);
    sections[key] = entry;
    this.overlay.sections = sections;
    this.touched();
  }

  private editField(section: SectionDefinition, field: FieldDefinition,
    change: (entry: { label?: string | null; hidden?: boolean | null; required?: boolean | null; hiddenOptions?: string[] | null }) => void): void {
    const fields = { ...(this.overlay.fields ?? {}) };
    const key = this.fieldKey(section, field);
    const entry = { ...(fields[key] ?? {}) };
    change(entry);
    if (entry.label == null && !entry.hidden && !entry.required && !(entry.hiddenOptions && entry.hiddenOptions.length)) delete fields[key];
    else fields[key] = entry;
    this.overlay.fields = fields;
    this.touched();
  }

  private touched(): void {
    this.revision.update((r) => r + 1);
    this.conflict.set(false);
    if (this.preview()) this.preview.set(null); // a preview of older changes would be misleading
  }

  // ------------------------------------------------------------------ preview & save

  previewChanges(): void {
    if (this.previewing() || !this.validateLocally()) return;
    this.previewing.set(true);
    this.api.previewConfiguration(this.templateId, { templateVersionId: this.versionId(), configurationJson: serializeOverlay(this.overlay) }).subscribe({
      next: (result) => {
        this.previewing.set(false);
        this.preview.set({ definition: result.definition, versionNumber: result.versionNumber, saved: !this.dirty() });
      },
      error: (raw) => {
        this.previewing.set(false);
        this.showServerErrors(toClinicalFormsError(raw));
      },
    });
  }

  save(): void {
    const state = this.state();
    if (!state || this.saving() || !this.dirty() || !this.validateLocally()) return;
    const configurationJson = serializeOverlay(this.overlay);
    this.saving.set(true);
    this.api.updateConfiguration(this.templateId, {
      activeTemplateVersionId: this.versionId(),
      configurationJson,
      rowVersion: state.rowVersion,
    }).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.state.set(saved);
        this.savedSerialized = configurationJson;
        this.revision.update((r) => r + 1);
        this.toast.success('Configuration saved. Staff will see these changes on new forms.');
        this.refreshEffective(saved);
      },
      error: (raw) => {
        this.saving.set(false);
        const error = toClinicalFormsError(raw);
        if (error.isConflict) {
          this.conflict.set(true);
          this.toast.warning(error.message);
          return;
        }
        this.showServerErrors(error);
      },
    });
  }

  /** After saving, show the effective form exactly as stored. */
  private refreshEffective(saved: HospitalClinicalFormState): void {
    this.api.previewConfiguration(this.templateId, { templateVersionId: saved.activeTemplateVersionId, configurationJson: saved.configurationJson ?? null }).subscribe({
      next: (result) => this.preview.set({ definition: result.definition, versionNumber: result.versionNumber, saved: true }),
      error: () => undefined, // the save itself succeeded; the preview is informational
    });
  }

  discardChanges(): void {
    const state = this.state();
    if (!state) return;
    this.overlay = parseOverlay(state.configurationJson);
    this.clearErrors();
    this.preview.set(null);
    if (this.versionId() !== state.activeTemplateVersionId) {
      this.versionId.set(state.activeTemplateVersionId);
      this.loadBase(state.activeTemplateVersionId);
    }
    this.revision.update((r) => r + 1);
  }

  cancel(): void {
    this.router.navigate(['/clinical-forms/configuration']);
  }

  // ------------------------------------------------------------------ validation

  /** Client checks mirroring the server, so mistakes show next to the control before a round trip. */
  private validateLocally(): boolean {
    const base = this.base();
    if (!base) return false;
    const errors: Record<string, string[]> = {};
    const add = (key: string, message: string) => (errors[key] = [...(errors[key] ?? []), message]);

    const enabledSections = base.sections.filter((s) => this.overlay.sections?.[s.key]?.enabled !== false);
    if (enabledSections.length === 0) add('general', 'At least one section must remain enabled.');

    for (const [key, entry] of Object.entries(this.overlay.sections ?? {}))
      if (entry?.title && entry.title.length > MAX_LABEL_LENGTH) add(`section:${key}:title`, `Use at most ${MAX_LABEL_LENGTH} characters.`);

    for (const section of base.sections)
      for (const field of section.fields) {
        const entry = this.overlay.fields?.[this.fieldKey(section, field)];
        if (!entry) continue;
        const key = `field:${this.fieldKey(section, field)}`;
        if (entry.label && entry.label.length > MAX_LABEL_LENGTH) add(`${key}:label`, `Use at most ${MAX_LABEL_LENGTH} characters.`);
        const options = this.capabilities(section, field).hideableOptions;
        if (entry.hiddenOptions?.length && options.length > 0 && entry.hiddenOptions.length >= options.length)
          add(`${key}:hiddenOptions`, 'At least one option must remain visible.');
      }

    for (const consent of base.consents ?? []) {
      const entry = this.overlay.consents?.find((c) => c.consentType === consent.consentType);
      if (!entry) continue;
      const key = `consent:${consent.consentType}`;
      const version = entry.consentVersion?.trim() ?? '';
      if (!version) add(`${key}:consentVersion`, 'Enter a version for your hospital wording.');
      else if (version.length > MAX_CONSENT_VERSION_LENGTH) add(`${key}:consentVersion`, `Use at most ${MAX_CONSENT_VERSION_LENGTH} characters.`);
      else if (version === consent.consentVersion)
        add(`${key}:consentVersion`, `Use a version different from the standard wording (${consent.consentVersion}) so accepted text stays identifiable.`);
      if (!entry.text?.trim()) add(`${key}:text`, 'Enter the consent wording.');
      else if (entry.text.length > MAX_CONSENT_TEXT_LENGTH) add(`${key}:text`, `Use at most ${MAX_CONSENT_TEXT_LENGTH} characters.`);
    }

    this.generalErrors.set(errors['general'] ?? []);
    delete errors['general'];
    this.errors.set(errors);
    return Object.keys(errors).length === 0 && this.generalErrors().length === 0;
  }

  private showServerErrors(error: ClinicalFormsError): void {
    if (error.kind !== 'validation' || error.errors.length === 0) {
      this.generalErrors.set([describe(error)]);
      this.errors.set({});
      if (error.kind !== 'validation') this.toast.error(describe(error));
      return;
    }
    const errors: Record<string, string[]> = {};
    const general: string[] = [];
    for (const e of error.errors) {
      const key = overlayErrorKey(e.path, this.overlay);
      if (key === 'general') general.push(e.message);
      else errors[key] = [...(errors[key] ?? []), e.message];
    }
    // Problems inside a section are also shown at the section header (fields may be collapsed).
    this.errors.set(errors);
    this.generalErrors.set(general.length ? general : ['Please correct the highlighted settings.']);
    for (const key of Object.keys(errors)) {
      const section = /^(?:section|field):([^.:]+)/.exec(key)?.[1];
      if (section && !this.isExpanded(section)) this.toggleExpanded(section);
    }
  }

  private clearErrors(): void {
    this.errors.set({});
    this.generalErrors.set([]);
  }
}

/** Suggests a hospital wording version distinct from the standard one (e.g. "1.0" → "1.0-H1"). */
export function suggestVersion(standard: string): string {
  return `${standard}-H1`.slice(0, MAX_CONSENT_VERSION_LENGTH);
}

function describe(error: ClinicalFormsError): string {
  if (error.kind === 'forbidden') return 'You do not have permission to manage clinical forms for this hospital.';
  return error.message;
}
