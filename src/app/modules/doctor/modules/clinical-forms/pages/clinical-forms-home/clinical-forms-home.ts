import { Component, OnInit, inject, signal } from '@angular/core';
import { ClinicalFormsApiService } from '../../services/clinical-forms-api-service';
import { ClinicalFormsAccessService } from '../../services/clinical-forms-access-service';
import { EnabledClinicalForm } from '../../models/clinical-forms.models';
import { toClinicalFormsError } from '../../services/clinical-forms-error';

/** Landing page: the clinical forms enabled for the user's hospital. */
@Component({
  selector: 'app-clinical-forms-home',
  standalone: false,
  templateUrl: './clinical-forms-home.html',
})
export class ClinicalFormsHome implements OnInit {
  private readonly api = inject(ClinicalFormsApiService);
  readonly access = inject(ClinicalFormsAccessService);

  readonly forms = signal<EnabledClinicalForm[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getEnabledForms().subscribe({
      next: (forms) => {
        this.forms.set(forms ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(toClinicalFormsError(error).message);
        this.loading.set(false);
      },
    });
  }
}
