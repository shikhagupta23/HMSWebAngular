/**
 * Clinical Forms client models. They mirror the backend DTOs and the versioned form-definition JSON
 * (camelCase, as serialized by the API). Nothing here is specific to any one specialty.
 */

// ------------------------------------------------------------------ permissions & access

export type ClinicalFormPermission =
  | 'ViewPatientForms'
  | 'FillPatientForms'
  | 'ClinicalEdit'
  | 'ManageHospitalTemplates'
  | 'ManageGlobalTemplates'
  | 'VoidSubmission';

/** Server-verified capabilities of the current user (GET ClinicalFormAccessAPI/getAccess). */
export interface ClinicalFormAccess {
  isEnabled: boolean;
  permissions: ClinicalFormPermission[];
}

// ------------------------------------------------------------------ API envelopes

export interface ClinicalFormValidationError {
  code: string;
  path: string;
  message: string;
}

export interface ClinicalFormApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: ClinicalFormValidationError[];
}

export interface PagedResponse<T> {
  isSuccess: boolean;
  message: string;
  dataList: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ------------------------------------------------------------------ form definition

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone'
  | 'select' | 'radio' | 'checkboxGroup' | 'yesNoUnknown' | 'boolean'
  | 'conditionList' | 'repeater' | 'patientBinding' | 'consent' | 'attachmentList';

export interface FieldOption {
  value: string;
  label: string;
}

export type ConditionOperator = 'eq' | 'neq' | 'in' | 'any' | 'notEmpty' | 'lt' | 'gt';

export interface VisibilityCondition {
  /** 'answers' (default) or 'patient'. */
  source?: 'answers' | 'patient';
  /** 'fieldKey', 'sectionKey.fieldKey', '@item.key', or a patient attribute (gender, ageYears). */
  field: string;
  op: ConditionOperator;
  value?: unknown;
}

export interface FieldValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  minDate?: string;
  maxDate?: string;
}

export interface ConditionItem {
  key: string;
  label: string;
  alert?: boolean;
  sensitive?: boolean;
  visibleWhen?: VisibilityCondition;
}

export interface FieldDefinition {
  key: string;
  type: FieldType;
  label: string;
  order?: number;
  required?: boolean;
  locked?: boolean;
  alert?: boolean;
  sensitive?: boolean;
  helpText?: string;
  placeholder?: string;
  options?: FieldOption[];
  optionSet?: string;
  optionsFrom?: string;
  exclusiveOption?: string;
  validation?: FieldValidationRules;
  visibleWhen?: VisibilityCondition;
  requiredWhen?: VisibilityCondition;
  binding?: string;
  mode?: string;
  items?: ConditionItem[];
  itemOptionSet?: string;
  itemFields?: FieldDefinition[];
  columns?: FieldDefinition[];
  maxRows?: number;
  consentType?: string;
  allowedTypes?: string[];
}

export interface SectionDefinition {
  key: string;
  title: string;
  order?: number;
  required?: boolean;
  editableBy?: string[];
  clinical?: boolean;
  fields: FieldDefinition[];
}

export interface ConsentDefinition {
  consentType: string;
  consentVersion: string;
  text: string;
  required?: boolean;
  allowGuardian?: boolean;
  requireSignature?: boolean;
  witnessOptional?: boolean;
}

export interface FormDefinition {
  schemaVersion: number;
  form: { formKey: string; formName: string; specialty: string; versionNumber: number };
  optionSets?: Record<string, FieldOption[]>;
  sections: SectionDefinition[];
  consents?: ConsentDefinition[];
}

/** Answers keyed by section key, then field key. */
export type FormAnswers = Record<string, Record<string, unknown>>;

/** Patient attributes the form may display (patientBinding) or read in conditions. */
export interface PatientFormContext {
  gender?: string | null;
  ageYears?: number | null;
  /** Values for patientBinding fields, keyed by binding (e.g. 'patient.fullName'). */
  bindings?: Record<string, string | number | null | undefined>;
}

// ------------------------------------------------------------------ hospital forms

export interface EffectiveSectionAccess {
  key: string;
  title: string;
  clinical: boolean;
  canEdit: boolean;
}

export interface EnabledClinicalForm {
  templateId: string;
  formKey: string;
  formName: string;
  specialty: string;
  templateVersionId: string;
  versionNumber: number;
}

