import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { ClinicalFormModel } from '../../engine/clinical-form-model';
import {
  EffectiveSectionAccess,
  FieldDefinition,
  FormAnswers,
  FormDefinition,
  PatientFormContext,
  SectionDefinition,
} from '../../models/clinical-forms.models';
import { ClinicalFormAttachmentHandler } from '../clinical-form-attachment-handler';

/**
 * Generic, definition-driven clinical form renderer. Knows nothing about any specialty: it renders
 * whatever sections/fields the (resolved) definition contains, honouring conditional visibility,
 * required rules and the server-provided per-section edit rights.
 *
 * The parent reads answers/validity from the emitted ClinicalFormModel; the renderer never calls APIs.
 */
@Component({
  selector: 'app-clinical-form-renderer',
  standalone: false,
  templateUrl: './clinical-form-renderer.html',
  styleUrl: './clinical-form-renderer.scss',
})
export class ClinicalFormRenderer implements OnChanges {
  @Input({ required: true }) definition!: FormDefinition;
  @Input() answers: FormAnswers | null = null;
  /** Server-computed section edit rights; when omitted every section is editable. */
  @Input() sectionAccess: EffectiveSectionAccess[] | null = null;
  @Input() readOnly = false;
  @Input() patient: PatientFormContext | null = null;
  /** Optional upload/view bridge for attachmentList fields; without it attachments are display only. */
  @Input() attachmentHandler: ClinicalFormAttachmentHandler | null = null;
  /**
   * Hide sections that only contain consent fields, for pages that show their own consent panel
   * (wording, signature and history) so the consent does not appear twice.
   */
  @Input() hideConsentSections = false;

  /** Emitted whenever the form model is (re)built from the inputs. */
  @Output() readonly modelReady = new EventEmitter<ClinicalFormModel>();

  readonly model = signal<ClinicalFormModel | null>(null);

  ngOnChanges(): void {
    if (!this.definition) {
      this.model.set(null);
      return;
    }
    const editable = this.sectionAccess ? new Set(this.sectionAccess.filter((s) => s.canEdit).map((s) => s.key)) : null;
    const model = new ClinicalFormModel(this.definition, {
      answers: this.answers,
      editableSections: editable,
      readOnly: this.readOnly,
      patient: this.patient,
    });
    this.model.set(model);
    this.modelReady.emit(model);
  }

  /** Reads the model version so the template re-evaluates visibility after every change. */
  visible(model: ClinicalFormModel, section: SectionDefinition, field: FieldDefinition): boolean {
    model.version();
    return model.isVisible(`${section.key}.${field.key}`);
  }

  shown(section: SectionDefinition): boolean {
    return !(this.hideConsentSections && section.fields.length > 0 && section.fields.every((f) => f.type === 'consent'));
  }

  /**
   * Layout like a paper form: short answers (text, dates, selects, patient details, small radio groups)
   * share a row in a responsive grid; lists, tables, notes and consent take the full width.
   */
  wide(field: FieldDefinition): boolean {
    if (WIDE_TYPES.has(field.type)) return true;
    if (field.type === 'radio' || field.type === 'yesNoUnknown') return (field.options?.length ?? (field.optionSet ? 4 : 3)) > 3;
    return false;
  }
}

const WIDE_TYPES = new Set(['textarea', 'checkboxGroup', 'conditionList', 'repeater', 'consent', 'attachmentList']);
