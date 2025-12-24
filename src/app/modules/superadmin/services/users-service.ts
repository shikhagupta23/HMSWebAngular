import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api = inject(ApiService);

  getUsers(page: number, pageSize: number, search: string): Observable<any> {
    return this.api.get(ApiEndpoints.User.GET(page, pageSize, search));
  }

  getRoleId(roleName?: string): Observable<any> {
    return this.api.get(ApiEndpoints.USER.GET_ROLE_ID(roleName));
  }

  getSystemRoles(): Observable<any> {
    return this.api.get(ApiEndpoints.SELECT.GET_SYSTEM_ROLE);
  }

  addUser(body: any): Observable<any> {
    return this.api.post(ApiEndpoints.User.ADD, body);
  }

  updateUser(body: any): Observable<any> {
    return this.api.put(ApiEndpoints.User.UPDATE, body);
  }
    updateStatus(id: string, isExtend: boolean): Observable<any> {
  return this.api.post(
    ApiEndpoints.HOSPITAL.UPDATE_STATUS,
    null, 
    {
      params: {
        id,
        isExtend
      }
    }
  );
}

}
