import { HttpErrorResponse } from '@angular/common/http';
import { ClinicalFormValidationError } from '../models/clinical-forms.models';

export type ClinicalFormsErrorKind =
  | 'validation'   // 400: rule violations, with structured errors
  | 'unauthorized' // 401: session expired (the global interceptor logs the user out)
  | 'forbidden'    // 403: role/feature/section not permitted
  | 'notFound'     // 404: missing, or not visible in this hospital
  | 'conflict'     // 409: changed by someone else / duplicate — reload and retry
  | 'network'      // status 0: offline / CORS / server unreachable
  | 'unavailable'  // 503: file storage or PDF generation temporarily unavailable
  | 'server';      // 5xx or anything unexpected

/** Normalized API failure for Clinical Forms screens. Messages never contain patient answers. */
export class ClinicalFormsError extends Error {
  constructor(
    readonly kind: ClinicalFormsErrorKind,
    readonly status: number,
    message: string,
    readonly errors: ClinicalFormValidationError[] = [],
  ) {
    super(message);
    this.name = 'ClinicalFormsError';
  }

  get isConflict(): boolean {
    return this.kind === 'conflict';
  }
}

const DEFAULT_MESSAGES: Record<ClinicalFormsErrorKind, string> = {
  validation: 'Please correct the highlighted problems.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'You do not have permission to do this.',
  notFound: 'The requested record was not found.',
  conflict: 'This record was changed by someone else. Reload to see the latest version.',
  network: 'The server could not be reached. Check your connection and try again.',
  unavailable: 'The service is temporarily unavailable. Please try again later.',
  server: 'Something went wrong. Please try again later.',
};

function kindFor(status: number): ClinicalFormsErrorKind {
  if (status === 0) return 'network';
  if (status === 400) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 503) return 'unavailable';
  return 'server';
}

/** Maps any HTTP failure to a ClinicalFormsError, keeping the server's structured validation errors. */
export function toClinicalFormsError(error: unknown): ClinicalFormsError {
  if (error instanceof ClinicalFormsError) return error;
  if (error instanceof HttpErrorResponse) {
    const kind = kindFor(error.status);
    const body = (error.error && typeof error.error === 'object' ? error.error : {}) as { message?: unknown; errors?: unknown };
    const errors = Array.isArray(body.errors) ? (body.errors as ClinicalFormValidationError[]) : [];
    // Server messages are generic for 5xx; prefer our wording there.
    const message = kind !== 'server' && kind !== 'network' && typeof body.message === 'string' && body.message.trim()
      ? body.message
      : DEFAULT_MESSAGES[kind];
    return new ClinicalFormsError(kind, error.status, message, errors);
  }
  return new ClinicalFormsError('server', -1, DEFAULT_MESSAGES.server);
}
