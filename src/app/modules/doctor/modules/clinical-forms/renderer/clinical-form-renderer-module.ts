import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClinicalFormRenderer } from './clinical-form-renderer/clinical-form-renderer';
import { ClinicalFormField } from './clinical-form-field/clinical-form-field';
import { ClinicalFormConditionList } from './clinical-form-condition-list/clinical-form-condition-list';
import { ClinicalFormRepeater } from './clinical-form-repeater/clinical-form-repeater';
import { ClinicalFormAttachmentField } from './clinical-form-attachment-field/clinical-form-attachment-field';
import { ClinicalSignaturePad } from './clinical-signature-pad/clinical-signature-pad';

/**
 * Reusable dynamic clinical form renderer. Exported so any feature (e.g. the patient details page in
 * Phase 5) can import it without pulling in the Clinical Forms pages.
 */
@NgModule({
  declarations: [ClinicalFormRenderer, ClinicalFormField, ClinicalFormConditionList, ClinicalFormRepeater, ClinicalFormAttachmentField, ClinicalSignaturePad],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [ClinicalFormRenderer, ClinicalSignaturePad],
})
export class ClinicalFormRendererModule {}
