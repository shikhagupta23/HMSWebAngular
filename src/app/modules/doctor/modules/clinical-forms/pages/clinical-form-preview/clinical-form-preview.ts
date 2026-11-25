import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsError, toClinicalFormsError } from '../../services/clinical-forms-error';
import { ClinicalFormModel, FormIssue, ValidationMode } from '../../engine/clinical-form-model';
import { EffectiveClinicalForm } from '../../models/clinical-forms.models';

/**
 * Renders the hospital's effective form (published version + hospital configuration) without saving
 * anything. Lets staff and administrators see exactly what will be filled in, with their own edit rights.
 */
@Component({
  selector: 'app-clinical-form-preview',
  standalone: false,
  templateUrl: './clinical-form-preview.html',
})
export class ClinicalFormPreview implements OnInit {
  private readonly api = inject(ClinicalFormsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly form = signal<EffectiveClinicalForm | null>(null);
  readonly loading = signal(true);
  readonly error = signal<ClinicalFormsError | null>(null);
  readonly issues = signal<FormIssue[] | null>(null);
  private model: ClinicalFormModel | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const templateId = this.route.snapshot.paramMap.get('templateId') ?? '';
    this.loading.set(true);
    this.error.set(null);
    this.api.getEffectiveForm(templateId).subscribe({
      next: (form) => {
        this.form.set(form);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(toClinicalFormsError(error));
        this.loading.set(false);
      },
    });
  }

  onModelReady(model: ClinicalFormModel): void {
    this.model = model;
    this.issues.set(null);
  }

  check(mode: ValidationMode): void {
    this.issues.set(this.model ? this.model.validate(mode) : []);
  }
}
