import { testDefinition } from '../testing/test-definition';
import { FormAnswers, VisibilityCondition } from '../models/clinical-forms.models';
import {
  BUILT_IN_OPTION_SETS,
  ConditionContext,
  ageInYears,
  cleanValue,
  evaluateCondition,
  isEmpty,
  isRequired,
  resolveOptions,
} from './clinical-form-engine';

describe('clinical-form-engine', () => {
  const definition = testDefinition();
  const intake = definition.sections[0];
  const assessment = definition.sections[1];
  const field = (sectionIndex: number, key: string) => definition.sections[sectionIndex].fields.find((f) => f.key === key)!;

  function ctx(answers: FormAnswers, extra: Partial<ConditionContext> = {}): ConditionContext {
    return { definition, section: intake, answers, ...extra };
  }

  describe('resolveOptions', () => {
    it('uses inline options, definition option sets, built-in sets and sibling fields', () => {
      expect(resolveOptions(definition, intake, field(0, 'areas')).map((o) => o.value)).toEqual(['none', 'neck', 'back', 'knee']);
      expect(resolveOptions(definition, assessment, field(1, 'severity')).map((o) => o.value)).toEqual(['mild', 'severe']);
      expect(resolveOptions(definition, intake, field(0, 'sport')).map((o) => o.value)).toEqual(['yes', 'no', 'unknown']);
      const column = field(1, 'exercises').columns!.find((c) => c.key === 'area')!;
      expect(resolveOptions(definition, assessment, column).map((o) => o.value)).toEqual(['strength', 'mobility']);
    });

    it('provides FDI tooth numbering as a built-in set (32 permanent + 20 primary)', () => {
      const teeth = resolveOptions(definition, assessment, field(1, 'tooth')).map((o) => o.value);
      expect(teeth.length).toBe(52);
      expect(teeth).toContain('11');
      expect(teeth).toContain('48');
      expect(teeth).toContain('85');
      expect(teeth).not.toContain('19');
      expect(BUILT_IN_OPTION_SETS['fdiTeeth']).toBeDefined();
    });
  });

  describe('evaluateCondition', () => {
    const cond = (c: Partial<VisibilityCondition>): VisibilityCondition => ({ field: 'sport', op: 'eq', ...c }) as VisibilityCondition;

    it('eq / neq compare scalars; missing values never satisfy eq', () => {
      expect(evaluateCondition(cond({ value: 'yes' }), ctx({ intake: { sport: 'yes' } }))).toBeTrue();
      expect(evaluateCondition(cond({ value: 'yes' }), ctx({ intake: { sport: 'no' } }))).toBeFalse();
      expect(evaluateCondition(cond({ value: 'yes' }), ctx({ intake: {} }))).toBeFalse();
      expect(evaluateCondition(cond({ op: 'neq', value: 'yes' }), ctx({ intake: {} }))).toBeTrue();
    });

    it('in / any work for single and multi-value answers', () => {
      expect(evaluateCondition(cond({ op: 'in', value: ['yes', 'unknown'] }), ctx({ intake: { sport: 'unknown' } }))).toBeTrue();
      expect(evaluateCondition({ field: 'areas', op: 'any', value: ['knee'] }, ctx({ intake: { areas: ['back', 'knee'] } }))).toBeTrue();
      expect(evaluateCondition({ field: 'areas', op: 'any', value: ['knee'] }, ctx({ intake: { areas: ['back'] } }))).toBeFalse();
    });

    it('notEmpty, lt and gt', () => {
      expect(evaluateCondition({ field: 'complaint', op: 'notEmpty' }, ctx({ intake: { complaint: '  ' } }))).toBeFalse();
      expect(evaluateCondition({ field: 'complaint', op: 'notEmpty' }, ctx({ intake: { complaint: 'Back pain' } }))).toBeTrue();
      expect(evaluateCondition({ field: 'assessment.pain', op: 'gt', value: 5 }, ctx({ assessment: { pain: 7 } }))).toBeTrue();
      expect(evaluateCondition({ field: 'assessment.pain', op: 'lt', value: 5 }, ctx({ assessment: { pain: 7 } }))).toBeFalse();
      expect(evaluateCondition({ field: 'assessment.pain', op: 'gt', value: 5 }, ctx({ assessment: {} }))).toBeFalse();
    });

    it('reads patient attributes and conditionList items', () => {
      const female: VisibilityCondition = { source: 'patient', field: 'gender', op: 'in', value: ['Female'] };
      expect(evaluateCondition(female, ctx({}, { patient: { gender: 'Female' } }))).toBeTrue();
      expect(evaluateCondition(female, ctx({}, { patient: { gender: 'Male' } }))).toBeFalse();
      expect(evaluateCondition(female, ctx({}, { patient: null }))).toBeFalse();
      const senior: VisibilityCondition = { source: 'patient', field: 'ageYears', op: 'gt', value: 60 };
      expect(evaluateCondition(senior, ctx({}, { patient: { ageYears: 72 } }))).toBeTrue();
      const itemYes: VisibilityCondition = { field: '@item.status', op: 'eq', value: 'yes' };
      expect(evaluateCondition(itemYes, ctx({}, { item: { status: 'yes' } }))).toBeTrue();
      expect(evaluateCondition(itemYes, ctx({}, { item: { status: 'no' } }))).toBeFalse();
    });

    it('does not support unknown operators', () => {
      expect(evaluateCondition({ field: 'sport', op: 'matches' as never, value: 'x' }, ctx({ intake: { sport: 'x' } }))).toBeFalse();
    });
  });

  it('isRequired honours required and requiredWhen, never patient-bound fields', () => {
    expect(isRequired(field(0, 'complaint'), ctx({}))).toBeTrue();
    expect(isRequired(field(0, 'sportName'), ctx({ intake: { sport: 'no' } }))).toBeFalse();
    expect(isRequired(field(0, 'sportName'), ctx({ intake: { sport: 'yes' } }))).toBeTrue();
    expect(isRequired({ ...field(0, 'name'), required: true }, ctx({}))).toBeFalse();
  });

  describe('cleanValue', () => {
    it('omits empty answers and converts numbers', () => {
      expect(cleanValue(field(0, 'complaint'), '   ')).toBeUndefined();
      expect(cleanValue(field(0, 'complaint'), 'Knee pain')).toBe('Knee pain');
      expect(cleanValue(field(1, 'pain'), '7')).toBe(7);
      expect(cleanValue(field(1, 'pain'), null)).toBeUndefined();
      expect(cleanValue(field(0, 'areas'), [])).toBeUndefined();
      expect(cleanValue(field(0, 'name'), 'Injected')).toBeUndefined();
      expect(cleanValue(field(0, 'pregnant'), null)).toBeUndefined();
    });

    it('cleans condition lists and drops empty repeater rows', () => {
      expect(cleanValue(field(1, 'history'), { surgery: { status: 'yes', details: 'ACL 2019' }, fracture: { status: null, details: '' } }))
        .toEqual({ surgery: { status: 'yes', details: 'ACL 2019' } });
      expect(cleanValue(field(1, 'exercises'), [{ name: 'Squat', reps: 10, area: null }, { name: '', reps: null, area: null }]))
        .toEqual([{ name: 'Squat', reps: 10 }]);
    });
  });

  it('isEmpty and ageInYears', () => {
    expect(isEmpty({})).toBeTrue();
    expect(isEmpty([1])).toBeFalse();
    expect(isEmpty(0)).toBeFalse();
    expect(ageInYears('1988-03-14', new Date(2026, 2, 13))).toBe(37);
    expect(ageInYears('1988-03-14', new Date(2026, 2, 14))).toBe(38);
    expect(ageInYears('0001-01-01T00:00:00')).toBeNull();
    expect(ageInYears(null)).toBeNull();
  });
});
