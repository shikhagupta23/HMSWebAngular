import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { ClinicalFormsModule } from '../../clinical-forms-module';
import { ClinicalFormsConfiguration } from './clinical-forms-configuration';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsError } from '../../services/clinical-forms-error';
import { ToastService } from '../../../../../../shared/services/toast-service';
import { testDefinition } from '../../testing/test-definition';
import {
  EnabledClinicalForm,
  HospitalAvailableClinicalForm,
  HospitalClinicalFormPreview,
  HospitalClinicalFormState,
  TemplateVersionStatus,
} from '../../models/clinical-forms.models';

describe('ClinicalFormsConfiguration (Hospital Admin dashboard)', () => {
  let fixture: ComponentFixture<ClinicalFormsConfiguration>;
  let api: jasmine.SpyObj<ClinicalFormsApiService>;
  let toast: jasmine.SpyObj<ToastService>;

  const version = (n: number) => ({
    id: `v-${n}`, templateId: 't-1', versionNumber: n, status: TemplateVersionStatus.Published, schemaVersion: 1, createdAt: '2026-11-01T00:00:00Z', rowVersion: 'r',
  });
  const state = (extra: Partial<HospitalClinicalFormState> = {}): HospitalClinicalFormState => ({
    templateId: 't-1', isEnabled: true, activeTemplateVersionId: 'v-1', activeVersionNumber: 1, configurationJson: null,
    enabledAt: '2026-11-20T10:00:00Z', disabledAt: null, rowVersion: 'AAAAAAAAB9E=', ...extra,
  });
  const dental = (configuration: HospitalClinicalFormState | null = state()): HospitalAvailableClinicalForm => ({
    templateId: 't-1', formKey: 'dental-intake', formName: 'Dental Patient Intake', specialty: 'dental', description: 'Standard intake',
    templateIsActive: true, publishedVersions: [version(1), version(2)], configuration,
  });
  const physio: HospitalAvailableClinicalForm = {
    templateId: 't-2', formKey: 'physio', formName: 'Physiotherapy Assessment', specialty: 'physiotherapy', templateIsActive: true,
    publishedVersions: [{ ...version(1), id: 'p-1', templateId: 't-2' }], configuration: null,
  };
  const enabledDental: EnabledClinicalForm = { templateId: 't-1', formKey: 'dental-intake', formName: 'Dental Patient Intake', specialty: 'dental', templateVersionId: 'v-1', versionNumber: 1 };

  async function render(available: HospitalAvailableClinicalForm[] | 'pending' | ClinicalFormsError = [dental(), physio], enabled: EnabledClinicalForm[] = [enabledDental]) {
    api = jasmine.createSpyObj<ClinicalFormsApiService>('ClinicalFormsApiService', ['getAvailableForms', 'getEnabledForms', 'enableForm', 'disableForm', 'previewConfiguration']);
    if (available === 'pending') api.getAvailableForms.and.returnValue(new Subject<HospitalAvailableClinicalForm[]>());
    else if (available instanceof ClinicalFormsError) api.getAvailableForms.and.returnValue(throwError(() => available));
    else api.getAvailableForms.and.returnValue(of(available));
    api.getEnabledForms.and.returnValue(of(enabled));
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [ClinicalFormsModule],
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: ClinicalFormsApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    }).compileComponents();
    fixture = TestBed.createComponent(ClinicalFormsConfiguration);
    await settle();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (test: string, root: ParentNode = el()) => root.querySelector<HTMLElement>(`[data-test="${test}"]`);
  const row = (formKey: string) => el().querySelector<HTMLElement>(`[data-template="${formKey}"]`)!;
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows a loading state, then available and enabled forms', async () => {
    await render('pending');
    expect(q('loading')).toBeTruthy();

    fixture.destroy();
    TestBed.resetTestingModule();
    await render();
    expect(api.getAvailableForms).toHaveBeenCalledTimes(1);
    expect(api.getEnabledForms).toHaveBeenCalledTimes(1);
    expect(el().querySelectorAll('[data-test="form-row"]').length).toBe(2);
    expect(q('status', row('dental-intake'))?.textContent).toContain('Enabled');
    expect(q('status', row('physio'))?.textContent).toContain('Not enabled');
    expect(q('newer-version', row('dental-intake'))?.textContent).toContain('v2 available');
    expect(row('dental-intake').textContent).toContain('Standard intake');
    expect(q('configure', row('dental-intake'))).toBeTruthy();
    expect(q('configure', row('physio'))).toBeNull();      // configure only after enabling
    expect(q('enable', row('dental-intake'))).toBeNull();
  });

  it('shows an empty state when no templates are published', async () => {
    await render([], []);
    expect(q('empty')).toBeTruthy();
  });

  it('filters by search text', async () => {
    await render();
    const search = el().querySelector<HTMLInputElement>('[data-test="search"]')!;
    search.value = 'physio';
    search.dispatchEvent(new Event('input'));
    await settle();
    expect(el().querySelectorAll('[data-test="form-row"]').length).toBe(1);
    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    await settle();
    expect(q('no-match')).toBeTruthy();
  });

  it('enables a form with exactly the backend contract (no hospital id) and refreshes', async () => {
    await render();
    const response = new Subject<HospitalClinicalFormState>();
    api.enableForm.and.returnValue(response);

    q('enable', row('physio'))!.click();
    await settle();
    q('enable', row('physio'))!.click(); // second click while pending is ignored
    await settle();

    expect(api.enableForm).toHaveBeenCalledTimes(1);
    const body = api.enableForm.calls.mostRecent().args[0];
    expect(body).toEqual({ templateId: 't-2' });
    expect(JSON.stringify(body).toLowerCase()).not.toContain('hospital');
    expect((q('enable', row('physio')) as HTMLButtonElement).disabled).toBeTrue();

    response.next(state({ templateId: 't-2' }));
    response.complete();
    await settle();
    expect(toast.success).toHaveBeenCalled();
    expect(api.getAvailableForms).toHaveBeenCalledTimes(2); // refreshed
  });

  it('disables a form only after confirmation and explains the consequences', async () => {
    await render();
    q('disable', row('dental-intake'))!.click();
    await settle();
    expect(api.disableForm).not.toHaveBeenCalled();
    expect(q('disable-confirm')?.textContent).toContain('Existing drafts and submitted');

    api.disableForm.and.returnValue(of(state({ isEnabled: false })));
    q('confirm-disable')!.click();
    await settle();
    expect(api.disableForm).toHaveBeenCalledWith('t-1');
    expect(api.getAvailableForms).toHaveBeenCalledTimes(2);
  });

  it('shows backend validation errors next to the form', async () => {
    await render();
    api.enableForm.and.returnValue(throwError(() => new ClinicalFormsError('validation', 400, 'Invalid',
      [{ code: 'TemplateInactive', path: 'templateId', message: 'The template is not active.' }])));
    q('enable', row('physio'))!.click();
    await settle();
    expect(q('action-error')?.textContent).toContain('The template is not active.');
  });

  it('explains forbidden responses', async () => {
    await render(new ClinicalFormsError('forbidden', 403, 'Forbidden'));
    expect(q('load-error')?.textContent).toContain('do not have permission');

    fixture.destroy();
    TestBed.resetTestingModule();
    await render();
    api.disableForm.and.returnValue(throwError(() => new ClinicalFormsError('forbidden', 403, 'Forbidden')));
    q('disable', row('dental-intake'))!.click();
    await settle();
    q('confirm-disable')!.click();
    await settle();
    expect(q('action-error')?.textContent).toContain('do not have permission');
    expect(toast.error).toHaveBeenCalled();
  });

  it('previews the saved configuration read-only without creating anything', async () => {
    const overlay = '{"schemaVersion":1,"fields":{"intake.phone":{"hidden":true}}}';
    await render([dental(state({ configurationJson: overlay })), physio]);
    const preview: HospitalClinicalFormPreview = { templateVersionId: 'v-1', versionNumber: 1, definition: testDefinition() };
    api.previewConfiguration.and.returnValue(of(preview));

    q('preview', row('dental-intake'))!.click();
    await settle();

    expect(api.previewConfiguration).toHaveBeenCalledWith('t-1', { templateVersionId: 'v-1', configurationJson: overlay });
    const panel = q('preview-panel')!;
    expect(panel.textContent).toContain('saved hospital configuration');
    expect(panel.textContent).toContain('nothing is saved');
    const inputs = Array.from(panel.querySelectorAll<HTMLInputElement>('input, textarea, select'));
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.every((i) => i.disabled)).toBeTrue();
  });

  it('previews a not-yet-enabled form as published', async () => {
    await render();
    api.previewConfiguration.and.returnValue(of({ templateVersionId: 'p-1', versionNumber: 1, definition: testDefinition() }));
    q('preview', row('physio'))!.click();
    await settle();
    expect(api.previewConfiguration).toHaveBeenCalledWith('t-2', { templateVersionId: null, configurationJson: null });
    expect(q('preview-panel')?.textContent).toContain('As published');
  });
});
