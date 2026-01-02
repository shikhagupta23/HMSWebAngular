import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../../constants/api-endpoints';
import { ApiService } from '../../../services/api-service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private api = inject(ApiService);
      getDahBoardData(IsToday: boolean): Observable<any> {
      const param : any = {
        IsToday: IsToday
      }
       return this.api.get(ApiEndpoints.DASHBOARD.GETDASHBOARDDATA, param);
    }
     getDashboardSummary(isToday?: boolean, date?: string): Observable<any> {
  const params: any = {};

  // ✅ add IsToday ONLY if defined (true / false)
  if (isToday !== undefined && isToday !== null) {
    params.IsToday = isToday;
  }

  // ✅ add date ONLY if value exists
  if (date) {
    params.date = date;
  }

  return this.api.get(ApiEndpoints.DASHBOARD.DASHBOARDSUMMARY, params);
}

}
