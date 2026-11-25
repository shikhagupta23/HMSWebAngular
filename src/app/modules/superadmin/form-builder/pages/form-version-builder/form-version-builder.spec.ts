import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FormBuilderModule } from '../../form-builder-module';
import { FormVersionBuilder } from './form-version-builder';
import { FormBuilderApiService } from '../../form-builder-api.service';
import { FormTemplateDetail, FormVersionDetail } from '../../form-builder.models';
import { FormDefinition, TemplateVersionStatus } from '../../../../doctor/modules/clinical-forms/models/clinical-forms.models';

describe('FormVersionBuilder (SuperAdmin form builder)', () => {
  let fixture: ComponentFixture<FormVersionBuilder>;
  let api: jasmine.SpyObj<FormBuilderApiService>;

  const definition = (versionNumber: number): FormDefinition => ({
    schemaVersion: 1,
    form: { formKey: 'skin-intake', formName: 'Skin Intake', specialty: 'dermatology', versionNumber },
    sections: [
      { key: 'history', title: 'History', order: 1, editableBy: ['Receptionist', 'Doctor'], fields: [{ key: 'complaint', type: 'textarea', label: 'Complaint' }] },
    ],
  });

  const version = (id: string, number: number, status: TemplateVersionStatus, extra: Partial<FormVersionDetail> = {}): FormVersionDetail => ({
    id, templateId: 't-1', versionNumber: number, status, schemaVersion: 1, createdAt: '2026-11-25T00:00:00Z', rowVersion: `rv-${id}`,
    definitionJson: JSON.stringify(definition(number)), isPublishable: true, validationIssues: [], ...extra,
  });

  const template: FormTemplateDetail = {
    id: 't-1', formKey: 'skin-intake', formName: 'Skin Intake', specialty: 'dermatology', isActive: true, hasDraft: true, createdAt: '2026-11-25T00:00:00Z',
    versions: [
      { id: 'v-2', templateId: 't-1', versionNumber: 2, status: TemplateVersionStatus.Draft, schemaVersion: 1, createdAt: '', rowVersion: 'rv-v-2' },
      { id: 'v-1', templateId: 't-1', versionNumber: 1, status: TemplateVersionStatus.Published, schemaVersion: 1, createdAt: '', rowVersion: 'rv-v-1' },
    ],
  };

  async function open(versionId: string) {
    api = jasmine.createSpyObj<FormBuilderApiService>('FormBuilderApiService', ['getTemplate', 'getVersion', 'updateDraftVersion', 'publishVersion', 'deleteDraftVersion']);
    api.getTemplate.and.returnValue(of(template));
    api.getVersion.and.callFake((id: string) => of(id === 'v-1' ? version('v-1', 1, TemplateVersionStatus.Published) : version('v-2', 2, TemplateVersionStatus.Draft)));

    await TestBed.configureTestingModule({
      imports: [FormBuilderModule],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: FormBuilderApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ templateId: 't-1', versionId }) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FormVersionBuilder);
    await settle();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (sel: string) => el().querySelector(sel) as HTMLElement;
  const qa = (sel: string) => Array.from(el().querySelectorAll(sel)) as HTMLElement[];
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  function type(input: HTMLElement, value: string, event = 'input') {
    (input as HTMLInputElement).value = value;
    input.dispatchEvent(new Event(event));
  }

  it('adds a field visually and saves the draft with screen order and the row version', async () => {
    await open('v-2');
    expect(q('[data-test="status"]').textContent).toContain('Draft');
    expect(qa('[data-test="field-row"]').length).toBe(1);

    q('[data-test="add-field"]').click();
    await settle();
    (el().querySelector('[data-test="palette-type"][data-type="select"]') as HTMLElement).click();
    await settle();
    type(q('[data-test="field-label"]'), 'Skin type');
    await settle();
    expect(fixture.componentInstance.hasUnsavedChanges()).toBeTrue();
    expect(q('[data-test="unsaved"]')).toBeTruthy();

    api.updateDraftVersion.and.returnValue(of(version('v-2', 2, TemplateVersionStatus.Draft, { rowVersion: 'rv-new' })));
    q('[data-test="save"]').click();
    await settle();

    const [id, request] = api.updateDraftVersion.calls.mostRecent().args;
    expect(id).toBe('v-2');
    expect(request.rowVersion).toBe('rv-v-2');
    const sent = JSON.parse(request.definitionJson) as FormDefinition;
    const added = sent.sections[0].fields[1];
    expect(added).toEqual(jasmine.objectContaining({ key: 'skinType', type: 'select', label: 'Skin type', order: 2 }));
    expect(added.options!.length).toBe(2);
    expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
    expect(fixture.componentInstance.version()!.rowVersion).toBe('rv-new');
  });

  it('lists what blocks publishing and jumps to the field', async () => {
    await open('v-2');
    api.updateDraftVersion.and.returnValue(of(version('v-2', 2, TemplateVersionStatus.Draft, {
      isPublishable: false, validationIssues: [{ code: 'InvalidOptions', path: '$.sections[0].fields[0].options', message: 'At least one option is required.' }],
    })));
    q('[data-test="save"]').click();
    await settle();

    const issues = q('[data-test="issues"]');
    expect(issues.textContent).toContain('Section "History" › field "Complaint"');
    expect(issues.textContent).toContain('At least one option is required.');
    (issues.querySelector('a') as HTMLElement).click();
    await settle();
    expect(q('[data-test="field-editor"]')).toBeTruthy();

    spyOn(window, 'confirm').and.returnValue(true);
    q('[data-test="publish"]').click();
    await settle();
    expect(api.publishVersion).not.toHaveBeenCalled();
    expect(q('[data-test="action-error"]').textContent).toContain('cannot be published');
  });

  it('publishes after confirmation and returns to the form page', async () => {
    await open('v-2');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(window, 'confirm').and.returnValue(true);
    api.publishVersion.and.returnValue(of(version('v-2', 2, TemplateVersionStatus.Published)));

    q('[data-test="publish"]').click();
    await settle();

    expect(window.confirm).toHaveBeenCalledWith(jasmine.stringContaining('Every hospital using this form'));
    expect(api.publishVersion).toHaveBeenCalledWith('v-2', 'rv-v-2');
    expect(router.navigate).toHaveBeenCalledWith(['/superadmin/clinical-forms', 't-1'], jasmine.anything());
  });

  it('keeps keys used by the published version fixed', async () => {
    await open('v-2');
    (q('[data-test="field-toggle"]')).click();
    await settle();
    expect((q('[data-test="field-key"]') as HTMLInputElement).disabled).toBeTrue();

    // Renaming the label of a published field does not change its key.
    type(q('[data-test="field-label"]'), 'Main complaint');
    await settle();
    expect(fixture.componentInstance.definition!.sections[0].fields[0].key).toBe('complaint');
  });

  it('opens a published version read-only', async () => {
    await open('v-1');
    expect(q('[data-test="status"]').textContent).toContain('Published');
    expect(q('[data-test="save"]')).toBeNull();
    expect(q('[data-test="add-field"]')).toBeNull();
    (q('[data-test="field-toggle"]')).click();
    await settle();
    expect((q('[data-test="field-label"]') as HTMLInputElement).disabled).toBeTrue();
    expect(fixture.componentInstance.hasUnsavedChanges()).toBeFalse();
  });
});
