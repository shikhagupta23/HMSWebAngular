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

    
  getAppointments(page: number, size: number, status: number, date: string, searchText: string) {

    const params: any = {
      page: page,
      pageSize: size,
      status: status,
      date: date
    };

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
