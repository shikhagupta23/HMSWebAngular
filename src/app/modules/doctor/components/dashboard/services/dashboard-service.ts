import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../../shared/services/api-service';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
   private api = inject(ApiService);


   getDahBoardData(): Observable<any> {
         return this.api.get(ApiEndpoints.DASHBOARD.GETDASHBOARDDATA);
       }
}
