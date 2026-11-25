import { signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  FieldDefinition,
  FormAnswers,
  FormDefinition,
  PatientFormContext,
  SectionDefinition,
} from '../models/clinical-forms.models';
import {
  ConditionContext,
  DEFAULT_MAX_ROWS,
  DEFAULT_TEXT_MAX_LENGTH,
  DEFAULT_TEXTAREA_MAX_LENGTH,
  NON_ANSWER_TYPES,
  PHONE_PATTERN,
  cleanValue,
  evaluateCondition,
  isItemVisible,
  isVisible,
  orderedFields,
  orderedSections,
} from './clinical-form-engine';

export interface ClinicalFormModelOptions {
  /** Existing answers to start from. */
  answers?: FormAnswers | null;
  /** Section keys the user may edit (server-provided). Undefined/null means every section. */
  editableSections?: ReadonlySet<string> | null;
  /** Render everything read-only (e.g. submitted records outside amendment). */
  readOnly?: boolean;
  patient?: PatientFormContext | null;
}

export type ValidationMode = 'draft' | 'submit';

export interface FormIssue {
  path: string;
  label: string;
  message: string;
}

const MAX_VISIBILITY_PASSES = 10;

/**
 * Reactive-forms state for any clinical form definition. Owns the FormGroup, keeps conditional
 * visibility / required validators / section permissions in sync with the values, and produces the
 * answers payload. Contains no rendering and no HTTP.
 *
 * Structure: root FormGroup → section FormGroup → per field:
 *   simple types: FormControl · checkboxGroup/attachmentList: FormControl<string[]>
 *   conditionList: FormGroup<item → FormGroup<status + item fields>> · repeater: FormArray<FormGroup<columns>>
 *   patientBinding and consent have no control (their values never come from the form).
 */
export class ClinicalFormModel {
  readonly form = new FormGroup<Record<string, FormGroup>>({});
  readonly sections: SectionDefinition[];
  /** Bumped after every recalculation so templates re-read visibility/required state. */
  readonly version = signal(0);

  private readonly visibility = new Map<string, boolean>();
  private readonly requiredNow = new Map<string, boolean>();
  private readonly editable: ReadonlySet<string> | null;
  private readonly readOnly: boolean;
  private readonly patient: PatientFormContext | null;
  /** Server-reported problems keyed by 'section.field' (field level) or 'section' (section level). */
  private readonly serverMessages = new Map<string, string[]>();

  constructor(readonly definition: FormDefinition, options: ClinicalFormModelOptions = {}) {
    this.sections = orderedSections(definition).map((s) => ({ ...s, fields: orderedFields(s) }));
    this.editable = options.editableSections ?? null;
    this.readOnly = !!options.readOnly;
    this.patient = options.patient ?? null;

    for (const section of this.sections)
      this.form.addControl(section.key, this.buildSection(section, options.answers?.[section.key] ?? {}));

    this.refresh();
    this.form.valueChanges.subscribe(() => this.refresh());
  }

  // ------------------------------------------------------------------ queries used by the renderer

  canEditSection(sectionKey: string): boolean {
    return !this.readOnly && (this.editable === null || this.editable.has(sectionKey));
  }

  isVisible(path: string): boolean {
    return this.visibility.get(path) ?? true;
  }

  isRequired(path: string): boolean {
    return this.requiredNow.get(path) ?? false;
  }

  sectionGroup(sectionKey: string): FormGroup {
    return this.form.controls[sectionKey];
  }

  control(sectionKey: string, fieldKey: string): AbstractControl | null {
    return this.sectionGroup(sectionKey)?.get(fieldKey) ?? null;
  }

  patientValue(binding: string | undefined): string | number | null | undefined {
    return binding ? this.patient?.bindings?.[binding] : undefined;
  }

  get patientContext(): PatientFormContext | null {
    return this.patient;
  }

  // ------------------------------------------------------------------ repeater rows

