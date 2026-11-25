import {
  ConditionOperator,
  ConsentDefinition,
  FieldDefinition,
  FieldOption,
  FieldType,
  FormDefinition,
  SectionDefinition,
  VisibilityCondition,
} from '../../doctor/modules/clinical-forms/models/clinical-forms.models';

/**
 * Pure helpers for the SuperAdmin form builder. They keep the edited definition inside the rules the
 * server validator enforces (camelCase keys, one options source, type-specific properties), so most
 * forms are valid without the user ever seeing the JSON. The server still validates on every save.
 */

export interface FieldTypeInfo {
  type: FieldType;
  label: string;
  description: string;
  icon: string;
  /** Allowed inside tick/condition-list item fields and table columns. */
  nested: boolean;
}

export const FIELD_TYPES: FieldTypeInfo[] = [
  { type: 'text', label: 'Short text', description: 'One line of text, e.g. occupation', icon: 'fa-font', nested: true },
  { type: 'textarea', label: 'Long text', description: 'Several lines, e.g. notes or complaint', icon: 'fa-align-left', nested: true },
  { type: 'number', label: 'Number', description: 'A number with optional min / max', icon: 'fa-hashtag', nested: true },
  { type: 'date', label: 'Date', description: 'A calendar date', icon: 'fa-calendar', nested: true },
  { type: 'email', label: 'Email', description: 'An email address', icon: 'fa-at', nested: false },
  { type: 'phone', label: 'Phone', description: 'A phone number', icon: 'fa-phone', nested: false },
  { type: 'select', label: 'Dropdown', description: 'Pick one option from a list', icon: 'fa-square-caret-down', nested: true },
  { type: 'radio', label: 'Single choice', description: 'Pick one option, all shown as buttons', icon: 'fa-circle-dot', nested: false },
  { type: 'checkboxGroup', label: 'Tick boxes (multiple)', description: 'Tick any number of options', icon: 'fa-square-check', nested: false },
  { type: 'yesNoUnknown', label: 'Yes / No / Unknown', description: 'A single yes-no question', icon: 'fa-circle-question', nested: true },
  { type: 'boolean', label: 'Single tick box', description: 'One tick box, e.g. "Patient is fasting"', icon: 'fa-check', nested: true },
  { type: 'conditionList', label: 'Checklist with details', description: 'List of items (e.g. diseases) ticked or answered Yes/No, with details per item', icon: 'fa-list-check', nested: false },
  { type: 'repeater', label: 'Table (rows)', description: 'A table where rows can be added, e.g. medicines or treatment record', icon: 'fa-table', nested: false },
  { type: 'patientBinding', label: 'Patient detail', description: 'Shows a value from the patient record (name, age…)', icon: 'fa-id-card', nested: false },
  { type: 'consent', label: 'Consent', description: 'Shows a consent text the patient signs', icon: 'fa-file-signature', nested: false },
  { type: 'attachmentList', label: 'Images / files', description: 'Attach X-rays, photos or documents', icon: 'fa-paperclip', nested: false },
];

export const NESTED_FIELD_TYPES = FIELD_TYPES.filter((t) => t.nested);

export const OPTION_TYPES: ReadonlySet<FieldType> = new Set<FieldType>(['select', 'radio', 'checkboxGroup']);
export const TEXT_TYPES: ReadonlySet<FieldType> = new Set<FieldType>(['text', 'textarea', 'email', 'phone']);

export const EDITOR_ROLES = ['Receptionist', 'Doctor', 'Admin'];

export const PATIENT_BINDINGS: FieldOption[] = [
  { value: 'patient.fullName', label: 'Full name' },
  { value: 'patient.patientViewId', label: 'Patient ID' },
  { value: 'patient.gender', label: 'Gender' },
  { value: 'patient.dateOfBirth', label: 'Date of birth' },
  { value: 'patient.ageDisplay', label: 'Age' },
  { value: 'patient.phone', label: 'Mobile' },
  { value: 'patient.email', label: 'Email' },
  { value: 'patient.address', label: 'Address' },
];

export const ATTACHMENT_TYPES: FieldOption[] = [
  { value: 'Iopa', label: 'IOPA X-ray' },
  { value: 'Opg', label: 'OPG X-ray' },
  { value: 'Cbct', label: 'CBCT scan' },
  { value: 'ClinicalPhoto', label: 'Clinical photo' },
  { value: 'Other', label: 'Other document' },
];

