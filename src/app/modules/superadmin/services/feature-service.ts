import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private api = inject(ApiService);

  getFeatures(page: number, pageSize: number, search: string = ''): Observable<any> {
    return this.api.get(ApiEndpoints.FEATURE.GET(page, pageSize, search));
  }

  saveFeature(body: any): Observable<any> {
    return this.api.post(ApiEndpoints.FEATURE.SAVE, body);
  }
   updateFeature(body: any): Observable<any> {
    return this.api.post(ApiEndpoints.FEATURE.UPDATE, body);
  }
  
  deleteFeature(featureId: string) {
    return this.api.delete(ApiEndpoints.FEATURE.DELETE(featureId));
  }
}
