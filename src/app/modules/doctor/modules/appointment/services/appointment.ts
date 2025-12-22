import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Appointment {
  private api = inject(ApiService);
  private http = inject(HttpClient);

   getAllAppointment(): Observable<any> {
      return this.api.get(ApiEndpoints.APPOINTMENT.GET);
    }

    
  getAppointments(page: number, size: number, status: number, date: string | null, searchText: string) {

    const params: any = {
      page: page,
      pageSize: size,
      status: status,
      // date: date
    };

      if (date) {
    params.date = date;
  }
    if (searchText && searchText.trim() !== '') {
      params.searchTerm = searchText;
    }

    return this.api.get(ApiEndpoints.APPOINTMENT.GET, params);
  }


    saveAppointment(data: any): Observable<any> {
      return this.api.post(ApiEndpoints.APPOINTMENT.POST, data);
    }

  getDoctor(): Observable<any> {
      return this.api.get(ApiEndpoints.DOCTOR.GET);
    }

    getDoctorFee(doctorId: any): Observable<any> {
      const url = `${ApiEndpoints.DOCTOR.GETFee}${doctorId}`;
      return this.api.get(url);
    }

    getPatientByNameOrPhone(term : string): Observable<any> {
      const url = `${ApiEndpoints.PATIENT.GET_BY_NAME_OR_PHONE}?role=patient&name=${term}`;
      return this.api.get(url);
    }

    // PRESCRIPTION SERVICES

    
getPatientAsPerDoctor(page: number, pageSize: number, searchText: string, status: number ) {
  const params: any = {
    page: page,
    pageSize: pageSize,
    status: status
  };
    if (searchText && searchText.trim() !== '') {
      params.searchTerm = searchText;
    }
  return this.api.get(`${ApiEndpoints.DOCTOR.GetPatientAsPerDoctor}`, { params });
}

getAllPatientAsPerDoctor(page: number, pageSize: number, searchText: string, status: number, date?: string ) {
  const params: any = {
    page: page,
    pageSize: pageSize,
    status: status
  };
    if (date) {
    params.date = date; // yyyy-MM-dd
  }
    if (searchText && searchText.trim() !== '') {
      params.searchTerm = searchText;
    }
  return this.api.get(`${ApiEndpoints.DOCTOR.GetAllPatientAsPerDoctor}`,params );
}

// getMedicineType(): Observable<any> {
//   return this.api.get(`${ApiEndpoints.DOCTOR.GetMedicineType}`);
// }

getMedicineType(page: number, pageSize: number) {
    const params: any = {
    page: page,
    pageSize: pageSize
  };
  return this.api.get(`${ApiEndpoints.DOCTOR.GetMedicineType}`,params);
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

  // savePrescription(payload: any): Observable<any> {
  //   return this.api.post(`${ApiEndpoints.DOCTOR.SavePrescription}`, payload);
  // }

savePrescription(payload: any): Observable<any> {
  return this.api.post(ApiEndpoints.PRESCRIPTION.SAVE, payload);
}


getPrescriptionByAppointmentId(appointmentId: string) {
  return this.api.get(
    `${ApiEndpoints.DOCTOR.GetPrescriptionByAppointmentId}/${appointmentId}`
  );
}


updateAppointmentStatus(appointmentId: string, status: number = 2): Observable<any> {
  const url = `${ApiEndpoints.DOCTOR.UpdateAppointment}?status=${status}&AppointmentId=${appointmentId}`;
  return this.http.get(url);
}

// GET PRESCRIPTION MASTER LIST
getPrescriptionMaster(): Observable<any> {
  return this.api.get(ApiEndpoints.PRESCRIPTION.GET_MASTER);
}

// GET VALUE LIST USING MASTER ID
getPrescriptionValues(masterId: string): Observable<any> {
  const url = `${ApiEndpoints.PRESCRIPTION.GET_VALUES}${masterId}`;
  return this.api.get(url);
}

searchDrugByName(term: string): Observable<any> {
  return this.api.get(
    ApiEndpoints.DRUG.SEARCH_BY_NAME,
    { searchTerm: term }
  );
}


getMedicineDetails(drugId: string, variationId: string): Observable<any> {
  return this.api.get(
    ApiEndpoints.DRUG.GET_DETAILS,
    { drugId, variationId }
  );
}



}
