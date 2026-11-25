import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ClinicalFormRendererModule } from '../../doctor/modules/clinical-forms/renderer/clinical-form-renderer-module';
import { unsavedChangesGuard } from '../../doctor/modules/clinical-forms/guards/clinical-forms.guard';
import { FormTemplates } from './pages/form-templates/form-templates';
import { FormTemplateDetailPage } from './pages/form-template-detail/form-template-detail';
import { FormVersionBuilder } from './pages/form-version-builder/form-version-builder';
import { FieldEditor } from './components/field-editor/field-editor';
import { OptionsEditor } from './components/options-editor/options-editor';
import { ConditionEditor } from './components/condition-editor/condition-editor';

const routes: Routes = [
  { path: '', component: FormTemplates },
  { path: ':templateId', component: FormTemplateDetailPage },
  { path: ':templateId/versions/:versionId', component: FormVersionBuilder, canDeactivate: [unsavedChangesGuard] },
];

/**
 * SuperAdmin Form Builder (lazy, /superadmin/clinical-forms): create and change global clinical form
 * templates without a developer. The server (ManageGlobalTemplates, SuperAdmin only) authorizes and
 * validates every call; the preview reuses the same renderer hospitals use.
 */
@NgModule({
  declarations: [FormTemplates, FormTemplateDetailPage, FormVersionBuilder, FieldEditor, OptionsEditor, ConditionEditor],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), ClinicalFormRendererModule],
})
export class FormBuilderModule {}