  addRow(sectionKey: string, field: FieldDefinition): void {
    const array = this.control(sectionKey, field.key) as FormArray<FormGroup>;
    if (!this.canEditSection(sectionKey) || array.length >= (field.maxRows ?? DEFAULT_MAX_ROWS)) return;
    array.push(this.buildRow(field, {}));
  }

  removeRow(sectionKey: string, field: FieldDefinition, index: number): void {
    const array = this.control(sectionKey, field.key) as FormArray<FormGroup>;
    if (!this.canEditSection(sectionKey) || index < 0 || index >= array.length) return;
    array.removeAt(index);
  }

  // ------------------------------------------------------------------ output

  /**
   * Answers for the sections this user may edit, with hidden and empty values removed. Sections the user
   * cannot edit are omitted, so the server keeps them unchanged (section-level merge).
   */
  answers(): FormAnswers {
    const raw = this.form.getRawValue() as Record<string, Record<string, unknown>>;
    const result: FormAnswers = {};
    for (const section of this.sections) {
      // Sections without answerable fields (e.g. only consent / patient-record values) are never sent.
      if (!this.canEditSection(section.key) || section.fields.every((f) => NON_ANSWER_TYPES.has(f.type))) continue;
      const sectionAnswers: Record<string, unknown> = {};
      for (const field of section.fields) {
        if (NON_ANSWER_TYPES.has(field.type) || !this.isVisible(this.path(section.key, field.key))) continue;
        const value = cleanValue(field, this.visibleRawValue(section, field, raw[section.key]?.[field.key]));
        if (value !== undefined) sectionAnswers[field.key] = value;
      }
      result[section.key] = sectionAnswers;
    }
    return result;
  }

  /**
   * Marks everything touched and lists problems. Draft mode ignores completeness (required) because the
   * server accepts incomplete drafts; submit mode includes it. The server re-validates in both cases.
   */
  validate(mode: ValidationMode): FormIssue[] {
    this.form.markAllAsTouched();
    this.version.update((v) => v + 1);
    const issues: FormIssue[] = [];
    for (const section of this.sections) {
      if (!this.canEditSection(section.key)) continue;
      for (const field of section.fields) {
        const control = this.control(section.key, field.key);
        if (!control || control.disabled) continue;
        this.collectIssues(control, `${section.title} › ${field.label}`, this.path(section.key, field.key), mode, issues);
      }
    }
    return issues;
  }

  // ------------------------------------------------------------------ server errors

  /**
   * Shows server validation errors next to the field (paths like 'answers.section.field…') or, when the
   * path names only a section, at the section. Returns the errors that match neither, for a general list.
   */
  applyServerErrors(errors: ReadonlyArray<{ path: string; message: string }>): { path: string; message: string }[] {
    this.serverMessages.clear();
    const unmatched: { path: string; message: string }[] = [];
    for (const error of errors) {
      const parts = (error.path ?? '').replace(/^answers\.?/, '').replace(/\[(\d+)\]/g, '.$1').split('.').filter((p) => p);
      const section = this.sections.find((s) => s.key === parts[0]);
      let key: string | null = null;
      if (section && parts.length > 1 && section.fields.some((f) => f.key === parts[1])) key = `${parts[0]}.${parts[1]}`;
      else if (section) key = section.key;
      if (key === null) {
        unmatched.push(error);
        continue;
      }
      this.serverMessages.set(key, [...(this.serverMessages.get(key) ?? []), error.message]);
    }
    this.form.markAllAsTouched();
    this.version.update((v) => v + 1);
    return unmatched;
  }

  clearServerErrors(): void {
    if (this.serverMessages.size === 0) return;
    this.serverMessages.clear();
    this.version.update((v) => v + 1);
  }

  /** Server messages for a top-level field ('section.field') or a whole section ('section'). */
  serverErrorsFor(path: string): string[] {
    this.version();
    return this.serverMessages.get(path) ?? [];
  }

  // ------------------------------------------------------------------ building

