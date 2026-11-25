import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ClinicalFormValidationError,
  ConsentDefinition,
  FieldDefinition,
  FieldOption,
  FieldType,
  FormDefinition,
  SectionDefinition,
  TemplateVersionStatus,
} from '../../../../doctor/modules/clinical-forms/models/clinical-forms.models';
import { ClinicalFormsError } from '../../../../doctor/modules/clinical-forms/services/clinical-forms-error';
import { HasUnsavedChanges } from '../../../../doctor/modules/clinical-forms/guards/clinical-forms.guard';
import { FormBuilderApiService } from '../../form-builder-api.service';
import { FormTemplateDetail, FormVersionDetail } from '../../form-builder.models';
import {
  BUILT_IN_OPTION_SETS,
  EDITOR_ROLES,
  FIELD_TYPES,
  KEBAB_PATTERN,
  KEY_PATTERN,
  OPTION_TYPES,
  TICKED_SET,
  addConsent,
  deepClone,
  locateIssue,
  move,
  newField,
  newSection,
  prepareForSave,
  toKey,
  typeInfo,
  uniqueKey,
} from '../../builder-utils';

type Tab = 'structure' | 'optionSets' | 'consents' | 'preview' | 'json';

/**
 * SuperAdmin form builder for one version of a global template (route:
 * /superadmin/clinical-forms/:templateId/versions/:versionId). Drafts are edited visually and saved
 * through the template API, which validates every save and lists what still blocks publishing.
 * Published and archived versions open read-only: they never change, new versions are created instead.
 */
@Component({
  selector: 'app-form-version-builder',
  standalone: false,
  templateUrl: './form-version-builder.html',
  styleUrl: './form-version-builder.scss',
})
export class FormVersionBuilder implements OnInit, HasUnsavedChanges {
  private readonly api = inject(FormBuilderApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly Status = TemplateVersionStatus;
  readonly fieldTypes = FIELD_TYPES;
  readonly roles = EDITOR_ROLES;
  readonly builtInSets = BUILT_IN_OPTION_SETS;
  readonly tickedSet = TICKED_SET;

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly template = signal<FormTemplateDetail | null>(null);
  readonly version = signal<FormVersionDetail | null>(null);
  readonly tab = signal<Tab>('structure');

  /** The definition being edited (plain object, changed in place by the editors). */
  definition: FormDefinition | null = null;
  /** Latest published version other than this one: its keys and option values are fixed. */
  published: FormDefinition | null = null;
  versionLabel = '';
  selectedSection = 0;
  expandedField: FieldDefinition | null = null;
  showPalette = false;
  previewDefinition: FormDefinition | null = null;
  jsonText = '';
  jsonError: string | null = null;
  private savedSnapshot = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const templateId = this.route.snapshot.paramMap.get('templateId')!;
    const versionId = this.route.snapshot.paramMap.get('versionId')!;
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({ template: this.api.getTemplate(templateId), version: this.api.getVersion(versionId) })
      .pipe(
        switchMap(({ template, version }) => {
          const previous = template.versions
            .filter((v) => v.status === TemplateVersionStatus.Published && v.id !== version.id)
            .sort((a, b) => b.versionNumber - a.versionNumber)[0];
          return forkJoin({ template: of(template), version: of(version), published: previous ? this.api.getVersion(previous.id) : of(null) });
        }),
      )
      .subscribe({
        next: ({ template, version, published }) => {
          this.template.set(template);
          this.applyVersion(version);
          this.published = published ? (JSON.parse(published.definitionJson) as FormDefinition) : null;
          this.loading.set(false);
        },
        error: (e: ClinicalFormsError) => {
          this.loadError.set(e.message);
          this.loading.set(false);
        },
      });
  }

  private applyVersion(version: FormVersionDetail): void {
    this.version.set(version);
    this.definition = JSON.parse(version.definitionJson) as FormDefinition;
    this.definition.sections ??= [];
    this.versionLabel = version.versionLabel ?? '';
    this.savedSnapshot = this.snapshot();
    this.selectedSection = Math.min(this.selectedSection, Math.max(0, this.definition.sections.length - 1));
  }

  get readOnly(): boolean {
    return this.version()?.status !== TemplateVersionStatus.Draft;
  }

  get section(): SectionDefinition | null {
    return this.definition?.sections[this.selectedSection] ?? null;
  }

  private snapshot(): string {
    return this.definition ? JSON.stringify(prepareForSave(this.definition)) + '|' + this.versionLabel : '';
  }

