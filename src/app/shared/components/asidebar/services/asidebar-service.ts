import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../services/api-service';
import { ApiEndpoints } from '../../../constants/api-endpoints';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AsidebarService {
  private api = inject(ApiService);
  private doctorDetailsSubject = new BehaviorSubject<any>(null);
  doctorDetails$ = this.doctorDetailsSubject.asObservable();

    getDoctorDetailsById(id: any): Observable<any> {
      const url = `${ApiEndpoints.DOCTOR.GetDoctorById}${id}`;
      return this.api.get(url);
    }

    loadDoctorDetails(id: any) {
      this.getDoctorDetailsById(id).subscribe(res => {
        if (res?.isSuccess) {
          this.doctorDetailsSubject.next(res.data);
        }
      });
    }

    updateDoctorDetails(partialData: any) {
      const current = this.doctorDetailsSubject.value;
      this.doctorDetailsSubject.next({
        ...current,
        ...partialData,
      });
    }
}
