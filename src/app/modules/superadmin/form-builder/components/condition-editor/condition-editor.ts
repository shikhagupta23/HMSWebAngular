import { Component, Input } from '@angular/core';
import {
  ConditionOperator,
  FieldDefinition,
  FieldOption,
  FormDefinition,
  VisibilityCondition,
} from '../../../../doctor/modules/clinical-forms/models/clinical-forms.models';
import { ConditionTarget, conditionTargets, describeCondition, operatorsFor, optionsOf } from '../../builder-utils';

/** Gender variants matched by a "patient is female/male" condition (records use different spellings). */
const GENDER_VALUES: Record<string, string[]> = {
  Female: ['Female', 'female', 'F'],
  Male: ['Male', 'male', 'M'],
};

/**
 * Edits one declarative condition (visibleWhen / requiredWhen) on a field: "when <answer> <operator>
 * <value>" or "when the patient's gender / age …". Only the closed operator set the server supports.
 */
@Component({
  selector: 'app-fb-condition-editor',
  standalone: false,
  templateUrl: './condition-editor.html',
})
export class ConditionEditor {
  @Input({ required: true }) owner!: FieldDefinition;
  @Input({ required: true }) prop!: 'visibleWhen' | 'requiredWhen';
  @Input({ required: true }) definition!: FormDefinition;
  @Input({ required: true }) sectionKey!: string;
  @Input() readOnly = false;
  @Input() title = 'Only show this field when…';

  readonly genders = Object.keys(GENDER_VALUES);

  get condition(): VisibilityCondition | undefined {
    return this.owner[this.prop];
  }

  get enabled(): boolean {
    return !!this.condition;
  }

  targets(): ConditionTarget[] {
    return conditionTargets(this.definition, this.sectionKey, this.owner.key);
  }

  target(): ConditionTarget | undefined {
    const c = this.condition;
    return c && c.source !== 'patient' ? this.targets().find((t) => t.ref === c.field) : undefined;
  }

  operators(): { op: ConditionOperator; label: string }[] {
    const c = this.condition;
    if (!c) return [];
    return operatorsFor(this.target()?.field, c.source === 'patient' ? 'patient' : 'answers', c.field);
  }

  valueOptions(): FieldOption[] | null {
    return optionsOf(this.target()?.field, this.definition);
  }

  summary(): string {
    return describeCondition(this.condition, this.definition, this.sectionKey);
  }

  toggle(on: boolean): void {
    if (!on) {
      delete this.owner[this.prop];
      return;
    }
    const first = this.targets()[0];
    this.owner[this.prop] = first ? { field: first.ref, op: 'notEmpty' } : { source: 'patient', field: 'gender', op: 'in', value: [...GENDER_VALUES['Female']] };
    this.resetOperator();
  }

  setSource(source: 'answers' | 'patient'): void {
    if (source === 'patient') this.owner[this.prop] = { source: 'patient', field: 'gender', op: 'in', value: [...GENDER_VALUES['Female']] };
    else {
      const first = this.targets()[0];
      this.owner[this.prop] = { field: first?.ref ?? '', op: 'notEmpty' };
      this.resetOperator();
    }
  }

  setField(ref: string): void {
    const c = this.condition!;
    c.field = ref;
    if (c.source === 'patient') {
      c.op = ref === 'ageYears' ? 'lt' : 'in';
      c.value = ref === 'ageYears' ? 18 : [...GENDER_VALUES['Female']];
      return;
    }
    this.resetOperator();
  }

  setOp(op: ConditionOperator): void {
    const c = this.condition!;
    c.op = op;
    this.resetValue();
  }

  // ---- values

  isMulti(): boolean {
    const op = this.condition?.op;
    return op === 'in' || op === 'any';
  }

  isNumeric(): boolean {
    const c = this.condition;
    return !!c && (c.source === 'patient' ? c.field === 'ageYears' : this.target()?.field.type === 'number');
  }

  scalarValue(): string {
    const v = this.condition?.value;
    return v === undefined || v === null ? '' : String(v);
  }

  setScalar(raw: string): void {
    const c = this.condition!;
    const type = this.target()?.field.type;
    if (type === 'boolean') c.value = raw === 'true';
    else if (this.isNumeric()) c.value = raw === '' ? undefined : Number(raw);
    else c.value = raw;
  }

  hasValue(value: string): boolean {
    return Array.isArray(this.condition?.value) && (this.condition!.value as string[]).includes(value);
  }

  toggleValue(value: string, on: boolean): void {
    const c = this.condition!;
    const list = Array.isArray(c.value) ? [...(c.value as string[])] : [];
    c.value = on ? [...new Set([...list, value])] : list.filter((v) => v !== value);
  }

  hasGender(name: string): boolean {
    return GENDER_VALUES[name].some((v) => this.hasValue(v));
  }

  toggleGender(name: string, on: boolean): void {
    for (const v of GENDER_VALUES[name]) this.toggleValue(v, on);
  }

  private resetOperator(): void {
    const ops = this.operators();
    const c = this.condition!;
    if (!ops.some((o) => o.op === c.op)) c.op = ops[0]?.op ?? 'notEmpty';
    this.resetValue();
  }

  private resetValue(): void {
    const c = this.condition!;
    if (c.op === 'notEmpty') {
      delete c.value;
      return;
    }
    const options = this.valueOptions();
    if (this.isMulti()) c.value = options?.length ? [options[0].value] : [];
    else if (this.target()?.field.type === 'boolean') c.value = true;
    else if (options?.length) c.value = options[0].value;
    else if (this.isNumeric()) c.value = 0;
    else c.value = '';
  }
}
