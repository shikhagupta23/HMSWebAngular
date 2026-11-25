import {
  ClinicalFormValidationError,
  ClinicalFormVersionSummary,
} from '../../doctor/modules/clinical-forms/models/clinical-forms.models';

/** ClinicalFormTemplateSummaryDto (GET ClinicalFormTemplateAPI/getTemplates). */
export interface FormTemplateSummary {
  id: string;
  formKey: string;
  formName: string;
  specialty: string;
  description?: string | null;
  isActive: boolean;
  latestPublishedVersionNumber?: number | null;
  hasDraft: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/** ClinicalFormTemplateDetailDto: the template with all its versions (newest first). */
export interface FormTemplateDetail extends FormTemplateSummary {
  versions: ClinicalFormVersionSummary[];
}

/** ClinicalFormVersionDetailDto: one version with its definition JSON and publish blockers. */
export interface FormVersionDetail extends ClinicalFormVersionSummary {
  definitionJson: string;
  definitionHash?: string | null;
  isPublishable: boolean;
  validationIssues: ClinicalFormValidationError[];
}

export interface CreateFormTemplateRequest {
  formKey: string;
  formName: string;
  specialty: string;
  description?: string | null;
}

export interface UpdateFormTemplateRequest {
  formName: string;
  description?: string | null;
}

export interface CreateDraftVersionRequest {
  versionLabel?: string | null;
  /** Copy this version's definition; by default the newest published version is copied. */
  copyFromVersionId?: string | null;
}

export interface UpdateDraftVersionRequest {
  definitionJson: string;
  versionLabel?: string | null;
  rowVersion: string;
}
