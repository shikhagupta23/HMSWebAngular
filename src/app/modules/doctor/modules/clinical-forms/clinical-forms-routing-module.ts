import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClinicalFormsHome } from './pages/clinical-forms-home/clinical-forms-home';
import { ClinicalFormPreview } from './pages/clinical-form-preview/clinical-form-preview';
import { ClinicalFormSubmission } from './pages/clinical-form-submission/clinical-form-submission';
import { PatientClinicalForms } from './pages/patient-clinical-forms/patient-clinical-forms';
import { ClinicalFormsConfiguration } from './pages/clinical-forms-configuration/clinical-forms-configuration';
import { ClinicalFormConfigurationEditor } from './pages/clinical-form-configuration-editor/clinical-form-configuration-editor';
import { clinicalFormsPermissionGuard, unsavedChangesGuard } from './guards/clinical-forms.guard';

const routes: Routes = [
  { path: '', component: ClinicalFormsHome },
  { path: 'forms/:templateId/preview', component: ClinicalFormPreview },
  { path: 'patients/:patientId', component: PatientClinicalForms },
  // Hospital Admin configuration (ManageHospitalTemplates); the server authorizes every call as well.
  { path: 'configuration', component: ClinicalFormsConfiguration, canActivate: [clinicalFormsPermissionGuard('ManageHospitalTemplates')] },
  {
    path: 'configuration/:templateId',
    component: ClinicalFormConfigurationEditor,
    canActivate: [clinicalFormsPermissionGuard('ManageHospitalTemplates')],
    canDeactivate: [unsavedChangesGuard],
  },
  { path: 'submissions/:submissionId', component: ClinicalFormSubmission },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClinicalFormsRoutingModule {}
