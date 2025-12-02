import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../services/api-service';
import { ApiEndpoints } from '../../../constants/api-endpoints';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AsidebarService {
  private api = inject(ApiService);

    getDoctorDetailsById(id: any): Observable<any> {
      const url = `${ApiEndpoints.DOCTOR.GetDoctorById}${id}`;
      return this.api.get(url);
    }
}
