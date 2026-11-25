import { Component, Input } from '@angular/core';
import {
  FieldDefinition,
  FieldOption,
  FieldType,
  FormDefinition,
} from '../../../../doctor/modules/clinical-forms/models/clinical-forms.models';
import {
  ATTACHMENT_TYPES,
  BUILT_IN_OPTION_SETS,
  FIELD_TYPES,
  KEY_PATTERN,
  NESTED_FIELD_TYPES,
  OPTION_TYPES,
  PATIENT_BINDINGS,
  TEXT_TYPES,
  TICKED_SET,
  changeFieldType,
  ensureTickedOptionSet,
  move,
  newField,
  toKey,
  typeInfo,
  uniqueKey,
} from '../../builder-utils';

type OptionSource = 'own' | 'shared' | 'from';

let nextId = 0;

/**
 * Settings of one field. Used for top-level fields and, recursively, for table columns and checklist
 * item fields (nested = true), where only simple types and no conditions are allowed.
 */
@Component({
  selector: 'app-fb-field-editor',
  standalone: false,
  templateUrl: './field-editor.html',
})
export class FieldEditor {
  @Input({ required: true }) field!: FieldDefinition;
  /** Fields at the same level (keys must be unique among them). */
  @Input({ required: true }) siblings!: FieldDefinition[];
  @Input({ required: true }) definition!: FormDefinition;
  @Input({ required: true }) sectionKey!: string;
  @Input() nested = false;
  /** Inside a checklist: item fields can be shown only for ticked / "yes" items. */
  @Input() itemField = false;
  /** Inside a table: option fields of the section a column may copy its options from. */
  @Input() optionsFromCandidates: FieldDefinition[] = [];
  @Input() readOnly = false;
  /** The same field in the latest published version, if any: its key and option values are fixed. */
  @Input() published: FieldDefinition | undefined;

  readonly patientBindings = PATIENT_BINDINGS;
  readonly attachmentTypes = ATTACHMENT_TYPES;
  readonly textTypes = TEXT_TYPES;
  readonly tickedSet = TICKED_SET;

  /** Unique prefix for element ids (keys can repeat across sections). */
  readonly uid = `fb-f${++nextId}`;

  /** Nested rows currently expanded. */
  readonly expanded = new Set<FieldDefinition>();
  private manualKey = false;

  get types() {
    return this.nested ? NESTED_FIELD_TYPES : FIELD_TYPES;
  }

  info(type = this.field.type) {
    return typeInfo(type);
  }

  isOptionType(): boolean {
    return OPTION_TYPES.has(this.field.type);
  }

  keyFixed(): boolean {
    return !!this.published;
  }

  keyError(): string | null {
    if (!KEY_PATTERN.test(this.field.key)) return 'Use letters and digits only, starting with a lower-case letter.';
    if (this.siblings.some((f) => f !== this.field && f.key === this.field.key)) return 'Another field here already uses this key.';
    return null;
  }

  fixedOptionValues(): Set<string> {
    return new Set((this.published?.options ?? []).map((o) => o.value));
  }

  fixedItemKeys(): Set<string> {
    return new Set((this.published?.items ?? []).map((i) => i.key));
  }

  // ---- basics

  setLabel(label: string): void {
    this.field.label = label;
    if (this.keyFixed() || this.manualKey) return;
    this.field.key = uniqueKey(toKey(label), this.siblings.filter((f) => f !== this.field).map((f) => f.key));
  }

  setKey(key: string): void {
    this.manualKey = true;
    this.field.key = key.trim();
  }

  setType(type: FieldType): void {
    if (type === this.field.type) return;
    changeFieldType(this.field, type, this.definition, this.nested);
  }

  setRequired(on: boolean): void {
    this.field.required = on || undefined;
    if (on) delete this.field.requiredWhen;
  }

  setFlag(flag: 'alert' | 'sensitive' | 'locked', on: boolean): void {
    if (on) this.field[flag] = true;
    else delete this.field[flag];
  }

  setText(prop: 'helpText' | 'placeholder', value: string): void {
    if (value.trim()) this.field[prop] = value;
    else delete this.field[prop];
  }

  // ---- options

  optionSource(): OptionSource {
    if (this.field.optionsFrom) return 'from';
    if (this.field.optionSet) return 'shared';
    return 'own';
  }

