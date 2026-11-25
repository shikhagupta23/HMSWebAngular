import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicalFormsRoutingModule } from './clinical-forms-routing-module';
import { ClinicalFormRendererModule } from './renderer/clinical-form-renderer-module';
import { ClinicalFormsHome } from './pages/clinical-forms-home/clinical-forms-home';
import { ClinicalFormPreview } from './pages/clinical-form-preview/clinical-form-preview';
import { ClinicalFormSubmission } from './pages/clinical-form-submission/clinical-form-submission';
import { PatientClinicalForms } from './pages/patient-clinical-forms/patient-clinical-forms';
import { ClinicalFormsConfiguration } from './pages/clinical-forms-configuration/clinical-forms-configuration';
import { ClinicalFormConfigurationEditor } from './pages/clinical-form-configuration-editor/clinical-form-configuration-editor';

/** Lazy-loaded Clinical Forms feature (route: /clinical-forms, guarded by clinicalFormsGuard). */
@NgModule({
  declarations: [ClinicalFormsHome, ClinicalFormPreview, ClinicalFormSubmission, PatientClinicalForms, ClinicalFormsConfiguration, ClinicalFormConfigurationEditor],
  imports: [CommonModule, FormsModule, ClinicalFormsRoutingModule, ClinicalFormRendererModule],
})
export class ClinicalFormsModule {}