  private buildSection(section: SectionDefinition, answers: Record<string, unknown>): FormGroup {
    const group = new FormGroup<Record<string, AbstractControl>>({});
    for (const field of section.fields) {
      const control = this.buildField(field, answers[field.key]);
      if (control) group.addControl(field.key, control);
    }
    return group;
  }

  private buildField(field: FieldDefinition, initial: unknown): AbstractControl | null {
    switch (field.type) {
      case 'patientBinding':
      case 'consent':
        return null;
      case 'conditionList': {
        const items = new FormGroup<Record<string, FormGroup>>({});
        const source = (initial && typeof initial === 'object' ? initial : {}) as Record<string, Record<string, unknown>>;
        for (const item of field.items ?? []) {
          const itemAnswer = source[item.key] ?? {};
          const itemGroup = new FormGroup<Record<string, AbstractControl>>({
            status: new FormControl(itemAnswer['status'] ?? null),
          });
          for (const itemField of field.itemFields ?? []) {
            const control = this.buildField(itemField, itemAnswer[itemField.key]);
            if (control) itemGroup.addControl(itemField.key, control);
          }
          items.addControl(item.key, itemGroup);
        }
        return items;
      }
      case 'repeater': {
        const rows = Array.isArray(initial) ? (initial as Record<string, unknown>[]) : [];
        return new FormArray<FormGroup>(rows.map((row) => this.buildRow(field, row ?? {})));
      }
      case 'checkboxGroup':
      case 'attachmentList':
        return new FormControl<string[]>(Array.isArray(initial) ? [...(initial as string[])] : [], { validators: staticValidators(field) });
      case 'boolean':
        return new FormControl<boolean | null>(typeof initial === 'boolean' ? initial : null);
      case 'number':
        return new FormControl<number | null>(typeof initial === 'number' ? initial : null, { validators: staticValidators(field) });
      case 'select':
      case 'radio':
      case 'yesNoUnknown':
        return new FormControl<string | null>(typeof initial === 'string' ? initial : null);
      default:
        return new FormControl<string>(typeof initial === 'string' ? initial : '', { nonNullable: true, validators: staticValidators(field) });
    }
  }

  private buildRow(field: FieldDefinition, row: Record<string, unknown>): FormGroup {
    const group = new FormGroup<Record<string, AbstractControl>>({});
    for (const column of field.columns ?? []) {
      const control = this.buildField(column, row[column.key]);
      if (control) group.addControl(column.key, control);
    }
    return group;
  }

  // ------------------------------------------------------------------ recalculation

  private refresh(): void {
    const raw = this.form.getRawValue() as FormAnswers;
    const effective = this.computeVisibility(raw);

    for (const section of this.sections) {
      const editable = this.canEditSection(section.key);
      const ctx: ConditionContext = { definition: this.definition, section, answers: effective, patient: this.patient };
      for (const field of section.fields) {
        const control = this.control(section.key, field.key);
        if (!control) continue;
        const path = this.path(section.key, field.key);
        const visible = this.isVisible(path);
        const required = visible && (!!field.required || (!!field.requiredWhen && evaluateCondition(field.requiredWhen, ctx)));
        this.requiredNow.set(path, required);

        // Order matters: enabling a group re-enables all of its children, so a parent's state is applied first
        // and children are only enabled while their parent is enabled (enabling a child re-enables its parent).
        if (field.type === 'conditionList') {
          setEnabled(control, editable && visible);
          this.applyConditionList(section, field, control as FormGroup, editable && visible, required);
        } else if (field.type === 'repeater') {
          this.applyRepeater(field, control as FormArray<FormGroup>, editable && visible, required);
        } else {
          setValidators(control, required ? [...staticValidators(field), Validators.required] : staticValidators(field));
          setEnabled(control, editable && visible);
        }
      }
    }
    this.version.update((v) => v + 1);
  }

