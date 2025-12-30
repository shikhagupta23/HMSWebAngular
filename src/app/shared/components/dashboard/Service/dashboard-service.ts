import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../../constants/api-endpoints';
import { ApiService } from '../../../services/api-service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private api = inject(ApiService);

    getDahBoardData(): Observable<any> {
      return this.api.get(ApiEndpoints.DASHBOARD.GETDASHBOARDDATA);
    }

    getDashboardRecords(isToday: boolean): Observable<any> {
      const param : any = {
        IsToday: isToday
      }
      return this.api.get(ApiEndpoints.DASHBOARD.GETDASHBOARDRECORD, param);
    }
}
