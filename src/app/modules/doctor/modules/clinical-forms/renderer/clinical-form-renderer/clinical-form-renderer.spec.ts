import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ClinicalFormRendererModule } from '../clinical-form-renderer-module';
import { ClinicalFormRenderer } from './clinical-form-renderer';
import { ClinicalFormModel } from '../../engine/clinical-form-model';
import { testDefinition } from '../../testing/test-definition';
import { EffectiveSectionAccess, FormAnswers, FormDefinition, PatientFormContext } from '../../models/clinical-forms.models';

describe('ClinicalFormRenderer', () => {
  let fixture: ComponentFixture<ClinicalFormRenderer>;
  let model: ClinicalFormModel;

  async function render(options: { answers?: FormAnswers; access?: EffectiveSectionAccess[]; readOnly?: boolean; patient?: PatientFormContext; definition?: FormDefinition; hideConsentSections?: boolean } = {}) {
    await TestBed.configureTestingModule({
      imports: [ClinicalFormRendererModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicalFormRenderer);
    fixture.componentInstance.modelReady.subscribe((m) => (model = m));
    fixture.componentRef.setInput('definition', options.definition ?? testDefinition());
    if (options.answers) fixture.componentRef.setInput('answers', options.answers);
    if (options.access) fixture.componentRef.setInput('sectionAccess', options.access);
    if (options.readOnly) fixture.componentRef.setInput('readOnly', true);
    if (options.patient) fixture.componentRef.setInput('patient', options.patient);
    if (options.hideConsentSections) fixture.componentRef.setInput('hideConsentSections', true);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const field = (path: string) => el().querySelector(`[data-field="${path}"]`);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  it('renders every section and field of an arbitrary definition', async () => {
    await render();
    const sections = Array.from(el().querySelectorAll('[data-section]')).map((s) => s.getAttribute('data-section'));
    expect(sections).toEqual(['intake', 'assessment', 'consent']);
    expect(field('intake.complaint')?.querySelector('textarea')).toBeTruthy();
    expect(field('intake.phone')?.querySelector('input[type="tel"]')).toBeTruthy();
    expect(field('assessment.pain')?.querySelector('input[type="number"]')).toBeTruthy();
    expect(field('assessment.severity')?.querySelectorAll('option').length).toBe(3); // placeholder + 2
    expect(field('assessment.tooth')?.querySelectorAll('option').length).toBe(53); // FDI set
    expect(field('assessment.history')).toBeTruthy();
    expect(field('assessment.exercises')).toBeTruthy();
    expect(el().textContent).toContain('I agree to the assessment.');
  });

  it('can hide consent-only sections for pages with their own consent panel', async () => {
    await render({ hideConsentSections: true });
    const sections = Array.from(el().querySelectorAll('[data-section]')).map((s) => s.getAttribute('data-section'));
    expect(sections).toEqual(['intake', 'assessment']);
  });

  it('shows a conditional field only when its condition is met', async () => {
    await render();
    expect(field('intake.sportName')).toBeNull();

    // Radio values are reactive-forms inputs (not DOM attributes), so select options by id.
    const yes = el().querySelector<HTMLInputElement>('[data-field="intake.sport"] input[id$="-yes"]')!;
    yes.click();
    await settle();
    expect(field('intake.sportName')).toBeTruthy();
    expect(field('intake.sportName')!.querySelector('.text-danger')?.textContent).toContain('*'); // now required

    el().querySelector<HTMLInputElement>('[data-field="intake.sport"] input[id$="-no"]')!.click();
    await settle();
    expect(field('intake.sportName')).toBeNull();
  });

  it('applies the exclusive option in checkbox groups', async () => {
    await render();
    const box = (value: string) => el().querySelector<HTMLInputElement>(`[data-field="intake.areas"] input[id$="-${value}"]`)!;
    box('neck').click();
    box('back').click();
    await settle();
    expect(model.control('intake', 'areas')!.value).toEqual(['neck', 'back']);

    box('none').click();
    await settle();
    expect(model.control('intake', 'areas')!.value).toEqual(['none']);
    expect(box('neck').checked).toBeFalse();
  });

  it('displays patient-record values without making them editable', async () => {
    await render({ patient: { gender: 'Female', bindings: { 'patient.fullName': 'Asha Verma' } } });
    expect(field('intake.name')?.querySelector('[data-test="patient-value"]')?.textContent).toContain('Asha Verma');
    expect(field('intake.name')?.querySelector('input')).toBeNull();
    expect(field('intake.pregnant')).toBeTruthy(); // patient-based condition
  });

  it('marks sections the user cannot edit as read only and disables their inputs', async () => {
    await render({
      access: [
        { key: 'intake', title: 'Intake', clinical: false, canEdit: true },
        { key: 'assessment', title: 'Assessment', clinical: true, canEdit: false },
        { key: 'consent', title: 'Consent', clinical: false, canEdit: true },
      ],
    });
    const assessment = el().querySelector('[data-section="assessment"]')!;
    expect(assessment.querySelector('[data-test="read-only-badge"]')).toBeTruthy();
    expect(assessment.querySelector<HTMLInputElement>('[data-field="assessment.pain"] input')!.disabled).toBeTrue();
    expect(assessment.querySelector('[data-test="add-row"]')).toBeNull();
    expect(el().querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.disabled).toBeFalse();
  });

  it('shows required errors after a submission check', async () => {
    await render();
    expect(el().querySelector('[data-field="intake.complaint"] [data-test="field-errors"]')).toBeNull();
    model.validate('submit');
    await settle();
    expect(el().querySelector('[data-field="intake.complaint"] [data-test="field-errors"]')?.textContent).toContain('This field is required.');
  });

  it('adds repeater rows and condition-list item fields interactively', async () => {
    await render();
    el().querySelector<HTMLButtonElement>('[data-field="assessment.exercises"] [data-test="add-row"]')!.click();
    await settle();
    expect(el().querySelectorAll('[data-field="assessment.exercises"] tbody tr').length).toBe(1);

    expect(el().querySelector('[data-field="assessment.history.surgery.details"]')).toBeNull();
    el().querySelector<HTMLInputElement>('[data-item="surgery"] input[id$="-yes"]')!.click();
    await settle();
    expect(el().querySelector('[data-field="assessment.history.surgery.details"]')).toBeTruthy();
  });

  it('read-only mode disables every input', async () => {
    await render({ readOnly: true, answers: { intake: { complaint: 'Recorded complaint' } } });
    const inputs = Array.from(el().querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'));
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.every((i) => i.disabled)).toBeTrue();
    expect(el().querySelector<HTMLTextAreaElement>('[data-field="intake.complaint"] textarea')!.value).toBe('Recorded complaint');
  });

  it('lays short answers out side by side and wide fields across the row (paper layout)', async () => {
    await render();
    const host = (path: string) => field(path)!.closest('app-clinical-form-field')!;
    expect(host('intake.phone').classList).not.toContain('cf-wide');
    expect(host('assessment.pain').classList).not.toContain('cf-wide');
    expect(host('intake.complaint').classList).toContain('cf-wide');           // textarea
    expect(host('assessment.history').classList).toContain('cf-wide');         // list
    expect(host('assessment.exercises').classList).toContain('cf-wide');       // table
  });

  describe('tick-box condition lists (single-value status set)', () => {
    function tickDefinition(): FormDefinition {
      const d = testDefinition();
      d.optionSets = { ...(d.optionSets ?? {}), ticked: [{ value: 'yes', label: 'Yes' }] };
      const history = d.sections[1].fields[0];
      history.itemOptionSet = 'ticked';
      history.required = false;
      history.items!.push({ key: 'none', label: 'None' });
      return d;
    }
    const tick = (key: string) => el().querySelector<HTMLInputElement>(`[data-item="${key}"] input[type="checkbox"]`)!;

    it('renders items as tick boxes and stores only ticked items', async () => {
      await render({ definition: tickDefinition() });
      expect(el().querySelector('[data-test="tick-list"]')).toBeTruthy();
      expect(el().querySelector('[data-item="surgery"] input[type="radio"]')).toBeNull();
      expect(model.answers()['assessment']['history']).toBeUndefined();

      tick('surgery').click();
      await settle();
      expect(el().querySelector('[data-field="assessment.history.surgery.details"]')).toBeTruthy(); // details for ticked item
      expect(model.answers()['assessment']['history']).toEqual({ surgery: { status: 'yes' } });

      tick('surgery').click();
      await settle();
      expect(model.answers()['assessment']['history']).toBeUndefined();
      expect(el().querySelector('[data-field="assessment.history.surgery.details"]')).toBeNull();
    });

    it('"None" clears other ticks and ticking an item clears "None"', async () => {
      await render({ definition: tickDefinition() });
      tick('surgery').click();
      tick('fracture').click();
      await settle();
      tick('none').click();
      await settle();
      expect(model.answers()['assessment']['history']).toEqual({ none: { status: 'yes' } });
      expect(tick('surgery').checked).toBeFalse();

      tick('fracture').click();
      await settle();
      expect(model.answers()['assessment']['history']).toEqual({ fracture: { status: 'yes' } });
    });

    it('restores saved ticks and is read-only when the form is', async () => {
      await render({ definition: tickDefinition(), readOnly: true, answers: { assessment: { history: { fracture: { status: 'yes', details: 'Wrist' } } } } });
      expect(tick('fracture').checked).toBeTrue();
      expect(tick('surgery').checked).toBeFalse();
      expect(tick('fracture').disabled).toBeTrue();
    });
  });
});
