import { Component, Input } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { ClinicalFormModel, errorMessage } from '../../engine/clinical-form-model';
import { itemStatusOptions } from '../../engine/clinical-form-engine';
import { ConditionItem, FieldDefinition, FieldOption, SectionDefinition } from '../../models/clinical-forms.models';

/** A list of items (e.g. medical conditions), each with a status and optional per-item fields. */
@Component({
  selector: 'app-clinical-form-condition-list',
  standalone: false,
  templateUrl: './clinical-form-condition-list.html',
})
export class ClinicalFormConditionList {
  @Input({ required: true }) model!: ClinicalFormModel;
  @Input({ required: true }) section!: SectionDefinition;
  @Input({ required: true }) field!: FieldDefinition;

  get basePath(): string {
    return `${this.section.key}.${this.field.key}`;
  }

  get statusOptions(): FieldOption[] {
    return itemStatusOptions(this.model.definition, this.field);
  }

  /**
   * Paper-style tick boxes: when the item status set has a single value (e.g. "yes"), each item is a
   * checkbox. Ticking stores that value; unticking clears the item (not answered).
   */
  get tickMode(): boolean {
    return this.statusOptions.length === 1;
  }

  /**
   * Tick lists whose items are sentences (e.g. "Eating quickly (less than 10 minutes)") read badly as
   * wrapped chips, so they are laid out as an aligned checklist with the details beside each ticked item.
   */
  get statementMode(): boolean {
    return (this.field.items ?? []).some((item) => item.label.length > STATEMENT_LABEL_LENGTH);
  }

  /** In tick mode an item keyed "none" excludes the others (and vice versa), like the paper "None" box. */
  static readonly NONE_KEY = 'none';

  isTicked(item: ConditionItem): boolean {
    this.model.version();
    const value = this.statusOptions[0]?.value;
    return !!value && this.status(item)?.value === value;
  }

  ticked(): ConditionItem[] {
    return (this.field.items ?? []).filter((item) => this.itemVisible(item) && this.isTicked(item));
  }

  /** Item fields are only shown for ticked items that have something to fill in. */
  hasDetails(item: ConditionItem): boolean {
    return (this.field.itemFields ?? []).some((f) => this.itemFieldVisible(item, f));
  }

  toggle(item: ConditionItem, checked: boolean): void {
    const control = this.status(item);
    if (!control || control.disabled) return;
    const value = this.statusOptions[0]?.value ?? null;
    if (checked) {
      for (const other of this.field.items ?? []) {
        const exclusive = item.key === ClinicalFormConditionList.NONE_KEY || other.key === ClinicalFormConditionList.NONE_KEY;
        if (other.key !== item.key && exclusive && this.isTicked(other)) this.clear(other);
      }
    }
    control.setValue(checked ? value : null);
    control.markAsDirty();
    control.markAsTouched();
  }

  private clear(item: ConditionItem): void {
    const group = this.itemGroup(item);
    if (!group) return;
    for (const key of Object.keys(group.controls)) group.get(key)!.setValue(null);
    group.markAsDirty();
  }

  get isRequired(): boolean {
    this.model.version();
    return this.model.isRequired(this.basePath);
  }

  itemGroup(item: ConditionItem): FormGroup | null {
    return (this.model.control(this.section.key, this.field.key)?.get(item.key) as FormGroup) ?? null;
  }

  status(item: ConditionItem): FormControl {
    return this.itemGroup(item)?.get('status') as FormControl;
  }

  itemControl(item: ConditionItem, itemField: FieldDefinition): AbstractControl | null {
    return this.itemGroup(item)?.get(itemField.key) ?? null;
  }

  itemVisible(item: ConditionItem): boolean {
    this.model.version();
    return this.model.isVisible(`${this.basePath}.${item.key}`);
  }

  itemFieldVisible(item: ConditionItem, itemField: FieldDefinition): boolean {
    this.model.version();
    return this.model.isVisible(`${this.basePath}.${item.key}.${itemField.key}`);
  }

  statusErrors(item: ConditionItem): string[] {
    this.model.version();
    const control = this.status(item);
    if (!control || !control.invalid || !control.enabled || !(control.touched || control.dirty)) return [];
    return Object.entries(control.errors ?? {}).map(([key, detail]) => errorMessage(key, detail));
  }

  id(item: ConditionItem, suffix: string): string {
    return `cf-${this.basePath}-${item.key}-${suffix}`.replace(/[^A-Za-z0-9_-]/g, '-');
  }
}

const STATEMENT_LABEL_LENGTH = 40;
