import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicalFormVersionSummary, TemplateVersionStatus } from '../../../../doctor/modules/clinical-forms/models/clinical-forms.models';
import { ClinicalFormsError } from '../../../../doctor/modules/clinical-forms/services/clinical-forms-error';
import { FormBuilderApiService } from '../../form-builder-api.service';
import { FormTemplateDetail } from '../../form-builder.models';

/**
 * One global template: name/description, active switch and its versions (route:
 * /superadmin/clinical-forms/:templateId). New versions start as a copy of a chosen version.
 */
@Component({
  selector: 'app-form-template-detail',
  standalone: false,
  templateUrl: './form-template-detail.html',
})
export class FormTemplateDetailPage implements OnInit {
  private readonly api = inject(FormBuilderApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly Status = TemplateVersionStatus;
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly template = signal<FormTemplateDetail | null>(null);
  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly message = signal<string | null>((history.state?.message as string) ?? null);

  editing = false;
  formName = '';
  description = '';
  copyFrom = '';
  newLabel = '';

  ngOnInit(): void {
    this.load();
  }

  private get id(): string {
    return this.route.snapshot.paramMap.get('templateId')!;
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getTemplate(this.id).subscribe({
      next: (t) => {
        this.set(t);
        this.loading.set(false);
      },
      error: (e: ClinicalFormsError) => {
        this.loadError.set(e.message);
        this.loading.set(false);
      },
    });
  }

  private set(t: FormTemplateDetail): void {
    this.template.set(t);
    this.copyFrom = this.latestPublished()?.id ?? t.versions[0]?.id ?? '';
  }

  draft(): ClinicalFormVersionSummary | undefined {
    return this.template()?.versions.find((v) => v.status === TemplateVersionStatus.Draft);
  }

  latestPublished(): ClinicalFormVersionSummary | undefined {
    return this.template()?.versions.filter((v) => v.status === TemplateVersionStatus.Published).sort((a, b) => b.versionNumber - a.versionNumber)[0];
  }

  startEdit(): void {
    const t = this.template()!;
    this.formName = t.formName;
    this.description = t.description ?? '';
    this.editing = true;
  }

  saveDetails(): void {
    this.run(this.api.updateTemplate(this.id, { formName: this.formName.trim(), description: this.description.trim() || null }), 'Details saved.', () => (this.editing = false));
  }

  setActive(active: boolean): void {
    if (!active && !window.confirm('Deactivate this form? Hospitals will no longer be able to start it. Existing records are kept.')) return;
    this.run(this.api.setTemplateStatus(this.id, active), active ? 'Form activated.' : 'Form deactivated.');
  }

  createVersion(): void {
    this.busy.set(true);
    this.actionError.set(null);
    this.api.createDraftVersion(this.id, { copyFromVersionId: this.copyFrom || null, versionLabel: this.newLabel.trim() || null }).subscribe({
      next: (v) => {
        this.busy.set(false);
        this.router.navigate(['/superadmin/clinical-forms', this.id, 'versions', v.id]);
      },
      error: (e: ClinicalFormsError) => {
        this.busy.set(false);
        this.actionError.set(e.message);
      },
    });
  }

  archive(v: ClinicalFormVersionSummary): void {
    if (!window.confirm(`Archive version ${v.versionNumber}? It stays readable for records filled on it, but can no longer be chosen.`)) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.api.archiveVersion(v.id, v.rowVersion).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set(`Version ${v.versionNumber} archived.`);
        this.load();
      },
      error: (e: ClinicalFormsError) => {
        this.busy.set(false);
        this.actionError.set(e.message);
      },
    });
  }

  private run(request: ReturnType<FormBuilderApiService['getTemplate']>, done: string, after?: () => void): void {
    this.busy.set(true);
    this.actionError.set(null);
    request.subscribe({
      next: (t) => {
        this.busy.set(false);
        this.set(t);
        this.message.set(done);
        after?.();
      },
      error: (e: ClinicalFormsError) => {
        this.busy.set(false);
        this.actionError.set(e.errors?.length ? e.errors.map((x) => x.message).join(' ') : e.message);
      },
    });
  }
}