/** Option sets provided by the platform (not stored in the definition). */
export const BUILT_IN_OPTION_SETS: Record<string, string> = {
  yesNoUnknown: 'Yes / No / Unknown (built-in)',
  fdiTeeth: 'Teeth, FDI numbering (built-in)',
};

/** Option set used for tick-box checklists: a single "yes" value; unticked items are simply not answered. */
export const TICKED_SET = 'ticked';

export function typeInfo(type: string): FieldTypeInfo | undefined {
  return FIELD_TYPES.find((t) => t.type === type);
}

// ------------------------------------------------------------------ keys

/** "Chief complaint (main)" -> "chiefComplaintMain". Always a valid camelCase key. */
export function toKey(text: string, fallback = 'field'): string {
  const words = (text ?? '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let key = words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join('');
  if (!key || !/^[a-z]/.test(key)) key = fallback + (key ? key[0].toUpperCase() + key.slice(1) : '');
  return key.slice(0, 64);
}

/** "General Dental Treatment" -> "general-dental-treatment" (form keys, consent types). */
export function toKebab(text: string, fallback = 'form'): string {
  const key = (text ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (key || fallback).slice(0, 100);
}

export function uniqueKey(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base.slice(0, 60)}${i}`;
    if (!used.has(candidate)) return candidate;
  }
}

export const KEY_PATTERN = /^[a-z][a-zA-Z0-9]{0,63}$/;
export const KEBAB_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ------------------------------------------------------------------ factories

export function newSection(title: string, existing: SectionDefinition[]): SectionDefinition {
  return {
    key: uniqueKey(toKey(title, 'section'), existing.map((s) => s.key)),
    title,
    editableBy: ['Receptionist', 'Doctor'],
    clinical: false,
    fields: [],
  };
}

export function newField(type: FieldType, siblings: FieldDefinition[], definition: FormDefinition, nested = false): FieldDefinition {
  const info = typeInfo(type);
  const label = info?.label ?? 'New field';
  const field: FieldDefinition = { key: uniqueKey(toKey(label), siblings.map((f) => f.key)), type, label };
  applyTypeDefaults(field, definition, nested);
  return field;
}

/** Fills the properties a type needs so a new field is valid immediately. */
export function applyTypeDefaults(field: FieldDefinition, definition: FormDefinition, nested = false): void {
  switch (field.type) {
    case 'text':
      field.validation = { maxLength: 200 };
      break;
    case 'textarea':
      field.validation = { maxLength: 2000 };
      break;
    case 'select':
    case 'radio':
    case 'checkboxGroup':
      if (!field.options?.length && !field.optionSet && !field.optionsFrom)
        field.options = [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }];
      break;
    case 'conditionList':
      field.items = [{ key: 'item1', label: 'Item 1' }];
      field.itemOptionSet = TICKED_SET;
      ensureTickedOptionSet(definition);
      field.itemFields = [];
      break;
    case 'repeater':
      field.columns = [{ key: 'name', type: 'text', label: 'Name', required: true, validation: { maxLength: 200 } }];
      field.maxRows = 20;
      break;
    case 'patientBinding':
      field.binding = 'patient.fullName';
      field.mode = 'readOnly';
      if (!field.label || field.label === typeInfo('patientBinding')?.label) field.label = 'Name';
      break;
    case 'consent': {
      const consent = definition.consents?.[0] ?? addConsent(definition);
      field.consentType = consent.consentType;
      field.required = true;
      break;
    }
    case 'attachmentList':
      field.allowedTypes = ['ClinicalPhoto', 'Other'];
      break;
  }
  if (nested) delete field.locked;
}

/**
 * Changes a field's type, dropping properties the new type does not accept (the validator rejects them)
 * and adding what it needs. Label, key, help text and the required flag are kept where allowed.
 */
export function changeFieldType(field: FieldDefinition, type: FieldType, definition: FormDefinition, nested = false): void {
  const keep: FieldDefinition = {
    key: field.key,
    type,
    label: field.label,
    required: field.required,
    helpText: field.helpText,
    placeholder: field.placeholder,
    alert: field.alert,
    sensitive: field.sensitive,
    locked: field.locked,
    visibleWhen: field.visibleWhen,
    requiredWhen: field.requiredWhen,
  };
  if (OPTION_TYPES.has(type) && OPTION_TYPES.has(field.type)) {
    keep.options = field.options;
    keep.optionSet = field.optionSet;
    keep.optionsFrom = field.optionsFrom;
    if (type === 'checkboxGroup') keep.exclusiveOption = field.exclusiveOption;
  }
  if (TEXT_TYPES.has(type) && TEXT_TYPES.has(field.type) && field.validation) {
    keep.validation = { minLength: field.validation.minLength, maxLength: field.validation.maxLength, pattern: field.validation.pattern };
  }
  for (const k of Object.keys(field) as (keyof FieldDefinition)[]) delete field[k];
  Object.assign(field, keep);
  const carriedOptions = OPTION_TYPES.has(type) && (!!field.options?.length || !!field.optionSet || !!field.optionsFrom);
  const carriedTextRules = TEXT_TYPES.has(type) && !!field.validation;
  if (!carriedOptions && !carriedTextRules) applyTypeDefaults(field, definition, nested);
  if (type === 'patientBinding') delete field.required;
}

export function ensureTickedOptionSet(definition: FormDefinition): void {
  definition.optionSets ??= {};
  if (!definition.optionSets[TICKED_SET]) definition.optionSets[TICKED_SET] = [{ value: 'yes', label: 'Yes' }];
}

export function addConsent(definition: FormDefinition): ConsentDefinition {
  definition.consents ??= [];
  const consent: ConsentDefinition = {
    consentType: uniqueKey('general-consent', definition.consents.map((c) => c.consentType)),
    consentVersion: '1.0',
    text: 'I consent to examination and treatment as explained to me.',
    required: true,
    allowGuardian: true,
    requireSignature: true,
    witnessOptional: true,
  };
  definition.consents.push(consent);
  return consent;
}

export function newOption(existing: FieldOption[], label = `Option ${existing.length + 1}`): FieldOption {
  return { value: uniqueKey(toKey(label, 'option'), existing.map((o) => o.value)), label };
}

// ------------------------------------------------------------------ list helpers

export function move<T>(list: T[], index: number, delta: number): void {
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ------------------------------------------------------------------ save

/**
 * The definition as it will be saved: orders follow the on-screen order and empty optional values
 * (blank strings, empty rule objects) are removed so they are not reported as invalid.
 */
export function prepareForSave(definition: FormDefinition): FormDefinition {
  const copy = deepClone(definition);
  copy.sections.forEach((section, i) => {
    section.order = i + 1;
    section.fields.forEach((field, j) => {
      field.order = j + 1;
      cleanField(field);
    });
  });
  if (copy.optionSets && Object.keys(copy.optionSets).length === 0) delete copy.optionSets;
  return prune(copy) as FormDefinition;
}

function cleanField(field: FieldDefinition): void {
  field.itemFields?.forEach(cleanField);
  field.columns?.forEach(cleanField);
  for (const key of ['options', 'itemFields', 'allowedTypes'] as const) {
    const value = field[key];
    if (Array.isArray(value) && value.length === 0 && key !== 'options') delete field[key];
  }
  if (field.optionSet || field.optionsFrom) delete field.options;
}

/** Removes undefined/null/'' and empty objects, recursively; keeps false, 0 and arrays. */
function prune(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(prune);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = prune(v);
      if (cleaned === undefined || cleaned === null || cleaned === '') continue;
      if (typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned as object).length === 0 && k !== 'optionSets') continue;
      out[k] = cleaned;
    }
    return out;
  }
  return value;
}

// ------------------------------------------------------------------ conditions

export interface ConditionTarget {
  /** Reference stored in the condition: "fieldKey" (same section) or "sectionKey.fieldKey". */
  ref: string;
  label: string;
  field: FieldDefinition;
}

/** Fields a condition in `sectionKey` may depend on (any other top-level answer field of the form). */
export function conditionTargets(definition: FormDefinition, sectionKey: string, excludeFieldKey?: string): ConditionTarget[] {
  const targets: ConditionTarget[] = [];
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (['repeater', 'conditionList', 'patientBinding', 'consent', 'attachmentList'].includes(field.type)) continue;
      if (section.key === sectionKey && field.key === excludeFieldKey) continue;
      const same = section.key === sectionKey;
      targets.push({ ref: same ? field.key : `${section.key}.${field.key}`, label: same ? field.label : `${section.title} › ${field.label}`, field });
    }
  }
  return targets;
}

export function operatorsFor(field: FieldDefinition | undefined, source: 'answers' | 'patient', patientField?: string): { op: ConditionOperator; label: string }[] {
  if (source === 'patient')
    return patientField === 'ageYears'
      ? [{ op: 'lt', label: 'is less than' }, { op: 'gt', label: 'is more than' }]
      : [{ op: 'in', label: 'is one of' }];
  if (!field) return [];
  if (field.type === 'checkboxGroup') return [{ op: 'any', label: 'has any of these ticked' }, { op: 'notEmpty', label: 'has anything ticked' }];
  if (field.type === 'number')
    return [{ op: 'eq', label: 'equals' }, { op: 'neq', label: 'does not equal' }, { op: 'lt', label: 'is less than' }, { op: 'gt', label: 'is more than' }, { op: 'notEmpty', label: 'is filled in' }];
  if (field.type === 'boolean') return [{ op: 'eq', label: 'is' }];
  const ops: { op: ConditionOperator; label: string }[] = [{ op: 'eq', label: 'is' }, { op: 'neq', label: 'is not' }];
  if (OPTION_TYPES.has(field.type) || field.type === 'yesNoUnknown') ops.push({ op: 'in', label: 'is one of' });
  ops.push({ op: 'notEmpty', label: 'is filled in' });
  return ops;
}

/** Options a condition value can be chosen from, when the referenced field has a fixed list. */
export function optionsOf(field: FieldDefinition | undefined, definition: FormDefinition): FieldOption[] | null {
  if (!field) return null;
  if (field.type === 'yesNoUnknown') return [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Unknown' }];
  if (field.type === 'boolean') return [{ value: 'true', label: 'Ticked' }, { value: 'false', label: 'Not ticked' }];
  if (field.options?.length) return field.options;
  if (field.optionSet && definition.optionSets?.[field.optionSet]) return definition.optionSets[field.optionSet];
  return null;
}

export function describeCondition(condition: VisibilityCondition | undefined, definition: FormDefinition, sectionKey: string): string {
  if (!condition) return '';
  if (condition.source === 'patient') {
    const values = Array.isArray(condition.value) ? (condition.value as unknown[]).join(', ') : String(condition.value ?? '');
    return `patient ${condition.field} ${condition.op === 'in' ? 'is one of' : condition.op === 'lt' ? '<' : '>'} ${values}`;
  }
  if (condition.field.startsWith('@item.')) return 'the item is ticked / answered Yes';
  const target = conditionTargets(definition, sectionKey).find((t) => t.ref === condition.field);
  const op = operatorsFor(target?.field, 'answers').find((o) => o.op === condition.op)?.label ?? condition.op;
  const options = optionsOf(target?.field, definition);
  const label = (v: unknown) => options?.find((o) => o.value === String(v))?.label ?? String(v);
  const value = condition.op === 'notEmpty' ? '' : Array.isArray(condition.value) ? (condition.value as unknown[]).map(label).join(', ') : label(condition.value);
  return `"${target?.label ?? condition.field}" ${op} ${value}`.trim();
}

// ------------------------------------------------------------------ issues

export interface IssueLocation {
  sectionIndex?: number;
  fieldIndex?: number;
  area: 'structure' | 'consents' | 'optionSets' | 'form';
  text: string;
}

/** Turns a validator path like "$.sections[2].fields[0].options" into a readable place in the builder. */
export function locateIssue(path: string, definition: FormDefinition | null): IssueLocation {
  const section = /sections\[(\d+)\]/.exec(path);
  const field = /sections\[\d+\]\.fields\[(\d+)\]/.exec(path);
  if (section && definition) {
    const sectionIndex = +section[1];
    const s = definition.sections[sectionIndex];
    const fieldIndex = field ? +field[1] : undefined;
    const f = fieldIndex !== undefined ? s?.fields[fieldIndex] : undefined;
    const text = [s ? `Section "${s.title || s.key}"` : `Section ${sectionIndex + 1}`, f ? `field "${f.label || f.key}"` : fieldIndex !== undefined ? `field ${fieldIndex + 1}` : '']
      .filter(Boolean)
      .join(' › ');
    return { sectionIndex, fieldIndex, area: 'structure', text };
  }
  if (path.includes('consents')) return { area: 'consents', text: 'Consents' };
  if (path.includes('optionSets')) return { area: 'optionSets', text: 'Shared option lists' };
  return { area: 'form', text: 'Form' };
}
