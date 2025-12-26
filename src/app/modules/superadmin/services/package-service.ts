// services/package.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

export interface PackageModel {
  packageId?: string;
  packageName: string;
  description: string;
  price: number;
  durationInDays: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  dataList: T[] | null;
  data: T | null;
  isSuccess: boolean;
  message: string;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class PackageService {
  private api = inject(ApiService);

  /**
   * Get paginated packages
   * @param page Page number (1-based)
   * @param pageSize Number of records per page
   */
  getPackages(page: number, pageSize: number): Observable<ApiResponse<PackageModel>> {
    return this.api.get(
      ApiEndpoints.PACKAGE.GET(page, pageSize)
    );
  }

  /**
   * Add a new package (POST to /createPackage)
   * @param packageData Package details
   */
  addPackage(packageData: PackageModel): Observable<ApiResponse<PackageModel>> {
    // Remove packageId if it exists (let backend generate it)
    const payload = {
      packageName: packageData.packageName,
      description: packageData.description,
      price: packageData.price,
      durationInDays: packageData.durationInDays
    };
    
    return this.api.post(
      ApiEndpoints.PACKAGE.ADD,
      payload
    );
  }

  /**
   * Update an existing package
   * @param packageData Package details with packageId
   */
  updatePackage(packageData: PackageModel): Observable<ApiResponse<PackageModel>> {
    return this.api.put(
      ApiEndpoints.PACKAGE.UPDATE,
      packageData
    );
  }

  /**
   * Change package status (activate/deactivate)
   * @param id Package ID
   * @param isActive New status
   */
  changeStatus(id: string, isActive: boolean): Observable<ApiResponse<PackageModel>> {
    // Using PUT instead of PATCH since ApiService doesn't have patch method
    return this.api.put(
      ApiEndpoints.PACKAGE.CHANGE_STATUS(id, isActive),
      {} // Empty body for status change
    );
  }

  /**
   * Get single package by ID
   * @param id Package ID
   */
  getPackageById(id: string): Observable<ApiResponse<PackageModel>> {
    return this.api.get(`${ApiEndpoints.PACKAGE.GET}/${id}`);
  }
}