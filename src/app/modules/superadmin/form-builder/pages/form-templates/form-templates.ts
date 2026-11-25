import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ClinicalFormsError } from '../../../../doctor/modules/clinical-forms/services/clinical-forms-error';
import { FormBuilderApiService } from '../../form-builder-api.service';
import { FormTemplateSummary } from '../../form-builder.models';
import { KEBAB_PATTERN, toKebab } from '../../builder-utils';

/** SuperAdmin list of global clinical form templates, with "New form" (route: /superadmin/clinical-forms). */
@Component({
  selector: 'app-form-templates',
  standalone: false,
  templateUrl: './form-templates.html',
})
export class FormTemplates implements OnInit {
  private readonly api = inject(FormBuilderApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly templates = signal<FormTemplateSummary[]>([]);
  readonly search = signal('');
  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.templates().filter((t) => !term || `${t.formName} ${t.specialty} ${t.formKey}`.toLowerCase().includes(term));
  });

  // New form
  readonly creating = signal(false);
  readonly createBusy = signal(false);
  readonly createError = signal<string | null>(null);
  formName = '';
  formKey = '';
  specialty = '';
  description = '';
  private keyEdited = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getTemplates().subscribe({
      next: (list) => {
        this.templates.set(list);
        this.loading.set(false);
      },
      error: (e: ClinicalFormsError) => {
        this.loadError.set(e.message);
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.formName = this.formKey = this.specialty = this.description = '';
    this.keyEdited = false;
    this.createError.set(null);
    this.creating.set(true);
  }

  setName(name: string): void {
    this.formName = name;
    if (!this.keyEdited) this.formKey = toKebab(name);
  }

  setKey(key: string): void {
    this.keyEdited = true;
    this.formKey = key.trim();
  }

  keyValid(): boolean {
    return KEBAB_PATTERN.test(this.formKey);
  }

  specialtyValid(): boolean {
    return /^[a-z][a-z0-9-]{0,49}$/.test(this.specialty);
  }

  create(): void {
    if (!this.formName.trim() || !this.keyValid() || !this.specialtyValid()) return;
    this.createBusy.set(true);
    this.createError.set(null);
    this.api
      .createTemplate({ formName: this.formName.trim(), formKey: this.formKey, specialty: this.specialty, description: this.description.trim() || null })
      .subscribe({
        next: (created) => {
          this.createBusy.set(false);
          const draft = created.versions[0];
          this.router.navigate(draft ? ['/superadmin/clinical-forms', created.id, 'versions', draft.id] : ['/superadmin/clinical-forms', created.id]);
        },
        error: (e: ClinicalFormsError) => {
          this.createBusy.set(false);
          this.createError.set(e.errors?.length ? e.errors.map((x) => x.message).join(' ') : e.message);
        },
      });
  }
}
