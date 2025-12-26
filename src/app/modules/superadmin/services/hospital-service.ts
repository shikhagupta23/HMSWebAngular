import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private api = inject(ApiService);

  getHospitals(page: number, pageSize: number, search: string): Observable<any> {
    return this.api.get(ApiEndpoints.HOSPITAL.GET(page, pageSize, search));
  }

addHospital(body: FormData, params: any): Observable<any> {
  return this.api.post(
    ApiEndpoints.HOSPITAL.ADD,
    body,
    { params } 
  );
}
updateHospital(body: FormData, params: any): Observable<any> {
  return this.api.put(
    ApiEndpoints.HOSPITAL.UPDATE,
    body,
    { params } 
  );
}

updateStatus(id: string, isActive: boolean): Observable<any> {
  return this.api.post(
    ApiEndpoints.HOSPITAL.UPDATE_STATUS,
    null,
    {
      params: {
        id: id,
        isActive: isActive
      }
    }
  );
}

}
