import { Component, Input } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { ClinicalFormModel, errorMessage } from '../../engine/clinical-form-model';
import { DEFAULT_MAX_ROWS } from '../../engine/clinical-form-engine';
import { FieldDefinition, SectionDefinition } from '../../models/clinical-forms.models';

/** Repeating rows of columns (e.g. medications, tooth findings, diagnoses). */
@Component({
  selector: 'app-clinical-form-repeater',
  standalone: false,
  templateUrl: './clinical-form-repeater.html',
})
export class ClinicalFormRepeater {
  @Input({ required: true }) model!: ClinicalFormModel;
  @Input({ required: true }) section!: SectionDefinition;
  @Input({ required: true }) field!: FieldDefinition;

  get basePath(): string {
    return `${this.section.key}.${this.field.key}`;
  }

  get rows(): FormArray<FormGroup> {
    return this.model.control(this.section.key, this.field.key) as FormArray<FormGroup>;
  }

  get editable(): boolean {
    this.model.version();
    return this.rows?.enabled ?? false;
  }

  get canAdd(): boolean {
    return this.editable && this.rows.length < (this.field.maxRows ?? DEFAULT_MAX_ROWS);
  }

  get isRequired(): boolean {
    this.model.version();
    return this.model.isRequired(this.basePath);
  }

  get errors(): string[] {
    this.model.version();
    const rows = this.rows;
    if (!rows || !rows.errors || !rows.enabled || !(rows.touched || rows.dirty)) return [];
    return Object.entries(rows.errors).map(([key, detail]) => errorMessage(key, detail));
  }

  add(): void {
    this.model.addRow(this.section.key, this.field);
  }

  remove(index: number): void {
    this.model.removeRow(this.section.key, this.field, index);
  }
}
