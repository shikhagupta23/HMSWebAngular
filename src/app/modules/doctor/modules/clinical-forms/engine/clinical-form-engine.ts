import {
  ConditionItem,
  FieldDefinition,
  FieldOption,
  FormAnswers,
  FormDefinition,
  PatientFormContext,
  SectionDefinition,
  VisibilityCondition,
} from '../models/clinical-forms.models';

/**
 * Pure, framework-free form-definition logic. It mirrors the backend rules (ClinicalFormAnswersValidator)
 * so the UI behaves like the server; the server remains the authority and re-validates everything.
 */

// ------------------------------------------------------------------ option sets

const YES_NO_UNKNOWN: FieldOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown' },
];

/** FDI two-digit notation: permanent 11–18…41–48, primary 51–55…81–85 (52 teeth). */
function buildFdiTeeth(): FieldOption[] {
  const teeth: FieldOption[] = [];
  for (let quadrant = 1; quadrant <= 4; quadrant++)
    for (let tooth = 1; tooth <= 8; tooth++) teeth.push({ value: `${quadrant}${tooth}`, label: `${quadrant}${tooth}` });
  for (let quadrant = 5; quadrant <= 8; quadrant++)
    for (let tooth = 1; tooth <= 5; tooth++) teeth.push({ value: `${quadrant}${tooth}`, label: `${quadrant}${tooth}` });
  return teeth;
}

export const BUILT_IN_OPTION_SETS: Readonly<Record<string, FieldOption[]>> = {
  yesNoUnknown: YES_NO_UNKNOWN,
  fdiTeeth: buildFdiTeeth(),
};

export const DEFAULT_TEXT_MAX_LENGTH = 1000;
export const DEFAULT_TEXTAREA_MAX_LENGTH = 10000;
export const DEFAULT_MAX_ROWS = 50;
export const PHONE_PATTERN = /^[0-9+()\-\s]{5,20}$/;

export const OPTION_FIELD_TYPES = new Set(['select', 'radio', 'checkboxGroup']);
export const TEXT_FIELD_TYPES = new Set(['text', 'textarea', 'email', 'phone']);
/** Types whose value never comes from the form itself. */
export const NON_ANSWER_TYPES = new Set(['patientBinding', 'consent']);

function optionSet(definition: FormDefinition, name: string): FieldOption[] {
  return definition.optionSets?.[name] ?? BUILT_IN_OPTION_SETS[name] ?? [];
}

/** Options of an option field: inline, a named set (definition or built-in), or a sibling field (optionsFrom). */
export function resolveOptions(definition: FormDefinition, section: SectionDefinition, field: FieldDefinition): FieldOption[] {
  if (field.optionsFrom) {
    const source = section.fields.find((f) => f.key === field.optionsFrom);
    return source && !source.optionsFrom ? resolveOptions(definition, section, source) : [];
  }
  if (field.options) return field.options;
  if (field.optionSet) return optionSet(definition, field.optionSet);
  if (field.type === 'yesNoUnknown') return YES_NO_UNKNOWN;
  return [];
}

/** Status options of each conditionList item (defaults to yes/no/unknown). */
export function itemStatusOptions(definition: FormDefinition, field: FieldDefinition): FieldOption[] {
  return optionSet(definition, field.itemOptionSet ?? 'yesNoUnknown');
}

// ------------------------------------------------------------------ conditions

