import { FieldDefinition, FormDefinition } from '../../doctor/modules/clinical-forms/models/clinical-forms.models';
import {
  FIELD_TYPES,
  KEY_PATTERN,
  TICKED_SET,
  changeFieldType,
  conditionTargets,
  locateIssue,
  newField,
  newSection,
  operatorsFor,
  prepareForSave,
  toKebab,
  toKey,
  uniqueKey,
} from './builder-utils';

function emptyDefinition(): FormDefinition {
  return { schemaVersion: 1, form: { formKey: 'test-form', formName: 'Test', specialty: 'dental', versionNumber: 2 }, sections: [] };
}

describe('Form builder utils', () => {
  it('makes valid camelCase keys from any label', () => {
    expect(toKey('Chief complaint (main)')).toBe('chiefComplaintMain');
    expect(toKey('  BP / Pulse ')).toBe('bpPulse');
    expect(toKey('1st visit')).toBe('field1stVisit');
    expect(toKey('अनुमति')).toBe('field');
    for (const label of ['Chief complaint', '123', '', '— x —']) expect(KEY_PATTERN.test(toKey(label))).toBeTrue();
  });

  it('makes kebab keys and unique keys', () => {
    expect(toKebab('Dental Patient Intake')).toBe('dental-patient-intake');
    expect(uniqueKey('notes', ['notes', 'notes2'])).toBe('notes3');
    expect(uniqueKey('notes', [])).toBe('notes');
  });

  it('creates every field type with the properties it needs', () => {
    const def = emptyDefinition();
    const section = newSection('Medical History', def.sections);
    def.sections.push(section);
    expect(section.key).toBe('medicalHistory');
    for (const t of FIELD_TYPES) section.fields.push(newField(t.type, section.fields, def));

    expect(new Set(section.fields.map((f) => f.key)).size).toBe(section.fields.length);
    const byType = (type: string) => section.fields.find((f) => f.type === type)!;
    expect(byType('select').options!.length).toBe(2);
    expect(byType('conditionList').itemOptionSet).toBe(TICKED_SET);
    expect(def.optionSets![TICKED_SET]).toEqual([{ value: 'yes', label: 'Yes' }]);
    expect(byType('repeater').columns!.length).toBe(1);
    expect(byType('patientBinding').binding).toBe('patient.fullName');
    expect(byType('consent').consentType).toBe(def.consents![0].consentType);
    expect(byType('attachmentList').allowedTypes!.length).toBeGreaterThan(0);
  });

  it('drops properties the new type does not accept when the type changes', () => {
    const def = emptyDefinition();
    const field: FieldDefinition = { key: 'pain', type: 'radio', label: 'Pain', required: true, options: [{ value: 'a', label: 'A' }] };
    changeFieldType(field, 'checkboxGroup', def);
    expect(field.options).toEqual([{ value: 'a', label: 'A' }]); // options kept between option types

    changeFieldType(field, 'date', def);
    expect(field.options).toBeUndefined();
    expect(field.required).toBeTrue();
    expect(field.label).toBe('Pain');

    changeFieldType(field, 'patientBinding', def);
    expect(field.required).toBeUndefined(); // bound fields cannot be required
  });

  it('prepares the definition for saving: orders follow the screen and blanks are removed', () => {
    const def = emptyDefinition();
    def.sections = [
      { key: 'b', title: 'B', order: 9, fields: [{ key: 'x', type: 'text', label: 'X', helpText: '', validation: {} }] },
      { key: 'a', title: 'A', order: 1, fields: [{ key: 'y', type: 'select', label: 'Y', optionSet: 'yesNoUnknown', options: [] }] },
    ];
    const saved = prepareForSave(def);
    expect(saved.sections.map((s) => s.order)).toEqual([1, 2]);
    expect(saved.sections[0].fields[0].order).toBe(1);
    expect('helpText' in saved.sections[0].fields[0]).toBeFalse();
    expect('validation' in saved.sections[0].fields[0]).toBeFalse();
    expect('options' in saved.sections[1].fields[0]).toBeFalse(); // shared list wins
    expect(def.sections[0].order).toBe(9); // the edited copy is untouched
  });

  it('offers conditions on other answers with operators that fit the answer type', () => {
    const def = emptyDefinition();
    def.sections = [
      { key: 'history', title: 'History', fields: [
        { key: 'smoker', type: 'yesNoUnknown', label: 'Smoker' },
        { key: 'packs', type: 'number', label: 'Packs' },
        { key: 'meds', type: 'repeater', label: 'Meds', columns: [] },
      ] },
      { key: 'plan', title: 'Plan', fields: [{ key: 'items', type: 'checkboxGroup', label: 'Items', options: [] }] },
    ];
    const targets = conditionTargets(def, 'history', 'packs');
    expect(targets.map((t) => t.ref)).toEqual(['smoker', 'plan.items']); // not itself, not tables
    expect(operatorsFor(targets[1].field, 'answers').map((o) => o.op)).toEqual(['any', 'notEmpty']);
    expect(operatorsFor(def.sections[0].fields[1], 'answers').map((o) => o.op)).toContain('gt');
  });

  it('turns validator paths into readable places', () => {
    const def = emptyDefinition();
    def.sections = [{ key: 's', title: 'History', fields: [{ key: 'f', type: 'text', label: 'Allergies' }] }];
    expect(locateIssue('$.sections[0].fields[0].options', def)).toEqual(jasmine.objectContaining({ sectionIndex: 0, fieldIndex: 0, text: 'Section "History" › field "Allergies"' }));
    expect(locateIssue('$.consents[0].consentType', def).area).toBe('consents');
  });
});
