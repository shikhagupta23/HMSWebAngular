import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class FeatureAccessService {
  private api = inject(ApiService);

  getFeatureAccess(page: number, pageSize: number, search: string = ''): Observable<any> {
    return this.api.get(ApiEndpoints.FEATURE_ACCESS.GET(page, pageSize, search));
  }

  saveFeatureAccess(body: any): Observable<any> {
    return this.api.post(ApiEndpoints.FEATURE_ACCESS.SAVE, body);
  }

  updateStatus(id: any, isExtend: boolean): Observable<any> {
    const body = { id, isExtend };
    return this.api.post(ApiEndpoints.FEATURE_ACCESS.UPDATE_STATUS, body);
  }

  getFeatureList(): Observable<any> {
    return this.api.get(ApiEndpoints.SELECT.GET_FEATURE_LIST);
  }

  getHospitalList(): Observable<any> {
    return this.api.get(ApiEndpoints.SELECT.GET_HOSPITAL_LIST);
  }

  getUserList(
    role: string,
    page: number = 1,
    pageSize: number = 100,
    search: string = ''
  ): Observable<any> {
    return this.api.get(ApiEndpoints.SELECT.GET_USER_LIST(role, page, pageSize, search));
  }
  getUsersAsPerHospitalFeature(
    hospitalId: string,
    featureId: string,
    role: string
  ): Observable<any> {
    return this.api.get(
      ApiEndpoints.SELECT.GET_USER_AS_PER_HOSPITAL_FEATURE(hospitalId, featureId, role)
    );
  }
  
}