export interface ConditionContext {
  definition: FormDefinition;
  section: SectionDefinition;
  answers: FormAnswers;
  patient?: PatientFormContext | null;
  /** The conditionList item answer when evaluating item fields ('@item.x'). */
  item?: Record<string, unknown> | null;
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function scalarEquals(actual: unknown, expected: unknown): boolean {
  if (actual === null || actual === undefined) return false;
  if (typeof expected === 'number') return typeof actual === 'number' ? actual === expected : Number(actual) === expected && actual !== '';
  if (typeof expected === 'boolean') return actual === expected;
  return typeof actual === 'string' && actual === expected;
}

function targetValue(condition: VisibilityCondition, ctx: ConditionContext): unknown {
  if (condition.source === 'patient') {
    if (condition.field === 'gender') return ctx.patient?.gender ?? undefined;
    if (condition.field === 'ageYears') return ctx.patient?.ageYears ?? undefined;
    return undefined;
  }
  if (condition.field.startsWith('@item.')) return ctx.item?.[condition.field.substring('@item.'.length)];
  const parts = condition.field.split('.');
  const sectionKey = parts.length === 2 ? parts[0] : ctx.section.key;
  return ctx.answers[sectionKey]?.[parts[parts.length - 1]];
}

/** Evaluates the closed set of declarative operators. Missing values never satisfy positive comparisons. */
export function evaluateCondition(condition: VisibilityCondition, ctx: ConditionContext): boolean {
  const actual = targetValue(condition, ctx);
  const expected = condition.value;
  switch (condition.op) {
    case 'notEmpty':
      return !isEmpty(actual);
    case 'eq':
      return expected !== undefined && scalarEquals(actual, expected);
    case 'neq':
      return expected === undefined || !scalarEquals(actual, expected);
    case 'in':
      return Array.isArray(expected) && expected.some((v) => scalarEquals(actual, v));
    case 'any':
      return Array.isArray(expected) && Array.isArray(actual) && actual.some((a) => expected.some((v) => scalarEquals(a, v)));
    case 'lt':
    case 'gt': {
      if (typeof expected !== 'number' || actual === null || actual === undefined || actual === '') return false;
      const n = Number(actual);
      if (Number.isNaN(n)) return false;
      return condition.op === 'lt' ? n < expected : n > expected;
    }
    default:
      return false;
  }
}

export function isVisible(condition: VisibilityCondition | undefined, ctx: ConditionContext): boolean {
  return !condition || evaluateCondition(condition, ctx);
}

export function isItemVisible(item: ConditionItem, ctx: ConditionContext): boolean {
  return isVisible(item.visibleWhen, ctx);
}

/** Required now: always-required, or conditionally required by requiredWhen. Patient-bound values are never required. */
export function isRequired(field: FieldDefinition, ctx: ConditionContext): boolean {
  if (NON_ANSWER_TYPES.has(field.type) && field.type !== 'consent') return false;
  return !!field.required || (!!field.requiredWhen && evaluateCondition(field.requiredWhen, ctx));
}

// ------------------------------------------------------------------ answers

/**
 * Converts a raw control value to the answer shape the API expects, or undefined when empty
 * (empty answers are omitted rather than sent as null/"").
 */
export function cleanValue(field: FieldDefinition, raw: unknown): unknown {
  switch (field.type) {
    case 'patientBinding':
    case 'consent':
      return undefined;
    case 'number': {
      if (raw === null || raw === undefined || raw === '') return undefined;
      const n = typeof raw === 'number' ? raw : Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    case 'boolean':
      return typeof raw === 'boolean' ? raw : undefined;
    case 'checkboxGroup':
    case 'attachmentList':
      return Array.isArray(raw) && raw.length > 0 ? [...raw] : undefined;
    case 'conditionList':
      return cleanConditionList(field, raw);
    case 'repeater':
      return cleanRepeater(field, raw);
    default:
      if (typeof raw === 'string') return raw.trim().length === 0 ? undefined : raw;
      return raw === null || raw === undefined ? undefined : raw;
  }
}

function cleanObject(fields: FieldDefinition[], raw: Record<string, unknown>, extraKeys: string[] = []): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  for (const key of extraKeys) {
    const value = raw[key];
    if (!isEmpty(value)) result[key] = value;
  }
  for (const field of fields) {
    const value = cleanValue(field, raw[field.key]);
    if (value !== undefined) result[field.key] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function cleanConditionList(field: FieldDefinition, raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, Record<string, unknown> | undefined>;
  const result: Record<string, unknown> = {};
  for (const item of field.items ?? []) {
    const itemValue = source[item.key];
    if (!itemValue) continue;
    const cleaned = cleanObject(field.itemFields ?? [], itemValue, ['status']);
    if (cleaned) result[item.key] = cleaned;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function cleanRepeater(field: FieldDefinition, raw: unknown): unknown {
  if (!Array.isArray(raw)) return undefined;
  const rows = raw
    .map((row) => (row && typeof row === 'object' ? cleanObject(field.columns ?? [], row as Record<string, unknown>) : undefined))
    .filter((row): row is Record<string, unknown> => row !== undefined);
  return rows.length > 0 ? rows : undefined;
}

/** Human-readable age from an ISO date of birth, matching the backend's year-based age. */
export function ageInYears(dateOfBirth: string | null | undefined, today = new Date()): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob.getFullYear() < 1900) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday = today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthday) age--;
  return age >= 0 ? age : null;
}

/** Sections and fields in presentation order (stable for equal order values). */
export function orderedSections(definition: FormDefinition): SectionDefinition[] {
  return [...definition.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function orderedFields(section: SectionDefinition): FieldDefinition[] {
  return [...section.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
