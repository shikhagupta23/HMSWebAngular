import { Component, Input } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { ClinicalFormModel, errorMessage } from '../../engine/clinical-form-model';
import { resolveOptions } from '../../engine/clinical-form-engine';
import { ConsentDefinition, FieldDefinition, FieldOption, SectionDefinition } from '../../models/clinical-forms.models';
import { ClinicalFormAttachmentHandler } from '../clinical-form-attachment-handler';

/**
 * Renders one field of any supported V1 type. Used for top-level fields and, through the
 * condition-list and repeater components, for nested item fields and columns.
 */
@Component({
  selector: 'app-clinical-form-field',
  standalone: false,
  templateUrl: './clinical-form-field.html',
})
export class ClinicalFormField {
  @Input({ required: true }) model!: ClinicalFormModel;
  @Input({ required: true }) section!: SectionDefinition;
  @Input({ required: true }) field!: FieldDefinition;
  /** Nested control (item field / repeater column); top-level fields resolve their own control. */
  @Input() control: AbstractControl | null = null;
  /** Model path for nested fields (visibility/required lookups); defaults to section.field. */
  @Input() path: string | null = null;
  /** Explicit required flag for nested fields that have no model path (repeater columns). */
  @Input() required: boolean | null = null;
  /** Hide the label (e.g. inside compact table rows). */
  @Input() compact = false;
  /** Upload/view bridge for attachmentList fields (supplied by the hosting page). */
  @Input() attachmentHandler: ClinicalFormAttachmentHandler | null = null;

  get fieldPath(): string {
    return this.path ?? `${this.section.key}.${this.field.key}`;
  }

  get inputId(): string {
    return `cf-${this.fieldPath.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  }

  get formControl(): FormControl {
    return (this.control ?? this.model.control(this.section.key, this.field.key)) as FormControl;
  }

  get options(): FieldOption[] {
    return resolveOptions(this.model.definition, this.section, this.field);
  }

  get isRequired(): boolean {
    this.model.version();
    return this.required ?? this.model.isRequired(this.fieldPath);
  }

  get disabled(): boolean {
    this.model.version();
    return !this.formControl || this.formControl.disabled;
  }

  get showErrors(): boolean {
    this.model.version();
    const control = this.formControl;
    return !!control && control.invalid && control.enabled && (control.touched || control.dirty);
  }

  get errors(): string[] {
    const errors = this.formControl?.errors ?? {};
    return Object.entries(errors).map(([key, detail]) => errorMessage(key, detail));
  }

  /** Server-reported problems; shown for top-level fields only (nested paths roll up to their field). */
  get serverErrors(): string[] {
    return this.path ? [] : this.model.serverErrorsFor(this.fieldPath);
  }

  get maxLength(): number | null {
    return this.field.validation?.maxLength ?? null;
  }

  get patientValue(): string | number | null | undefined {
    return this.model.patientValue(this.field.binding);
  }

  get consent(): ConsentDefinition | undefined {
    return this.model.definition.consents?.find((c) => c.consentType === this.field.consentType);
  }

  get attachmentCount(): number {
    const value = this.formControl?.value;
    return Array.isArray(value) ? value.length : 0;
  }

  // ------------------------------------------------------------------ checkbox group

  isChecked(value: string): boolean {
    const current = this.formControl?.value;
    return Array.isArray(current) && current.includes(value);
  }

  toggle(value: string, checked: boolean): void {
    const control = this.formControl;
    if (!control || control.disabled) return;
    const current: string[] = Array.isArray(control.value) ? control.value : [];
    let next: string[];
    if (!checked) next = current.filter((v) => v !== value);
    else if (this.field.exclusiveOption && value === this.field.exclusiveOption) next = [value];
    else next = [...current.filter((v) => v !== this.field.exclusiveOption), value];
    // Keep definition order for stable answers.
    const order = this.options.map((o) => o.value);
    next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    control.setValue(next);
    control.markAsTouched();
  }
}
