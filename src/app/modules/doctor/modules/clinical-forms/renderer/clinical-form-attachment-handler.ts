import { Observable } from 'rxjs';
import { AttachmentUploadEvent, ClinicalAttachmentType, ClinicalFormAttachment } from '../models/clinical-forms.models';

/**
 * Supplied by the page that hosts the renderer so attachmentList fields can upload and open files.
 * The renderer stays free of HTTP: it only calls this bridge. All rules are re-checked by the server.
 */
export interface ClinicalFormAttachmentHandler {
  /** Attachment metadata of the submission (signal-backed, so templates stay current). */
  attachments(): ClinicalFormAttachment[];
  /** Whether the current user may upload now (permission and lifecycle). */
  canUpload(): boolean;
  upload(sectionKey: string, fieldKey: string, type: ClinicalAttachmentType, file: File): Observable<AttachmentUploadEvent>;
  /** Opens the file for viewing through the authorized download endpoint. */
  open(attachment: ClinicalFormAttachment): void;
}