export interface EffectiveClinicalForm {
  templateId: string;
  formKey: string;
  formName: string;
  specialty: string;
  templateVersionId: string;
  versionNumber: number;
  definitionHash?: string | null;
  configuration?: unknown;
  definition: FormDefinition;
  permissions: ClinicalFormPermission[];
  sections: EffectiveSectionAccess[];
}

// ------------------------------------------------------------------ submissions

/** Server enum ClinicalFormSubmissionStatus (serialized as a number). */
export enum SubmissionStatus {
  Draft = 0,
  Submitted = 1,
  Amended = 2,
  Voided = 3,
}

export interface ClinicalFormSubmissionSummary {
  id: string;
  patientId: string;
  templateId: string;
  formKey: string;
  formName: string;
  templateVersionId: string;
  versionNumber: number;
  appointmentId?: string | null;
  doctorId?: string | null;
  status: SubmissionStatus;
  currentRevisionNumber: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  submittedAt?: string | null;
  submittedBy?: string | null;
  voidedAt?: string | null;
}

export interface ClinicalFormSubmissionDetail extends ClinicalFormSubmissionSummary {
  answers: FormAnswers;
  patientSnapshot?: Record<string, unknown> | null;
  definition: FormDefinition;
  definitionHash?: string | null;
  voidReason?: string | null;
  rowVersion: string;
  permissions: ClinicalFormPermission[];
  sections: EffectiveSectionAccess[];
}

export interface ClinicalFormSubmissionCheck {
  canSubmit: boolean;
  issues: ClinicalFormValidationError[];
}

export interface CreateSubmissionRequest {
  templateId: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  answers?: FormAnswers | null;
}

export interface ClinicalFormRevisionSummary {
  revisionNumber: number;
  changeType: number;
  changeReason?: string | null;
  changedBy: string;
  changedAt: string;
  answersHash: string;
}

export interface ClinicalFormRevisionDetail extends ClinicalFormRevisionSummary {
  answers: FormAnswers;
  patientSnapshot?: Record<string, unknown> | null;
}

// ------------------------------------------------------------------ consent

export enum ConsentSignerType {
  Patient = 1,
  Guardian = 2,
}

export interface RecordConsentRequest {
  consentType: string;
  isAccepted: boolean;
  signerType?: ConsentSignerType;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  witnessName?: string | null;
  /** Signature drawn by the signer (PNG data URL); required to accept wording that requires a signature. */
  signatureImage?: string | null;
}

export interface ClinicalFormConsentRecord {
  id: string;
  consentType: string;
  consentVersion: string;
  consentText: string;
  consentTextHash: string;
  isAccepted: boolean;
  signerType: ConsentSignerType;
  patientNameSnapshot: string;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  witnessName?: string | null;
  signatureAttachmentId?: string | null;
  hasSignature?: boolean;
  respondedAt: string;
  capturedBy: string;
  supersedesConsentId?: string | null;
  isCurrent: boolean;
}

export interface ClinicalFormConsentStatus {
  consentType: string;
  consentVersion: string;
  consentText: string;
  required: boolean;
  /** Accepting requires a drawn signature (from the pinned wording). */
  requiresSignature?: boolean;
  allowGuardian?: boolean;
  /** Accepted (and signed when a signature is required) with the applicable wording version. */
  satisfied: boolean;
  currentConsentId?: string | null;
}

export interface ClinicalFormConsents {
  submissionId: string;
  status: ClinicalFormConsentStatus[];
  records: ClinicalFormConsentRecord[];
}

// ------------------------------------------------------------------ attachments

/** Server enum ClinicalAttachmentType (serialized as a number). */
export enum ClinicalAttachmentType {
  Iopa = 1,
  Opg = 2,
  Cbct = 3,
  ClinicalPhoto = 4,
  Signature = 5,
  WitnessSignature = 6,
  Other = 99,
}

export const ATTACHMENT_TYPE_LABELS: Record<number, string> = {
  [ClinicalAttachmentType.Iopa]: 'IOPA radiograph',
  [ClinicalAttachmentType.Opg]: 'OPG radiograph',
  [ClinicalAttachmentType.Cbct]: 'CBCT scan',
  [ClinicalAttachmentType.ClinicalPhoto]: 'Clinical photo',
  [ClinicalAttachmentType.Signature]: 'Signature',
  [ClinicalAttachmentType.WitnessSignature]: 'Witness signature',
  [ClinicalAttachmentType.Other]: 'Other document',
};

