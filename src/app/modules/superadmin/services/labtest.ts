import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';
import { ApiService } from '../../../shared/services/api-service';

@Injectable({
  providedIn: 'root',
})
export class Labtest {

  private api = inject(ApiService)

  getLabTests(page: number, pageSize: number) {
    return this.api.get(ApiEndpoints.LAB_TEST.GET(page, pageSize));
  }

  addLabTest(payload: any) {
    return this.api.post(ApiEndpoints.LAB_TEST.ADD, payload);
  }

  updateLabTest(payload: any) {
    return this.api.put(ApiEndpoints.LAB_TEST.UPDATE, payload);
  }

  deleteLabTest(labTestId: string) {
    return this.api.delete(ApiEndpoints.LAB_TEST.DELETE(labTestId));
  }

}
