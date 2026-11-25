import { FormDefinition } from '../models/clinical-forms.models';

/**
 * A deliberately non-dental definition used by the specs to prove the renderer is generic.
 * It exercises every V1 field type and condition operator.
 */
const DEFINITION: FormDefinition = {
  schemaVersion: 1,
  form: { formKey: 'physio-assessment', formName: 'Physiotherapy Assessment', specialty: 'physiotherapy', versionNumber: 3 },
  optionSets: {
    severity: [
      { value: 'mild', label: 'Mild' },
      { value: 'severe', label: 'Severe' },
    ],
  },
  sections: [
    {
      key: 'intake', title: 'Intake', order: 1, editableBy: ['Receptionist', 'Doctor'], clinical: false,
      fields: [
        { key: 'name', type: 'patientBinding', label: 'Patient', binding: 'patient.fullName', order: 1 },
        { key: 'complaint', type: 'textarea', label: 'Main complaint', required: true, order: 2, validation: { maxLength: 50 } },
        { key: 'phone', type: 'phone', label: 'Contact number', order: 3 },
        { key: 'email', type: 'email', label: 'Email', order: 4 },
        { key: 'sport', type: 'yesNoUnknown', label: 'Plays sport?', order: 5 },
        {
          key: 'sportName', type: 'text', label: 'Which sport', order: 6,
          visibleWhen: { field: 'sport', op: 'eq', value: 'yes' }, requiredWhen: { field: 'sport', op: 'eq', value: 'yes' },
        },
        {
          key: 'areas', type: 'checkboxGroup', label: 'Painful areas', order: 7, exclusiveOption: 'none',
          options: [
            { value: 'none', label: 'None' },
            { value: 'neck', label: 'Neck' },
            { value: 'back', label: 'Back' },
            { value: 'knee', label: 'Knee' },
          ],
        },
        {
          key: 'kneeSide', type: 'radio', label: 'Knee side', order: 8,
          options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
          visibleWhen: { field: 'areas', op: 'any', value: ['knee'] },
        },
        { key: 'kneeNote', type: 'text', label: 'Left knee note', order: 9, visibleWhen: { field: 'kneeSide', op: 'eq', value: 'left' } },
        { key: 'pregnant', type: 'boolean', label: 'Pregnant', order: 10, visibleWhen: { source: 'patient', field: 'gender', op: 'in', value: ['Female'] } },
        { key: 'onset', type: 'date', label: 'Onset', order: 11, validation: { maxDate: 'today' } },
      ],
    },
    {
      key: 'assessment', title: 'Assessment', order: 2, editableBy: ['Doctor'], clinical: true,
      fields: [
        {
          key: 'history', type: 'conditionList', label: 'History', required: true, order: 1,
          items: [
            { key: 'surgery', label: 'Previous surgery' },
            { key: 'fracture', label: 'Fracture' },
            { key: 'senior', label: 'Senior check', visibleWhen: { source: 'patient', field: 'ageYears', op: 'gt', value: 60 } },
          ],
          itemFields: [{ key: 'details', type: 'text', label: 'Details', visibleWhen: { field: '@item.status', op: 'eq', value: 'yes' } }],
        },
        { key: 'pain', type: 'number', label: 'Pain score', order: 2, validation: { min: 0, max: 10 } },
        { key: 'severity', type: 'select', label: 'Severity', order: 3, optionSet: 'severity' },
        { key: 'tooth', type: 'select', label: 'Reference (built-in set)', order: 4, optionSet: 'fdiTeeth' },
        {
          key: 'exercises', type: 'repeater', label: 'Exercises', order: 5, maxRows: 2,
          columns: [
            { key: 'name', type: 'text', label: 'Exercise', required: true },
            { key: 'reps', type: 'number', label: 'Reps' },
            { key: 'area', type: 'select', label: 'Area', optionsFrom: 'focus' },
          ],
        },
        { key: 'focus', type: 'select', label: 'Focus', order: 6, options: [{ value: 'strength', label: 'Strength' }, { value: 'mobility', label: 'Mobility' }] },
        { key: 'images', type: 'attachmentList', label: 'Images', order: 7, allowedTypes: ['ClinicalPhoto'] },
      ],
    },
    {
      key: 'consent', title: 'Consent', order: 3, editableBy: ['Receptionist', 'Doctor'],
      fields: [{ key: 'agree', type: 'consent', label: 'Consent', consentType: 'physio-general', required: true }],
    },
  ],
  consents: [{ consentType: 'physio-general', consentVersion: '1.0', text: 'I agree to the assessment.', required: true }],
};

export function testDefinition(): FormDefinition {
  return JSON.parse(JSON.stringify(DEFINITION));
}
