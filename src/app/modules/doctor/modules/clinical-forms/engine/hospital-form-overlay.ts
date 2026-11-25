import { FieldDefinition, FieldOption, FormDefinition, HospitalFormOverlay, SectionDefinition, VisibilityCondition } from '../models/clinical-forms.models';
import { resolveOptions } from './clinical-form-engine';

/**
 * Pure helpers for the hospital overlay editor. They mirror the server's HospitalFormConfigurationValidator
 * rules so the UI only offers changes the server accepts; the server still validates every save.
 */

export const OVERLAY_SCHEMA_VERSION = 1;
export const MAX_LABEL_LENGTH = 200;
export const MAX_CONSENT_TEXT_LENGTH = 20000;
export const MAX_CONSENT_VERSION_LENGTH = 50;

const OPTION_TYPES = new Set(['select', 'radio', 'checkboxGroup']);

/** Parses a stored overlay; an empty value means "no hospital changes". Throws on invalid JSON. */
export function parseOverlay(json: string | null | undefined): HospitalFormOverlay {
  if (!json || !json.trim()) return { schemaVersion: OVERLAY_SCHEMA_VERSION, sections: {}, fields: {}, consents: [] };
  const parsed = JSON.parse(json) as HospitalFormOverlay;
  return {
    ...parsed,
    schemaVersion: parsed.schemaVersion ?? OVERLAY_SCHEMA_VERSION,
    sections: { ...(parsed.sections ?? {}) },
    fields: { ...(parsed.fields ?? {}) },
    consents: [...(parsed.consents ?? [])],
  };
}

/**
 * Serializes the overlay, dropping empty entries. Returns null when nothing is customized (the server
 * treats null as "clear the overlay"). Unknown keys from the stored overlay are kept as they were.
 */
export function serializeOverlay(overlay: HospitalFormOverlay): string | null {
  const sections: NonNullable<HospitalFormOverlay['sections']> = {};
  for (const [key, value] of Object.entries(overlay.sections ?? {})) {
    const entry: { enabled?: boolean; title?: string } = {};
    if (value?.enabled === false) entry.enabled = false;
    if (value?.title !== null && value?.title !== undefined && value.title !== '') entry.title = value.title;
    if (Object.keys(entry).length > 0) sections[key] = entry;
  }

  const fields: NonNullable<HospitalFormOverlay['fields']> = {};
  for (const [key, value] of Object.entries(overlay.fields ?? {})) {
    const entry: { label?: string; hidden?: boolean; required?: boolean; hiddenOptions?: string[] } = {};
    if (value?.label !== null && value?.label !== undefined && value.label !== '') entry.label = value.label;
    if (value?.hidden === true) entry.hidden = true;
    if (value?.required === true) entry.required = true;
    if (value?.hiddenOptions && value.hiddenOptions.length > 0) entry.hiddenOptions = [...value.hiddenOptions];
    if (Object.keys(entry).length > 0) fields[key] = entry;
  }

  const consents = (overlay.consents ?? []).filter((c) => !!c && !!c.consentType);

  if (Object.keys(sections).length === 0 && Object.keys(fields).length === 0 && consents.length === 0) return null;

  const result: HospitalFormOverlay = { schemaVersion: overlay.schemaVersion ?? OVERLAY_SCHEMA_VERSION };
  if (overlay.appliesToTemplateVersion !== null && overlay.appliesToTemplateVersion !== undefined)
    result.appliesToTemplateVersion = overlay.appliesToTemplateVersion;
  if (Object.keys(sections).length > 0) result.sections = sections;
  if (Object.keys(fields).length > 0) result.fields = fields;
  if (consents.length > 0) result.consents = consents.map((c) => ({ consentType: c.consentType, consentVersion: c.consentVersion, text: c.text }));
  return JSON.stringify(result);
}

// ------------------------------------------------------------------ capabilities (server rules)

/** Why a section cannot be turned off, or null when it can. */
export function sectionDisableBlocker(section: SectionDefinition): string | null {
  if (section.required) return 'This section is required by the form.';
  const protectedField = section.fields.find((f) => f.required || f.locked || !!f.requiredWhen);
  return protectedField ? `Contains the mandatory or locked field “${protectedField.label}”.` : null;
}

/** Qualified keys ("section.field") of top-level fields used by any condition (cannot be hidden). */
export function conditionReferences(definition: FormDefinition): Set<string> {
  const references = new Set<string>();
  for (const section of definition.sections) {
    for (const field of section.fields) {
      const conditions: (VisibilityCondition | undefined)[] = [field.visibleWhen, field.requiredWhen, ...(field.items ?? []).map((i) => i.visibleWhen)];
      for (const condition of conditions) {
        if (!condition || (condition.source && condition.source !== 'answers') || condition.field.startsWith('@item.')) continue;
        references.add(condition.field.includes('.') ? condition.field : `${section.key}.${condition.field}`);
      }
    }
  }
  return references;
}

export interface FieldCapabilities {
  locked: boolean;
  canRelabel: boolean;
  /** Reason hiding is not allowed, or null. */
  hideBlocker: string | null;
  /** Reason "make mandatory" is not allowed, or null (also null when already mandatory). */
  requireBlocker: string | null;
  alreadyRequired: boolean;
  /** Options (or condition-list items) that may be hidden; empty when not supported. */
  hideableOptions: FieldOption[];
}

export function fieldCapabilities(definition: FormDefinition, section: SectionDefinition, field: FieldDefinition, references: Set<string>): FieldCapabilities {
  const locked = !!field.locked;
  const key = `${section.key}.${field.key}`;
  let hideBlocker: string | null = null;
  if (locked) hideBlocker = 'Locked by the form.';
  else if (field.required || field.requiredWhen) hideBlocker = 'Mandatory fields cannot be hidden.';
  else if (references.has(key)) hideBlocker = 'Other questions depend on this field.';

  let requireBlocker: string | null = null;
  if (field.type === 'patientBinding') requireBlocker = 'Comes from the patient record.';
  else if (field.requiredWhen) requireBlocker = 'Already required under certain conditions.';

  let hideableOptions: FieldOption[] = [];
  if (!locked) {
    if (field.type === 'conditionList') hideableOptions = (field.items ?? []).map((i) => ({ value: i.key, label: i.label }));
    else if (OPTION_TYPES.has(field.type) && !field.optionsFrom) hideableOptions = resolveOptions(definition, section, field);
  }

  return { locked, canRelabel: !locked, hideBlocker, requireBlocker, alreadyRequired: !!field.required, hideableOptions };
}

/** Maps a server validation path ("$.fields.s.f.hidden", "$.consents[0].text", ...) to an editor key. */
export function overlayErrorKey(path: string, overlay: HospitalFormOverlay): string {
  const consent = /^\$\.consents\[(\d+)\](?:\.(\w+))?/.exec(path);
  if (consent) {
    const type = overlay.consents?.[Number(consent[1])]?.consentType ?? consent[1];
    return `consent:${type}${consent[2] ? ':' + consent[2] : ''}`;
  }
  const section = /^\$\.sections\.([^.]+)(?:\.(\w+))?/.exec(path);
  if (section) return `section:${section[1]}${section[2] ? ':' + section[2] : ''}`;
  const field = /^\$\.fields\.([^.]+\.[^.]+)(?:\.(\w+))?/.exec(path);
  if (field) return `field:${field[1]}${field[2] ? ':' + field[2] : ''}`;
  return 'general';
}
