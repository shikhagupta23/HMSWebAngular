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

  addUser(body: any): Observable<any> {
    return this.api.post(ApiEndpoints.User.ADD, body);
  }

}
