import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { ClinicalFormsModule } from '../../clinical-forms-module';
import { ClinicalFormConfigurationEditor } from './clinical-form-configuration-editor';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsError } from '../../services/clinical-forms-error';
import { ToastService } from '../../../../../../shared/services/toast-service';
import { unsavedChangesGuard } from '../../guards/clinical-forms.guard';
import { testDefinition } from '../../testing/test-definition';
import {
  FormDefinition,
  HospitalAvailableClinicalForm,
  HospitalClinicalFormPreview,
  HospitalClinicalFormState,
  PreviewHospitalClinicalFormRequest,
  TemplateVersionStatus,
} from '../../models/clinical-forms.models';

describe('ClinicalFormConfigurationEditor (Hospital Admin)', () => {
  let fixture: ComponentFixture<ClinicalFormConfigurationEditor>;
  let api: jasmine.SpyObj<ClinicalFormsApiService>;
  let toast: jasmine.SpyObj<ToastService>;

  const STORED = JSON.stringify({
    schemaVersion: 1,
    fields: { 'intake.email': { label: 'E-mail address' } },
    consents: [],
  });

  function base(versionNumber = 1): FormDefinition {
    const d = testDefinition();
    d.form.versionNumber = versionNumber;
    d.sections.push({ key: 'extras', title: 'Extras', order: 4, fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }] });
    return d;
  }

  const state = (extra: Partial<HospitalClinicalFormState> = {}): HospitalClinicalFormState => ({
    templateId: 't-1', isEnabled: true, activeTemplateVersionId: 'v-1', activeVersionNumber: 1, configurationJson: STORED,
    enabledAt: '2026-11-20T10:00:00Z', disabledAt: null, rowVersion: 'AAAAAAAAB9E=', ...extra,
  });
  const form = (configuration: HospitalClinicalFormState | null = state()): HospitalAvailableClinicalForm => ({
    templateId: 't-1', formKey: 'physio-assessment', formName: 'Physiotherapy Assessment', specialty: 'physiotherapy', templateIsActive: true,
    publishedVersions: [
      { id: 'v-1', templateId: 't-1', versionNumber: 1, status: TemplateVersionStatus.Published, schemaVersion: 1, createdAt: '', rowVersion: '' },
      { id: 'v-2', templateId: 't-1', versionNumber: 2, status: TemplateVersionStatus.Published, schemaVersion: 1, createdAt: '', rowVersion: '' },
    ],
    configuration,
  });

  async function render(available: HospitalAvailableClinicalForm[] = [form()]) {
    api = jasmine.createSpyObj<ClinicalFormsApiService>('ClinicalFormsApiService', ['getAvailableForms', 'previewConfiguration', 'updateConfiguration']);
    api.getAvailableForms.and.returnValue(of(available));
    api.previewConfiguration.and.callFake((_id: string, request: PreviewHospitalClinicalFormRequest) =>
      of<HospitalClinicalFormPreview>({ templateVersionId: request.templateVersionId ?? 'v-1', versionNumber: request.templateVersionId === 'v-2' ? 2 : 1, definition: base() }));
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [ClinicalFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: new BehaviorSubject(convertToParamMap({ templateId: 't-1' })), snapshot: { paramMap: convertToParamMap({ templateId: 't-1' }) } },
        },
        { provide: ClinicalFormsApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClinicalFormConfigurationEditor);
    await settle();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (test: string, root: ParentNode = el()) => root.querySelector<HTMLElement>(`[data-test="${test}"]`);
  const sectionCard = (key: string) => el().querySelector<HTMLElement>(`[data-config-section="${key}"]`)!;
  const fieldRow = (key: string) => el().querySelector<HTMLElement>(`[data-config-field="${key}"]`)!;
  const consentBlock = (type: string) => el().querySelector<HTMLElement>(`[data-config-consent="${type}"]`)!;
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function expand(section: string) {
    q('toggle-fields', sectionCard(section))!.click();
    await settle();
  }
  function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  function check(input: HTMLInputElement, checked: boolean) {
    input.checked = checked;
    input.dispatchEvent(new Event('change'));
  }
  const savedBody = () => api.updateConfiguration.calls.mostRecent().args[1];
  const savedOverlay = () => JSON.parse(savedBody().configurationJson!);

  it('loads the base definition (version as published) through the preview API, without an overlay', async () => {
    await render();
    expect(api.previewConfiguration).toHaveBeenCalledWith('t-1', { templateVersionId: 'v-1', configurationJson: null });
    expect(el().querySelectorAll('[data-config-section]').length).toBe(4);
    expect(q('save')).toBeTruthy();
    expect((q('save') as HTMLButtonElement).disabled).toBeTrue(); // nothing changed yet
  });

  it('offers only changes the server accepts', async () => {
    await render();
    // Sections with mandatory content cannot be switched off; optional ones can.
    expect((q('section-enabled', sectionCard('intake')) as HTMLInputElement).disabled).toBeTrue();
    expect((q('section-enabled', sectionCard('extras')) as HTMLInputElement).disabled).toBeFalse();

    await expand('intake');
    expect((q('field-hidden', fieldRow('intake.complaint')) as HTMLInputElement).disabled).toBeTrue(); // mandatory
    expect((q('field-hidden', fieldRow('intake.sport')) as HTMLInputElement).disabled).toBeTrue();     // used by a condition
    expect((q('field-hidden', fieldRow('intake.phone')) as HTMLInputElement).disabled).toBeFalse();
    expect((q('field-required', fieldRow('intake.name')) as HTMLInputElement).disabled).toBeTrue();    // patient record
  });

  it('saves the exact backend contract, preserving values that were not changed', async () => {
    await render();
    await expand('intake');
    check(q('field-hidden', fieldRow('intake.phone')) as HTMLInputElement, true);
    check(q('section-enabled', sectionCard('extras')) as HTMLInputElement, false);
    type(q('section-title', sectionCard('assessment')) as HTMLInputElement, 'Clinical assessment');
    await settle();
    expect(q('unsaved')).toBeTruthy();

    api.updateConfiguration.and.returnValue(of(state({ configurationJson: 'saved', rowVersion: 'AAAAAAAAB9I=' })));
    q('save')!.click();
    await settle();

    expect(api.updateConfiguration).toHaveBeenCalledTimes(1);
    const body = savedBody();
    expect(Object.keys(body).sort()).toEqual(['activeTemplateVersionId', 'configurationJson', 'rowVersion']);
    expect(body.activeTemplateVersionId).toBe('v-1');
    expect(body.rowVersion).toBe('AAAAAAAAB9E=');
    expect(JSON.stringify(body).toLowerCase()).not.toContain('hospitalid');
    expect(savedOverlay()).toEqual({
      schemaVersion: 1,
      sections: { extras: { enabled: false }, assessment: { title: 'Clinical assessment' } },
      fields: { 'intake.email': { label: 'E-mail address' }, 'intake.phone': { hidden: true } }, // stored label kept
    });
    expect(toast.success).toHaveBeenCalled();
    expect(q('unsaved')).toBeNull();
    // The effective (saved) configuration is shown afterwards.
    expect(api.previewConfiguration).toHaveBeenCalledWith('t-1', { templateVersionId: 'v-1', configurationJson: 'saved' });
    expect(q('preview-panel')?.textContent).toContain('Saved configuration');
  });

  it('customizes consent wording with its own version', async () => {
    await render();
    check(q('consent-customized', consentBlock('physio-general')) as HTMLInputElement, true);
    await settle();
    const version = q('consent-version', consentBlock('physio-general')) as HTMLInputElement;
    expect(version.value).toBe('1.0-H1'); // suggested, distinct from the standard 1.0
    type(version, '1.0');                // same as standard → rejected locally
    type(q('consent-text', consentBlock('physio-general')) as HTMLTextAreaElement, 'Hospital wording for the assessment.');
    await settle();
    q('save')!.click();
    await settle();
    expect(api.updateConfiguration).not.toHaveBeenCalled();
    expect(consentBlock('physio-general').textContent).toContain('different from the standard wording');

    type(q('consent-version', consentBlock('physio-general')) as HTMLInputElement, 'CITY-2026-1');
    api.updateConfiguration.and.returnValue(of(state({ rowVersion: 'x' })));
    await settle();
    q('save')!.click();
    await settle();
    expect(savedOverlay().consents).toEqual([{ consentType: 'physio-general', consentVersion: 'CITY-2026-1', text: 'Hospital wording for the assessment.' }]);
  });

  it('hides options and makes optional fields mandatory', async () => {
    await render();
    await expand('assessment');
    const severity = fieldRow('assessment.severity');
    check(severity.querySelectorAll<HTMLInputElement>('[data-test="option-shown"]')[1], false); // hide "severe"
    check(q('field-required', fieldRow('assessment.pain')) as HTMLInputElement, true);
    api.updateConfiguration.and.returnValue(of(state()));
    await settle();
    q('save')!.click();
    await settle();
    expect(savedOverlay().fields['assessment.severity']).toEqual({ hiddenOptions: ['severe'] });
    expect(savedOverlay().fields['assessment.pain']).toEqual({ required: true });
  });

  it('previews unsaved changes read-only without saving', async () => {
    await render();
    await expand('intake');
    check(q('field-hidden', fieldRow('intake.phone')) as HTMLInputElement, true);
    await settle();
    api.previewConfiguration.calls.reset();
    q('preview-changes')!.click();
    await settle();

    const request = api.previewConfiguration.calls.mostRecent().args[1];
    expect(request.templateVersionId).toBe('v-1');
    expect(JSON.parse(request.configurationJson!).fields['intake.phone']).toEqual({ hidden: true });
    expect(api.updateConfiguration).not.toHaveBeenCalled();
    const panel = q('preview-panel')!;
    expect(panel.textContent).toContain('Preview of unsaved changes');
    expect(Array.from(panel.querySelectorAll<HTMLInputElement>('input, textarea, select')).every((i) => i.disabled)).toBeTrue();
  });

  it('shows server validation errors next to the relevant control', async () => {
    await render();
    await expand('intake');
    check(q('field-hidden', fieldRow('intake.phone')) as HTMLInputElement, true);
    api.updateConfiguration.and.returnValue(throwError(() => new ClinicalFormsError('validation', 400, 'The configuration is invalid.', [
      { code: 'FieldCannotBeHidden', path: '$.fields.intake.phone.hidden', message: "Field 'intake.phone' is used by another field's condition and cannot be hidden." },
      { code: 'NoSectionsEnabled', path: '$.sections', message: 'At least one section must remain enabled.' },
    ])));
    await settle();
    q('save')!.click();
    await settle();
    expect(fieldRow('intake.phone').textContent).toContain('cannot be hidden');
    expect(q('general-errors')?.textContent).toContain('At least one section must remain enabled.');
    expect(q('unsaved')).toBeTruthy(); // the user's changes are kept
  });

  it('asks to reload on a 409 instead of overwriting', async () => {
    await render();
    check(q('section-enabled', sectionCard('extras')) as HTMLInputElement, false);
    api.updateConfiguration.and.returnValue(throwError(() => new ClinicalFormsError('conflict', 409, 'Changed by someone else.')));
    await settle();
    q('save')!.click();
    await settle();
    expect(q('conflict')).toBeTruthy();
    expect(toast.warning).toHaveBeenCalled();
    q('reload')!.click();
    await settle();
    expect(api.getAvailableForms).toHaveBeenCalledTimes(2);
    expect(q('conflict')).toBeNull();
  });

  it('explains forbidden responses', async () => {
    await render();
    check(q('section-enabled', sectionCard('extras')) as HTMLInputElement, false);
    api.updateConfiguration.and.returnValue(throwError(() => new ClinicalFormsError('forbidden', 403, 'Forbidden')));
    await settle();
    q('save')!.click();
    await settle();
    expect(q('general-errors')?.textContent).toContain('do not have permission');
  });

  it('prevents duplicate saves while a request is in flight', async () => {
    await render();
    check(q('section-enabled', sectionCard('extras')) as HTMLInputElement, false);
    const pending = new Subject<HospitalClinicalFormState>();
    api.updateConfiguration.and.returnValue(pending);
    await settle();
    q('save')!.click();
    fixture.componentInstance.save(); // a second trigger (e.g. double click) is ignored
    await settle();
    expect(api.updateConfiguration).toHaveBeenCalledTimes(1);
    expect((q('save') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('reloads the base definition when another published version is chosen', async () => {
    await render();
    const select = q('version') as HTMLSelectElement;
    select.value = 'v-2';
    select.dispatchEvent(new Event('change'));
    await settle();
    expect(api.previewConfiguration).toHaveBeenCalledWith('t-1', { templateVersionId: 'v-2', configurationJson: null });
    expect(fixture.componentInstance.dirty()).toBeTrue();
  });

  it('warns before leaving with unsaved changes', async () => {
    await render();
    const component = fixture.componentInstance;
    const guard = () => TestBed.runInInjectionContext(() => unsavedChangesGuard(component, {} as never, {} as never, {} as never));
    expect(guard()).toBeTrue();

    check(q('section-enabled', sectionCard('extras')) as HTMLInputElement, false);
    await settle();
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    expect(guard()).toBeFalse();
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('requires the form to be enabled first', async () => {
    await render([form(null)]);
    expect(q('load-error')?.textContent).toContain('Enable this form');
  });
});
