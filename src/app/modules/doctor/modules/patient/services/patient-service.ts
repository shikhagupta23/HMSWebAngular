import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared/services/api-service';

@Injectable({
  providedIn: 'root',
})
export class PatientService {

    private api = inject(ApiService);

    getPatients(page: number, pageSize: number, search: string): Observable<any> {
      return this.api.get(
        ApiEndpoints.PATIENT.GET(page, pageSize, search)
      );
    }

    getRoleId(roleName: string):Observable<any>{
      return this.api.get(ApiEndpoints.USER.GET_ROLE_ID(roleName));
    }

    postPatient(payload: any): Observable<any> {
      return this.api.post(ApiEndpoints.USER.CREATE, payload);
    }
}