  /** Iterative: values of hidden fields do not count for other conditions (as on the server). */
  private computeVisibility(raw: FormAnswers): FormAnswers {
    const effective: FormAnswers = JSON.parse(JSON.stringify(raw ?? {}));
    for (let pass = 0; pass < MAX_VISIBILITY_PASSES; pass++) {
      let changed = false;
      for (const section of this.sections) {
        const ctx: ConditionContext = { definition: this.definition, section, answers: effective, patient: this.patient };
        const sectionValues = (effective[section.key] ??= {});
        for (const field of section.fields) {
          const path = this.path(section.key, field.key);
          const visible = isVisible(field.visibleWhen, ctx);
          if (this.visibility.get(path) !== visible) changed = true;
          this.visibility.set(path, visible);
          if (!visible && field.key in sectionValues) {
            delete sectionValues[field.key];
            changed = true;
          }
          if (visible && field.type === 'conditionList') this.computeItemVisibility(section, field, effective, ctx);
        }
      }
      if (!changed) break;
    }
    return effective;
  }

  private computeItemVisibility(section: SectionDefinition, field: FieldDefinition, effective: FormAnswers, ctx: ConditionContext): void {
    const items = (effective[section.key]?.[field.key] ?? {}) as Record<string, Record<string, unknown>>;
    for (const item of field.items ?? []) {
      const itemPath = this.path(section.key, field.key, item.key);
      const itemVisible = isItemVisible(item, ctx);
      this.visibility.set(itemPath, itemVisible);
      const itemValue = items[item.key] ?? {};
      for (const itemField of field.itemFields ?? []) {
        const visible = itemVisible && isVisible(itemField.visibleWhen, { ...ctx, item: itemValue });
        this.visibility.set(`${itemPath}.${itemField.key}`, visible);
      }
    }
  }

  private applyConditionList(section: SectionDefinition, field: FieldDefinition, group: FormGroup, enabled: boolean, required: boolean): void {
    for (const item of field.items ?? []) {
      const itemGroup = group.get(item.key) as FormGroup | null;
      if (!itemGroup) continue;
      const itemPath = this.path(section.key, field.key, item.key);
      const itemVisible = this.isVisible(itemPath);
      const status = itemGroup.get('status')!;
      this.requiredNow.set(`${itemPath}.status`, required && itemVisible);
      setValidators(status, required && itemVisible ? [Validators.required] : []);
      setEnabled(status, enabled && itemVisible);

      for (const itemField of field.itemFields ?? []) {
        const control = itemGroup.get(itemField.key);
        if (!control) continue;
        const path = `${itemPath}.${itemField.key}`;
        const visible = itemVisible && this.isVisible(path);
        const itemRequired = visible && !!itemField.required;
        this.requiredNow.set(path, itemRequired);
        setValidators(control, itemRequired ? [...staticValidators(itemField), Validators.required] : staticValidators(itemField));
        setEnabled(control, enabled && visible);
      }
    }
  }

  private applyRepeater(field: FieldDefinition, array: FormArray<FormGroup>, enabled: boolean, required: boolean): void {
    setValidators(array, required ? [minRows(1)] : []);
    for (const row of array.controls) {
      for (const column of field.columns ?? []) {
        const control = row.get(column.key);
        if (!control) continue;
        setValidators(control, column.required ? [...staticValidators(column), Validators.required] : staticValidators(column));
      }
    }
    setEnabled(array, enabled);
  }

  // ------------------------------------------------------------------ output helpers

  private visibleRawValue(section: SectionDefinition, field: FieldDefinition, raw: unknown): unknown {
    if (field.type !== 'conditionList' || !raw || typeof raw !== 'object') return raw;
    const source = raw as Record<string, Record<string, unknown>>;
    const filtered: Record<string, Record<string, unknown>> = {};
    for (const item of field.items ?? []) {
      const itemPath = this.path(section.key, field.key, item.key);
      if (!this.isVisible(itemPath) || !source[item.key]) continue;
      const itemValue: Record<string, unknown> = { status: source[item.key]['status'] };
      for (const itemField of field.itemFields ?? [])
        if (this.isVisible(`${itemPath}.${itemField.key}`)) itemValue[itemField.key] = source[item.key][itemField.key];
      filtered[item.key] = itemValue;
    }
    return filtered;
  }

