import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../../shared/services/api-service';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class Labtest {
    private api = inject(ApiService);

    getLabTest(pageSize: number = 100): Observable<any> {
      return this.api.get(`${ApiEndpoints.LABTEST.GET}?pageSize=${pageSize}`);
    }
}
