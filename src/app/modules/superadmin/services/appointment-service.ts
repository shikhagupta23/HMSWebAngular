import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private api = inject(ApiService);

  getUpcomingFollowUps(page: number, pageSize: number, search?: string, status?: number, date?: string, todays?: any): Observable<any> {
    const params: any = {};
    if (page != null) params.page = page;
    if (pageSize != null) params.pageSize = pageSize;
    if (search) params.search = search;
    if (status != null) params.status = status;
    if (date) params.date = date;
    if (todays !== undefined && todays !== null && todays !== '') params.todays = todays;

    return this.api.get(ApiEndpoints.APPOINTMENT.UPCOMING_FOLLOWUP_BASE, params);
  }

  getPastFollowUps(page: number, pageSize: number, search?: string, status?: number, date?: string, todays?: any): Observable<any> {
    const params: any = {};
    if (page != null) params.page = page;
    if (pageSize != null) params.pageSize = pageSize;
    if (search) params.search = search;
    if (status != null) params.status = status;
    if (date) params.date = date;
    if (todays !== undefined && todays !== null && todays !== '') params.todays = todays;

    return this.api.get(ApiEndpoints.APPOINTMENT.PAST_FOLLOWUP_BASE, params);
  }
}
