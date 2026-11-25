import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ClinicalFormModel } from '../../engine/clinical-form-model';
import { ClinicalFormAttachmentHandler } from '../clinical-form-attachment-handler';
import { toClinicalFormsError } from '../../services/clinical-forms-error';
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_TYPE_LABELS,
  ClinicalAttachmentType,
  ClinicalFormAttachment,
  FieldDefinition,
  SectionDefinition,
  UPLOADABLE_ATTACHMENT_TYPES,
} from '../../models/clinical-forms.models';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * attachmentList field: the answer is a list of attachment ids. Files are uploaded through the host's
 * handler (authorized, validated and stored privately by the server) and then added to the answer;
 * "Remove" only takes the file out of the answer (deleting the file itself is a separate, audited action).
 */
@Component({
  selector: 'app-clinical-form-attachment-field',
  standalone: false,
  templateUrl: './clinical-form-attachment-field.html',
})
export class ClinicalFormAttachmentField implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) model!: ClinicalFormModel;
  @Input({ required: true }) section!: SectionDefinition;
  @Input({ required: true }) field!: FieldDefinition;
  @Input({ required: true }) control!: FormControl;
  @Input() handler: ClinicalFormAttachmentHandler | null = null;
  @Input() inputId = '';

  readonly accept = ATTACHMENT_ACCEPT;
  readonly labels = ATTACHMENT_TYPE_LABELS;
  readonly progress = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  selectedType: ClinicalAttachmentType | null = null;

  /** Types this field accepts (field allowedTypes, intersected with uploadable types). */
  get types(): ClinicalAttachmentType[] {
    const allowed = (this.field.allowedTypes ?? []).map((t) => t.toLowerCase());
    return UPLOADABLE_ATTACHMENT_TYPES.filter((t) => allowed.length === 0 || allowed.includes(ClinicalAttachmentType[t].toLowerCase()));
  }

  ngOnInit(): void {
    this.selectedType = this.types[0] ?? null;
  }

  get ids(): string[] {
    this.model.version();
    const value = this.control?.value;
    return Array.isArray(value) ? value : [];
  }

  get editable(): boolean {
    this.model.version();
    return !!this.control && this.control.enabled && !!this.handler?.canUpload();
  }

  attachment(id: string): ClinicalFormAttachment | undefined {
    return this.handler?.attachments().find((a) => a.id === id);
  }

  onFileSelected(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = ''; // allow selecting the same file again after an error
    if (!file || !this.handler || this.selectedType === null) return;
    this.error.set(null);

    // Fast client-side checks for a friendly message; the server performs the authoritative validation.
    const name = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      this.error.set('Only PDF, JPEG and PNG files are allowed.');
      return;
    }
    if (file.size === 0) {
      this.error.set('The file is empty.');
      return;
    }
    if (file.size > ATTACHMENT_MAX_BYTES) {
      this.error.set('The file exceeds the 10 MB limit.');
      return;
    }

    this.progress.set(0);
    const subscription = this.handler.upload(this.section.key, this.field.key, this.selectedType, file).subscribe({
      next: (event) => {
        if (event.kind === 'progress') {
          this.progress.set(event.percent);
          return;
        }
        this.progress.set(null);
        this.control.setValue([...this.ids, event.attachment.id]);
        this.control.markAsDirty();
        this.control.markAsTouched();
      },
      error: (raw) => {
        this.progress.set(null);
        const error = toClinicalFormsError(raw);
        this.error.set(error.errors[0]?.message ?? error.message);
      },
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  remove(id: string): void {
    if (!this.editable) return;
    this.control.setValue(this.ids.filter((i) => i !== id));
    this.control.markAsDirty();
  }

  open(id: string): void {
    const attachment = this.attachment(id);
    if (attachment) this.handler?.open(attachment);
  }
}
