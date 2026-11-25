import { FormArray, FormGroup } from '@angular/forms';
import { testDefinition } from '../testing/test-definition';
import { ClinicalFormModel } from './clinical-form-model';

describe('ClinicalFormModel', () => {
  const build = (options: ConstructorParameters<typeof ClinicalFormModel>[1] = {}) => new ClinicalFormModel(testDefinition(), options);

  it('creates controls for answerable fields only', () => {
    const model = build();
    expect(model.control('intake', 'complaint')).toBeTruthy();
    expect(model.control('intake', 'name')).toBeNull(); // patientBinding
    expect(model.control('consent', 'agree')).toBeNull(); // consent
    expect(model.control('assessment', 'history') instanceof FormGroup).toBeTrue();
    expect(model.control('assessment', 'exercises') instanceof FormArray).toBeTrue();
  });

  it('restores existing answers, including condition lists and repeater rows', () => {
    const model = build({
      answers: {
        intake: { complaint: 'Knee pain', areas: ['knee'], kneeSide: 'left' },
        assessment: { history: { surgery: { status: 'yes', details: 'ACL' } }, exercises: [{ name: 'Squat', reps: 10 }] },
      },
    });
    expect(model.control('intake', 'complaint')!.value).toBe('Knee pain');
    expect(model.control('assessment', 'history')!.get('surgery.details')!.value).toBe('ACL');
    expect((model.control('assessment', 'exercises') as FormArray).length).toBe(1);
    expect(model.isVisible('intake.kneeSide')).toBeTrue();
  });

  describe('conditional visibility', () => {
    it('shows and requires a field when its condition becomes true, and hides it again', () => {
      const model = build();
      const sportName = model.control('intake', 'sportName')!;
      expect(model.isVisible('intake.sportName')).toBeFalse();
      expect(sportName.disabled).toBeTrue();

      model.control('intake', 'sport')!.setValue('yes');
      expect(model.isVisible('intake.sportName')).toBeTrue();
      expect(model.isRequired('intake.sportName')).toBeTrue();
      expect(sportName.enabled).toBeTrue();

      model.control('intake', 'sport')!.setValue('no');
      expect(model.isVisible('intake.sportName')).toBeFalse();
      expect(model.isRequired('intake.sportName')).toBeFalse();
    });

    it('never sends values of hidden fields', () => {
      const model = build();
      model.control('intake', 'sport')!.setValue('yes');
      model.control('intake', 'sportName')!.setValue('Cricket');
      expect(model.answers()['intake']['sportName']).toBe('Cricket');

      model.control('intake', 'sport')!.setValue('no');
      expect(model.answers()['intake']['sportName']).toBeUndefined();
    });

    it('treats hidden values as absent for other conditions (chained visibility)', () => {
      const model = build();
      model.control('intake', 'areas')!.setValue(['knee']);
      model.control('intake', 'kneeSide')!.setValue('left');
      expect(model.isVisible('intake.kneeNote')).toBeTrue();

      model.control('intake', 'areas')!.setValue(['back']); // kneeSide hidden, its stale 'left' no longer counts
      expect(model.isVisible('intake.kneeSide')).toBeFalse();
      expect(model.isVisible('intake.kneeNote')).toBeFalse();
    });

    it('evaluates patient conditions from the patient context', () => {
      expect(build({ patient: { gender: 'Female' } }).isVisible('intake.pregnant')).toBeTrue();
      expect(build({ patient: { gender: 'Male' } }).isVisible('intake.pregnant')).toBeFalse();
      expect(build().isVisible('intake.pregnant')).toBeFalse();
      expect(build({ patient: { ageYears: 70 } }).isVisible('assessment.history.senior')).toBeTrue();
      expect(build({ patient: { ageYears: 30 } }).isVisible('assessment.history.senior')).toBeFalse();
    });

    it('shows condition-list item fields per item status', () => {
      const model = build();
      const history = model.control('assessment', 'history')!;
      expect(model.isVisible('assessment.history.surgery.details')).toBeFalse();
      history.get('surgery.status')!.setValue('yes');
      expect(model.isVisible('assessment.history.surgery.details')).toBeTrue();
      expect(model.isVisible('assessment.history.fracture.details')).toBeFalse();
    });
  });

  describe('section permissions and read-only', () => {
    it('disables sections the user may not edit and omits them from the answers', () => {
      const model = build({ editableSections: new Set(['intake']), answers: { assessment: { pain: 4 } } });
      expect(model.canEditSection('assessment')).toBeFalse();
      expect(model.control('assessment', 'pain')!.disabled).toBeTrue();
      expect(model.control('assessment', 'pain')!.value).toBe(4); // still displayed

      model.control('intake', 'complaint')!.setValue('Neck stiffness');
      const answers = model.answers();
      expect(Object.keys(answers)).toEqual(['intake']);
      expect(answers['intake']['complaint']).toBe('Neck stiffness');
    });

    it('read-only mode disables everything and produces no answers', () => {
      const model = build({ readOnly: true, answers: { intake: { complaint: 'x' } } });
      // (A section without controls, like Consent, is an empty group and never reports "disabled".)
      const sectionsWithControls = Object.values(model.form.controls).filter((g) => Object.keys(g.controls).length > 0);
      expect(sectionsWithControls.length).toBe(2);
      expect(sectionsWithControls.every((g) => g.disabled)).toBeTrue();
      expect(model.answers()).toEqual({});
      expect(model.validate('submit')).toEqual([]);
    });
  });

  describe('validation', () => {
    it('draft mode ignores missing required answers; submit mode reports them', () => {
      const model = build();
      expect(model.validate('draft')).toEqual([]);
      const issues = model.validate('submit');
      expect(issues.some((i) => i.path === 'intake.complaint' && i.message === 'This field is required.')).toBeTrue();
      expect(issues.some((i) => i.path.startsWith('assessment.history.surgery.status'))).toBeTrue();
    });

    it('reports format problems even for drafts', () => {
      const model = build();
      model.control('intake', 'complaint')!.setValue('x'.repeat(51));
      model.control('intake', 'phone')!.setValue('call me');
      model.control('intake', 'email')!.setValue('not-an-email');
      model.control('assessment', 'pain')!.setValue(11);
      const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().substring(0, 10);
      model.control('intake', 'onset')!.setValue(tomorrow);

      const messages = model.validate('draft').map((i) => `${i.path}: ${i.message}`);
      expect(messages).toContain('intake.complaint: Maximum 50 characters.');
      expect(messages).toContain('intake.phone: The format is not valid.');
      expect(messages).toContain('intake.email: Enter a valid email address.');
      expect(messages).toContain('assessment.pain: Must be at most 10.');
      expect(messages).toContain('intake.onset: The date cannot be in the future.');
    });

    it('requires condition-list statuses only for visible items', () => {
      const model = build({ patient: { ageYears: 30 } });
      const history = model.control('assessment', 'history')!;
      history.get('surgery.status')!.setValue('no');
      history.get('fracture.status')!.setValue('no');
      model.control('intake', 'complaint')!.setValue('Back pain');
      expect(model.validate('submit').filter((i) => i.path.startsWith('assessment.history'))).toEqual([]); // 'senior' hidden
    });
  });

  describe('repeater rows', () => {
    it('adds rows up to maxRows, removes rows, and validates required columns', () => {
      const model = build();
      const field = model.definition.sections[1].fields.find((f) => f.key === 'exercises')!;
      const rows = model.control('assessment', 'exercises') as FormArray;

      model.addRow('assessment', field);
      model.addRow('assessment', field);
      model.addRow('assessment', field); // maxRows = 2
      expect(rows.length).toBe(2);

      expect(model.validate('draft').some((i) => i.message === 'This field is required.')).toBeFalse();
      expect(model.validate('submit').some((i) => i.path === 'assessment.exercises.0.name')).toBeTrue();

      model.removeRow('assessment', field, 1);
      expect(rows.length).toBe(1);
    });

    it('does not let users change rows in sections they cannot edit', () => {
      const model = build({ editableSections: new Set(['intake']) });
      const field = model.definition.sections[1].fields.find((f) => f.key === 'exercises')!;
      model.addRow('assessment', field);
      expect((model.control('assessment', 'exercises') as FormArray).length).toBe(0);
    });
  });

  it('produces clean answers for the API', () => {
    const model = build();
    model.control('intake', 'complaint')!.setValue('Knee pain');
    model.control('intake', 'areas')!.setValue(['knee']);
    model.control('intake', 'kneeSide')!.setValue('right');
    model.control('assessment', 'history')!.get('surgery.status')!.setValue('yes');
    model.control('assessment', 'history')!.get('surgery.details')!.setValue('ACL 2019');
    model.control('assessment', 'pain')!.setValue(6);

    expect(model.answers()).toEqual({
      intake: { complaint: 'Knee pain', areas: ['knee'], kneeSide: 'right' },
      assessment: { history: { surgery: { status: 'yes', details: 'ACL 2019' } }, pain: 6 },
    });
  });
});