/** Types a user may upload (signatures are captured with the consent). */
export const UPLOADABLE_ATTACHMENT_TYPES: ClinicalAttachmentType[] = [
  ClinicalAttachmentType.Iopa, ClinicalAttachmentType.Opg, ClinicalAttachmentType.Cbct, ClinicalAttachmentType.ClinicalPhoto, ClinicalAttachmentType.Other,
];

/** V1 allowlist (the server re-validates extension, MIME type and content). */
export const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Attachment metadata: never a URL or storage location; files are streamed through the authorized endpoint. */
export interface ClinicalFormAttachment {
  id: string;
  submissionId: string;
  attachmentType: ClinicalAttachmentType;
  fileName: string;
  contentType: string;
  fileSize: number;
  sha256: string;
  description?: string | null;
  uploadedBy: string;
  uploadedAt: string;
  isReferenced: boolean;
  isSignature: boolean;
}

export interface UploadAttachmentRequest {
  file: File;
  attachmentType: ClinicalAttachmentType;
  description?: string | null;
  /** Upload for an attachmentList field (section + field). */
  sectionKey?: string | null;
  fieldKey?: string | null;
}

/** Upload progress (0–100) followed by the stored attachment. */
export type AttachmentUploadEvent =
  | { kind: 'progress'; percent: number }
  | { kind: 'done'; attachment: ClinicalFormAttachment };

/** A downloaded file (attachment or PDF) held in memory as a Blob. */
export interface DownloadedFile {
  blob: Blob;
  fileName: string;
  contentType: string;
}

// ------------------------------------------------------------------ hospital configuration (Admin)

/** Server enum TemplateVersionStatus (serialized as a number). */
export enum TemplateVersionStatus {
  Draft = 0,
  Published = 1,
  Archived = 2,
}

/** ClinicalFormVersionSummaryDto (published versions only for hospitals). */
export interface ClinicalFormVersionSummary {
  id: string;
  templateId: string;
  versionNumber: number;
  versionLabel?: string | null;
  status: TemplateVersionStatus;
  schemaVersion: number;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  rowVersion: string;
}

/** HospitalClinicalFormStateDto: this hospital's configuration of one template. */
export interface HospitalClinicalFormState {
  templateId: string;
  isEnabled: boolean;
  activeTemplateVersionId: string;
  activeVersionNumber: number;
  configurationJson?: string | null;
  enabledAt?: string | null;
  disabledAt?: string | null;
  rowVersion: string;
}

/** HospitalAvailableClinicalFormDto (GET getAvailableForms). */
export interface HospitalAvailableClinicalForm {
  templateId: string;
  formKey: string;
  formName: string;
  specialty: string;
  description?: string | null;
  templateIsActive: boolean;
  publishedVersions: ClinicalFormVersionSummary[];
  /** Null until the hospital enables the form for the first time. */
  configuration?: HospitalClinicalFormState | null;
}

/** EnableHospitalClinicalFormDto. No hospital id: the server uses the caller's hospital. */
export interface EnableHospitalClinicalFormRequest {
  templateId: string;
  /** Defaults to the latest published version. */
  templateVersionId?: string | null;
  /** Null keeps an existing overlay. */
  configurationJson?: string | null;
}

/** UpdateHospitalClinicalFormDto. */
export interface UpdateHospitalClinicalFormRequest {
  activeTemplateVersionId: string;
  /** Null or empty clears the overlay. */
  configurationJson: string | null;
  rowVersion: string;
}

/** PreviewHospitalClinicalFormDto. */
export interface PreviewHospitalClinicalFormRequest {
  /** Defaults to the active (or latest published) version. */
  templateVersionId?: string | null;
  /** Null previews the version as published (no hospital changes). */
  configurationJson?: string | null;
}

/** HospitalClinicalFormPreviewDto. */
export interface HospitalClinicalFormPreview {
  templateVersionId: string;
  versionNumber: number;
  definition: FormDefinition;
}

/** Hospital overlay (HospitalFormConfiguration, schemaVersion 1): the only supported customizations. */
export interface HospitalFormOverlay {
  schemaVersion: number;
  appliesToTemplateVersion?: number | null;
  /** Keyed by section key. */
  sections?: Record<string, { enabled?: boolean | null; title?: string | null }>;
  /** Keyed by "sectionKey.fieldKey" (top-level fields only). */
  fields?: Record<string, { label?: string | null; hidden?: boolean | null; required?: boolean | null; hiddenOptions?: string[] | null }>;
  consents?: { consentType: string; consentVersion: string; text: string }[];
}