  setOptionSource(source: OptionSource): void {
    delete this.field.options;
    delete this.field.optionSet;
    delete this.field.optionsFrom;
    delete this.field.exclusiveOption;
    if (source === 'own') this.field.options = [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }];
    if (source === 'shared') this.field.optionSet = this.sharedSets()[0]?.name ?? 'yesNoUnknown';
    if (source === 'from') this.field.optionsFrom = this.optionsFromCandidates[0]?.key ?? '';
  }

  sharedSets(): { name: string; label: string }[] {
    const own = Object.keys(this.definition.optionSets ?? {})
      .filter((n) => n !== TICKED_SET)
      .map((name) => ({ name, label: name }));
    return [...own, ...Object.entries(BUILT_IN_OPTION_SETS).map(([name, label]) => ({ name, label }))];
  }

  currentOptions(): FieldOption[] {
    if (this.field.options) return this.field.options;
    if (this.field.optionSet) return this.definition.optionSets?.[this.field.optionSet] ?? [];
    return [];
  }

  setExclusive(value: string): void {
    if (value) this.field.exclusiveOption = value;
    else delete this.field.exclusiveOption;
  }

  // ---- validation rules

  rule(name: 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'minDate' | 'maxDate'): string {
    const v = this.field.validation?.[name];
    return v === undefined || v === null ? '' : String(v);
  }

  setRule(name: 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'minDate' | 'maxDate', raw: string): void {
    this.field.validation ??= {};
    const rules = this.field.validation as Record<string, unknown>;
    if (raw === '' || raw === null) delete rules[name];
    else rules[name] = ['pattern', 'minDate', 'maxDate'].includes(name) ? raw : Number(raw);
    if (Object.keys(rules).length === 0) delete this.field.validation;
  }

  dateMode(name: 'minDate' | 'maxDate'): 'none' | 'today' | 'date' {
    const v = this.field.validation?.[name];
    return !v ? 'none' : v === 'today' ? 'today' : 'date';
  }

  setDateMode(name: 'minDate' | 'maxDate', mode: string): void {
    this.setRule(name, mode === 'none' ? '' : mode === 'today' ? 'today' : new Date().toISOString().slice(0, 10));
  }

  // ---- checklist (conditionList)

  answerStyle(): 'tick' | 'yesNo' | 'shared' {
    if (this.field.itemOptionSet === TICKED_SET) return 'tick';
    if (!this.field.itemOptionSet || this.field.itemOptionSet === 'yesNoUnknown') return 'yesNo';
    return 'shared';
  }

  setAnswerStyle(style: string): void {
    if (style === 'tick') {
      ensureTickedOptionSet(this.definition);
      this.field.itemOptionSet = TICKED_SET;
    } else if (style === 'yesNo') delete this.field.itemOptionSet;
    else this.field.itemOptionSet = this.sharedSets().find((s) => !(s.name in BUILT_IN_OPTION_SETS))?.name ?? 'yesNoUnknown';
  }

  /** Item fields shown only for ticked / "yes" items. */
  onlyWhenTicked(f: FieldDefinition): boolean {
    return f.visibleWhen?.field === '@item.status';
  }

  setOnlyWhenTicked(f: FieldDefinition, on: boolean): void {
    if (on) f.visibleWhen = { field: '@item.status', op: 'eq', value: 'yes' };
    else delete f.visibleWhen;
  }

  // ---- nested lists (item fields, table columns)

  addNested(list: FieldDefinition[], type: FieldType): void {
    const created = newField(type, list, this.definition, true);
    if (list === this.field.itemFields) this.setOnlyWhenTicked(created, true);
    list.push(created);
    this.expanded.add(created);
  }

  removeNested(list: FieldDefinition[], index: number): void {
    list.splice(index, 1);
  }

  moveNested(list: FieldDefinition[], index: number, delta: number): void {
    move(list, index, delta);
  }

  toggleNested(f: FieldDefinition): void {
    if (this.expanded.has(f)) this.expanded.delete(f);
    else this.expanded.add(f);
  }

  publishedNested(kind: 'itemFields' | 'columns', key: string): FieldDefinition | undefined {
    return this.published?.[kind]?.find((f) => f.key === key);
  }

  itemFieldsList(): FieldDefinition[] {
    return (this.field.itemFields ??= []);
  }

  // ---- attachments

  hasAttachmentType(type: string): boolean {
    return !!this.field.allowedTypes?.includes(type);
  }

  toggleAttachmentType(type: string, on: boolean): void {
    const list = new Set(this.field.allowedTypes ?? []);
    if (on) list.add(type);
    else list.delete(type);
    this.field.allowedTypes = [...list];
  }

  setNumber(prop: 'maxRows', raw: string): void {
    if (raw === '') delete this.field[prop];
    else this.field[prop] = Number(raw);
  }
}
