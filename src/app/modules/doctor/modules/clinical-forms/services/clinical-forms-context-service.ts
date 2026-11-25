import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';
import { PatientFormContext } from '../models/clinical-forms.models';
import { ageInYears } from '../engine/clinical-form-engine';

/** Existing patient record, as returned by the existing user API (read only; never written by forms). */
export interface ClinicalFormsPatient {
  id: string;
  fullName: string | null;
  patientViewId: number | null;
  gender: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

/** One of the patient's existing appointments (existing appointment-history API). */
export interface ClinicalFormsAppointment {
  appointmentId: string;
  appointmentViewId: number | null;
  appointmentDate: string | null;
  doctorName: string | null;
  status: number;
}

/** Existing appointment status values (ApplicationEnum.AppointmentStatus). */
export const APPOINTMENT_CANCELLED = 4;

export function sameId(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function appointmentStatusText(status: number): string {
  switch (status) {
    case 0: return 'Scheduled';
    case 1: return 'On going';
    case 2: return 'Completed';
    case 4: return 'Cancelled';
    default: return 'Unknown';
  }
}

function text(value: unknown): string | null {
  return value === null || value === undefined || value === '' ? null : String(value);
}

/**
 * Reads patient and appointment context for Clinical Forms from the EXISTING patient/appointment APIs.
 * Nothing here creates or changes patient or appointment data. Results are display context only: the
 * server re-validates patient/appointment ownership on every Clinical Forms call.
 */
@Injectable({ providedIn: 'root' })
export class ClinicalFormsContextService {
  private readonly api = inject(ApiService);

  /** The patient record, or null when it cannot be read or is not the requested patient. */
  getPatient(patientId: string): Observable<ClinicalFormsPatient | null> {
    return this.api.get<any>(ApiEndpoints.User.GET_BY_ID(patientId)).pipe(
      map((response) => {
        const p = response?.isSuccess === false ? null : response?.data;
        // Integrity: never show another person's record for this patient id.
        if (!p || !sameId(text(p.userId), patientId)) return null;
        return {
          id: String(p.userId),
          fullName: text(p.fullName),
          patientViewId: typeof p.patientViewId === 'number' && p.patientViewId > 0 ? p.patientViewId : null,
          gender: text(p.gender),
          dateOfBirth: text(p.dob),
          phone: text(p.phone),
          email: text(p.email),
          address: text(p.address),
        } satisfies ClinicalFormsPatient;
      }),
      catchError(() => of(null)),
    );
  }

  /** The patient's appointments (newest first). Only appointments of this patient are returned. */
  getAppointments(patientId: string): Observable<ClinicalFormsAppointment[]> {
    return this.api.get<any>(ApiEndpoints.PATIENT.GETPATIENTAPPOINTMENTLISTS, { patientId, page: 1, pageSize: 100 }).pipe(
      map((response) => {
        const list: any[] = Array.isArray(response?.dataList) ? response.dataList : [];
        return list
          .filter((a) => a && text(a.appointmentId) && sameId(text(a.patientId), patientId))
          .map((a) => ({
            appointmentId: String(a.appointmentId),
            appointmentViewId: typeof a.appointmentViewId === 'number' ? a.appointmentViewId : null,
            appointmentDate: text(a.appointmentDate),
            doctorName: text(a.doctorName),
            status: typeof a.appointmentStatus === 'number' ? a.appointmentStatus : -1,
          }));
      }),
      catchError(() => of([])),
    );
  }
}

/** Patient context for form conditions and patientBinding fields, from a record or a submission snapshot. */
export function patientFormContext(source: {
  fullName?: unknown; patientViewId?: unknown; gender?: unknown; dateOfBirth?: unknown; phone?: unknown; email?: unknown; address?: unknown;
}): PatientFormContext {
  const dob = text(source.dateOfBirth);
  const isoDob = dob ? dob.substring(0, 10) : null;
  const age = ageInYears(dob);
  const viewId = typeof source.patientViewId === 'number' && source.patientViewId > 0 ? source.patientViewId : null;
  return {
    gender: text(source.gender),
    ageYears: age,
    bindings: {
      'patient.fullName': text(source.fullName),
      'patient.patientViewId': viewId,
      'patient.gender': text(source.gender),
      'patient.dateOfBirth': isoDob,
      'patient.ageDisplay': age === null ? null : `${age} years`,
      'patient.phone': text(source.phone),
      'patient.email': text(source.email),
      'patient.address': text(source.address),
    },
  };
}
