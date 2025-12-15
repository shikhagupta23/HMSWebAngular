import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private api = inject(ApiService);

  getHospitals(page: number, pageSize: number, search: string): Observable<any> {
    return this.api.get(ApiEndpoints.HOSPITAL.GET(page, pageSize, search));
  }

  addHospital(body: any): Observable<any> {
    // body can be FormData or JSON
    return this.api.post(ApiEndpoints.HOSPITAL.ADD, body);
  }

}