  private collectIssues(control: AbstractControl, label: string, path: string, mode: ValidationMode, issues: FormIssue[]): void {
    if (control.disabled) return;
    if (control.errors) {
      for (const [key, detail] of Object.entries(control.errors)) {
        if (mode === 'draft' && (key === 'required' || key === 'minRows')) continue;
        issues.push({ path, label, message: errorMessage(key, detail) });
      }
    }
    if (control instanceof FormGroup || control instanceof FormArray) {
      for (const [childKey, child] of Object.entries(control.controls))
        this.collectIssues(child, `${label} › ${childKey}`, `${path}.${childKey}`, mode, issues);
    }
  }

  private path(...parts: string[]): string {
    return parts.join('.');
  }
}

// ------------------------------------------------------------------ validators

/** Non-required validators derived from the field definition. */
export function staticValidators(field: FieldDefinition): ValidatorFn[] {
  const rules = field.validation ?? {};
  const validators: ValidatorFn[] = [];
  if (field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'phone') {
    validators.push(Validators.maxLength(rules.maxLength ?? (field.type === 'textarea' ? DEFAULT_TEXTAREA_MAX_LENGTH : DEFAULT_TEXT_MAX_LENGTH)));
    if (rules.minLength) validators.push(Validators.minLength(rules.minLength));
    if (rules.pattern) validators.push(Validators.pattern(rules.pattern));
    else if (field.type === 'email') validators.push(Validators.email);
    else if (field.type === 'phone') validators.push(Validators.pattern(PHONE_PATTERN));
  }
  if (field.type === 'number') {
    if (rules.min !== undefined) validators.push(Validators.min(rules.min));
    if (rules.max !== undefined) validators.push(Validators.max(rules.max));
  }
  if (field.type === 'date') validators.push(dateRange(rules.minDate, rules.maxDate));
  return validators;
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** yyyy-MM-dd strings compare lexicographically; "today" is the user's local date. */
export function dateRange(min?: string, max?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { dateFormat: true };
    const minValue = min === 'today' ? localToday() : min;
    const maxValue = max === 'today' ? localToday() : max;
    if (minValue && value < minValue) return { minDate: { min: minValue } };
    if (maxValue && value > maxValue) return { maxDate: { max: maxValue } };
    return null;
  };
}

export function minRows(count: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    control instanceof FormArray && control.length < count ? { minRows: { min: count } } : null;
}

export function errorMessage(key: string, detail: unknown): string {
  const info = (detail ?? {}) as Record<string, unknown>;
  switch (key) {
    case 'required': return 'This field is required.';
    case 'minRows': return 'At least one row is required.';
    case 'maxlength': return `Maximum ${info['requiredLength']} characters.`;
    case 'minlength': return `Minimum ${info['requiredLength']} characters.`;
    case 'pattern': return 'The format is not valid.';
    case 'email': return 'Enter a valid email address.';
    case 'min': return `Must be at least ${info['min']}.`;
    case 'max': return `Must be at most ${info['max']}.`;
    case 'dateFormat': return 'Enter a valid date.';
    case 'minDate': return 'The date is too early.';
    case 'maxDate': return 'The date cannot be in the future.';
    default: return 'The value is not valid.';
  }
}

function setValidators(control: AbstractControl, validators: ValidatorFn[]): void {
  control.setValidators(validators);
  control.updateValueAndValidity({ emitEvent: false });
}

function setEnabled(control: AbstractControl, enabled: boolean): void {
  if (enabled && control.disabled) control.enable({ emitEvent: false });
  else if (!enabled && control.enabled) control.disable({ emitEvent: false });
}