  hasUnsavedChanges(): boolean {
    return !this.readOnly && !!this.definition && this.snapshot() !== this.savedSnapshot;
  }

  issues(): ClinicalFormValidationError[] {
    return this.version()?.validationIssues ?? [];
  }

  issueText(issue: ClinicalFormValidationError): string {
    return locateIssue(issue.path, this.definition).text;
  }

  goToIssue(issue: ClinicalFormValidationError): void {
    const at = locateIssue(issue.path, this.definition);
    if (at.area === 'structure' && at.sectionIndex !== undefined) {
      this.tab.set('structure');
      this.selectedSection = at.sectionIndex;
      this.expandedField = at.fieldIndex !== undefined ? (this.section?.fields[at.fieldIndex] ?? null) : null;
    } else if (at.area === 'consents' || at.area === 'optionSets') this.tab.set(at.area);
  }

  // ------------------------------------------------------------------ save / publish

  save(after?: () => void): void {
    const version = this.version();
    if (!version || !this.definition || this.readOnly) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.message.set(null);
    const sent = this.snapshot();
    this.api
      .updateDraftVersion(version.id, {
        definitionJson: JSON.stringify(prepareForSave(this.definition)),
        versionLabel: this.versionLabel.trim() || null,
        rowVersion: version.rowVersion,
      })
      .subscribe({
        next: (saved) => {
          this.version.set(saved);
          this.savedSnapshot = sent;
          this.busy.set(false);
          this.message.set(saved.validationIssues.length ? 'Draft saved. Fix the problems listed before publishing.' : 'Draft saved. It is ready to publish.');
          after?.();
        },
        error: (e: ClinicalFormsError) => {
          this.busy.set(false);
          this.actionError.set(e.isConflict ? 'This draft was changed in another window. Reload to get the latest copy (your changes here would be lost).' : this.describe(e));
        },
      });
  }

  publish(): void {
    const proceed = () => {
      const version = this.version()!;
      if (version.validationIssues.length > 0) {
        this.actionError.set('The draft cannot be published until the problems listed are fixed.');
        return;
      }
      const ok = window.confirm(
        `Publish version ${version.versionNumber} of "${this.template()?.formName}"?\n\n` +
          '• Every hospital using this form will start new forms on this version straight away.\n' +
          '• Forms already filled in keep the version they were filled on.\n' +
          '• A published version can no longer be edited; later changes go into a new version.',
      );
      if (!ok) return;
      this.busy.set(true);
      this.api.publishVersion(version.id, version.rowVersion).subscribe({
        next: () => {
          this.busy.set(false);
          this.savedSnapshot = this.snapshot();
          this.router.navigate(['/superadmin/clinical-forms', this.template()!.id], { state: { message: `Version ${version.versionNumber} published.` } });
        },
        error: (e: ClinicalFormsError) => {
          this.busy.set(false);
          this.actionError.set(this.describe(e));
        },
      });
    };
    if (this.hasUnsavedChanges()) this.save(proceed);
    else proceed();
  }

  deleteDraft(): void {
    const version = this.version();
    if (!version || !window.confirm(`Delete draft version ${version.versionNumber}? All changes in it are lost.`)) return;
    this.busy.set(true);
    this.api.deleteDraftVersion(version.id, version.rowVersion).subscribe({
      next: () => {
        this.busy.set(false);
        this.savedSnapshot = this.snapshot();
        this.router.navigate(['/superadmin/clinical-forms', this.template()!.id]);
      },
      error: (e: ClinicalFormsError) => {
        this.busy.set(false);
        this.actionError.set(this.describe(e));
      },
    });
  }

  private describe(e: ClinicalFormsError): string {
    return e.errors?.length ? `${e.message} ${e.errors.map((x) => x.message).join(' ')}` : e.message;
  }

  // ------------------------------------------------------------------ tabs

  setTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'preview') this.refreshPreview();
    if (tab === 'json') {
      this.jsonText = this.definition ? JSON.stringify(prepareForSave(this.definition), null, 2) : '';
      this.jsonError = null;
    }
  }

  refreshPreview(): void {
    this.previewDefinition = null;
    const show = () => {
      const v = this.version();
      if (v && v.validationIssues.length === 0) this.previewDefinition = JSON.parse(v.definitionJson) as FormDefinition;
    };
    if (this.hasUnsavedChanges()) this.save(show);
    else show();
  }

  applyJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText) as FormDefinition;
      if (!parsed || !Array.isArray(parsed.sections)) throw new Error('The JSON must contain a "sections" list.');
      this.definition = parsed;
      this.selectedSection = 0;
      this.expandedField = null;
      this.jsonError = null;
      this.message.set('JSON applied. Save the draft to check it.');
    } catch (e) {
      this.jsonError = e instanceof Error ? e.message : 'The JSON could not be read.';
    }
  }

  // ------------------------------------------------------------------ sections

  publishedSection(key: string): SectionDefinition | undefined {
    return this.published?.sections.find((s) => s.key === key);
  }

  publishedField(sectionKey: string, fieldKey: string): FieldDefinition | undefined {
    return this.publishedSection(sectionKey)?.fields.find((f) => f.key === fieldKey);
  }

  selectSection(index: number): void {
    this.selectedSection = index;
    this.expandedField = null;
    this.showPalette = false;
  }

  addSection(): void {
    const sections = this.definition!.sections;
    sections.push(newSection(`Section ${sections.length + 1}`, sections));
    this.selectSection(sections.length - 1);
  }

  moveSection(index: number, delta: number): void {
    const sections = this.definition!.sections;
    const selected = sections[this.selectedSection];
    move(sections, index, delta);
    this.selectedSection = sections.indexOf(selected);
  }

  removeSection(index: number): void {
    const s = this.definition!.sections[index];
    const warn = this.publishedSection(s.key) ? '\n\nForms filled in on earlier versions keep their answers; new forms will not have this section.' : '';
    if (!window.confirm(`Remove the section "${s.title}" and all its fields?${warn}`)) return;
    this.definition!.sections.splice(index, 1);
    this.selectSection(Math.max(0, Math.min(this.selectedSection, this.definition!.sections.length - 1)));
  }

  sectionKeyFixed(s: SectionDefinition): boolean {
    return !!this.publishedSection(s.key);
  }

  private manualSectionKeys = new WeakSet<SectionDefinition>();

  setSectionTitle(s: SectionDefinition, title: string): void {
    s.title = title;
    if (this.sectionKeyFixed(s) || this.manualSectionKeys.has(s)) return;
    s.key = uniqueKey(toKey(title, 'section'), this.definition!.sections.filter((x) => x !== s).map((x) => x.key));
  }

  setSectionKey(s: SectionDefinition, key: string): void {
    this.manualSectionKeys.add(s);
    s.key = key.trim();
  }

  sectionKeyError(s: SectionDefinition): string | null {
    if (!KEY_PATTERN.test(s.key)) return 'Letters and digits only, starting with a lower-case letter.';
    if (this.definition!.sections.some((x) => x !== s && x.key === s.key)) return 'Another section uses this key.';
    return null;
  }

  hasRole(s: SectionDefinition, role: string): boolean {
    return !!s.editableBy?.includes(role);
  }

  toggleRole(s: SectionDefinition, role: string, on: boolean): void {
    const roles = new Set(s.editableBy ?? []);
    if (on) roles.add(role);
    else roles.delete(role);
    s.editableBy = EDITOR_ROLES.filter((r) => roles.has(r));
  }

  setSectionFlag(s: SectionDefinition, flag: 'clinical' | 'required', on: boolean): void {
    if (on) s[flag] = true;
    else delete s[flag];
  }

  // ------------------------------------------------------------------ fields

  typeInfo(type: string) {
    return typeInfo(type);
  }

  toggleField(f: FieldDefinition): void {
    this.expandedField = this.expandedField === f ? null : f;
  }

  addField(type: FieldType): void {
    const s = this.section!;
    const created = newField(type, s.fields, this.definition!);
    s.fields.push(created);
    this.expandedField = created;
    this.showPalette = false;
  }

  duplicateField(index: number): void {
    const s = this.section!;
    const copy = deepClone(s.fields[index]);
    copy.label = `${copy.label} (copy)`;
    copy.key = uniqueKey(toKey(copy.label), s.fields.map((f) => f.key));
    delete copy.locked;
    s.fields.splice(index + 1, 0, copy);
    this.expandedField = copy;
  }

  moveField(index: number, delta: number): void {
    move(this.section!.fields, index, delta);
  }

  removeField(index: number): void {
    const s = this.section!;
    const f = s.fields[index];
    const warn = this.publishedField(s.key, f.key) ? '\n\nForms filled in on earlier versions keep their answers; new forms will not ask this.' : '';
    if (!window.confirm(`Remove the field "${f.label}"?${warn}`)) return;
    s.fields.splice(index, 1);
    if (this.expandedField === f) this.expandedField = null;
  }

  /** Top-level option fields of the section, for table columns that reuse their options. */
  optionFields(s: SectionDefinition): FieldDefinition[] {
    return s.fields.filter((f) => OPTION_TYPES.has(f.type));
  }

  fieldBadges(f: FieldDefinition): string[] {
    const badges: string[] = [];
    if (f.required) badges.push('required');
    if (f.requiredWhen) badges.push('required when…');
    if (f.visibleWhen) badges.push('shown when…');
    if (f.locked) badges.push('locked');
    if (f.alert) badges.push('alert');
    return badges;
  }

  // ------------------------------------------------------------------ shared option lists

  optionSetNames(): string[] {
    return Object.keys(this.definition?.optionSets ?? {}).filter((n) => n !== TICKED_SET);
  }

  optionSetRows(name: string): FieldOption[] {
    return this.definition!.optionSets![name];
  }

  addOptionSet(): void {
    this.definition!.optionSets ??= {};
    const name = uniqueKey('newList', [...Object.keys(this.definition!.optionSets), ...Object.keys(BUILT_IN_OPTION_SETS)]);
    this.definition!.optionSets[name] = [{ value: 'option1', label: 'Option 1' }];
  }

  renameOptionSet(oldName: string, raw: string): void {
    const name = raw.trim();
    const sets = this.definition!.optionSets!;
    if (!name || name === oldName || sets[name] || name in BUILT_IN_OPTION_SETS) return;
    const rebuilt: Record<string, FieldOption[]> = {};
    for (const [k, v] of Object.entries(sets)) rebuilt[k === oldName ? name : k] = v;
    this.definition!.optionSets = rebuilt;
    this.forEachField((f) => {
      if (f.optionSet === oldName) f.optionSet = name;
      if (f.itemOptionSet === oldName) f.itemOptionSet = name;
    });
  }

  optionSetUsage(name: string): number {
    let count = 0;
    this.forEachField((f) => {
      if (f.optionSet === name || f.itemOptionSet === name) count++;
    });
    return count;
  }

  removeOptionSet(name: string): void {
    if (this.optionSetUsage(name) > 0) {
      window.alert('This list is used by fields. Change those fields first.');
      return;
    }
    delete this.definition!.optionSets![name];
  }

  optionSetNameValid(name: string): boolean {
    return KEY_PATTERN.test(name);
  }

  // ------------------------------------------------------------------ consents

  consents(): ConsentDefinition[] {
    return (this.definition!.consents ??= []);
  }

  addConsent(): void {
    addConsent(this.definition!);
  }

  consentFixed(c: ConsentDefinition): boolean {
    return !!this.published?.consents?.some((p) => p.consentType === c.consentType);
  }

  publishedConsent(c: ConsentDefinition): ConsentDefinition | undefined {
    return this.published?.consents?.find((p) => p.consentType === c.consentType);
  }

  /** Changed wording should carry a new version so signed records show which text was accepted. */
  consentNeedsNewVersion(c: ConsentDefinition): boolean {
    const p = this.publishedConsent(c);
    return !!p && p.text !== c.text && p.consentVersion === c.consentVersion;
  }

  consentUsage(c: ConsentDefinition): number {
    let count = 0;
    this.forEachField((f) => {
      if (f.type === 'consent' && f.consentType === c.consentType) count++;
    });
    return count;
  }

  setConsentType(c: ConsentDefinition, raw: string): void {
    const old = c.consentType;
    c.consentType = raw.trim();
    this.forEachField((f) => {
      if (f.type === 'consent' && f.consentType === old) f.consentType = c.consentType;
    });
  }

  consentTypeValid(c: ConsentDefinition): boolean {
    return KEBAB_PATTERN.test(c.consentType);
  }

  setConsentFlag(c: ConsentDefinition, flag: 'required' | 'allowGuardian' | 'requireSignature' | 'witnessOptional', on: boolean): void {
    c[flag] = on;
  }

  removeConsent(index: number): void {
    const c = this.consents()[index];
    if (this.consentUsage(c) > 0) {
      window.alert('This consent is used by a Consent field. Remove that field first.');
      return;
    }
    this.consents().splice(index, 1);
  }

  private forEachField(visit: (f: FieldDefinition) => void): void {
    const walk = (f: FieldDefinition) => {
      visit(f);
      f.itemFields?.forEach(walk);
      f.columns?.forEach(walk);
    };
    this.definition?.sections.forEach((s) => s.fields.forEach(walk));
  }
}
