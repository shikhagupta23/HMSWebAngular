import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class MedicineService {
  private api = inject(ApiService);

  getMedicine(pageSize: number = 100): Observable<any> {
    return this.api.get(`${ApiEndpoints.MEDICINE.GET}?pageSize=${pageSize}`);
  }

  getMedicineType(searchTerm: string): Observable<any>{
    return this.api.get(`${ApiEndpoints.MEDICINE.GET_MEDICINE_TYPE}?searchTerm=${searchTerm}`)
  }

  postMedicine(payload: any): Observable<any> {
    return this.api.post(ApiEndpoints.MEDICINE.POST, payload);
  }
}
