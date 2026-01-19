import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../../shared/services/api-service';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';
import { HttpClient, HttpParams } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class PrescriptionService {
  private api = inject(ApiService);
   private http = inject(HttpClient);

   getPrescriptionMasterValues(): Observable<any> {
    return this.api.get(`${ApiEndpoints.PRESCRIPTION.GET_MASTER}`);
   }

getHelperValuesByPrescMasterIdList(
  masterId: string,
  page: number,
  pageSize: number,
  searchTerm: string = ''
) {
  return this.api.get(
    ApiEndpoints.PRESCRIPTION.GET_VALUES(masterId),
    {
      page,
      pageSize,
      searchTerm
    }
  );
}

savePrescriptionHeleprValue(payload: any): Observable<any> {
      return this.api.post(`${ApiEndpoints.PRESCRIPTION.SAVE_PRESCRIPTION_HELPER_VALUES}`, payload);
    }

updatePrescriptionHelperValue(payload: any): Observable<any> {
  return this.api.put(
    ApiEndpoints.PRESCRIPTION.UPDATE_PRESCRIPTION_HELPER_VALUES,
    payload
  );
}

deletePrescriptionHelperValue(id: string): Observable<any> {
  return this.api.delete(
    ApiEndpoints.PRESCRIPTION.DELETE_PRESCRIPTION_HELPER_VALUES(id)
  );
}

getPatientAsPerDoctor(page: number, pageSize: number, search: string) {
  const params = {
    page: page,
    pageSize: pageSize,
    searchTerm: search || ""
  };

  return this.api.get(`${ApiEndpoints.DOCTOR.GetPatientAsPerDoctor}`, { params });
}


getMedicineType(): Observable<any> {
  return this.api.get(`${ApiEndpoints.DOCTOR.GetMedicineType}`);
}

getMedicineList(typeId: number): Observable<any> {
  return this.api.get(`${ApiEndpoints.DOCTOR.GetMedicineList}${typeId}`);
}
getLabTest(): Observable<any> {
  return this.api.get(`${ApiEndpoints.DOCTOR.GetLabTest}`);
}

getMedicineFrequencies() {
  return this.api.get(`${ApiEndpoints.DOCTOR.GetFrequency}`);
}

getMedicineTimings() {
  return this.api.get(`${ApiEndpoints.DOCTOR.GetMedicineTimings}`);
}

getMedicineInstructions() {
  return this.api.get(`${ApiEndpoints.DOCTOR.GetMedicineInstructions}`);
}

  savePrescription(payload: any): Observable<any> {
    return this.api.post(`${ApiEndpoints.DOCTOR.SavePrescription}`, payload);
  }

getPrescriptionByAppointmentId(appointmentId: string) {
  return this.api.get(
    `${ApiEndpoints.DOCTOR.GetPrescriptionByAppointmentId}?appointmentId=${appointmentId}`
  );
}

updateAppointmentStatus(appointmentId: string, status: number = 2): Observable<any> {
  const url = `${ApiEndpoints.DOCTOR.UpdateAppointment}?status=${status}&AppointmentId=${appointmentId}`;
  return this.http.get(url);
}


}
