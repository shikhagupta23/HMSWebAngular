// services/assign-package.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api-service';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

export interface HospitalDropdown {
  id: string;
  name: string;
}

export interface PackageDropdown {
  id: string;
  name: string;
  price?: number;
  durationInDays?: number;
}

export interface AssignmentModel {
  hospitalPackageId?: string;
  hospitalId: string;
  hospitalName?: string;
  packageId: string;
  packageName?: string;
  startDate: string;
  endDate?: string;
  price?: number;
  durationInDays?: number;
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
export class AssignPackageService {
  private api = inject(ApiService);

  /**
   * Get hospital dropdown list
   * GET /api/HospitalPackage/GetAllHospitalDropdown
   * Returns list of hospitals for dropdown selection
   */
  getHospitalDropdown(): Observable<ApiResponse<HospitalDropdown>> {
    return this.api.get(
      ApiEndpoints.HOSPITAL_PACKAGE.GET_HOSPITAL_DROPDOWN
    );
  }

  /**
   * Get package dropdown list
   * GET /api/HospitalPackage/GetAllPackageDropdown
   * Returns list of packages for dropdown selection
   */
  getPackageDropdown(): Observable<ApiResponse<PackageDropdown>> {
    return this.api.get(
      ApiEndpoints.HOSPITAL_PACKAGE.GET_PACKAGE_DROPDOWN
    );
  }
  
  /**
   * Get all hospital package assignments
   * GET /api/HospitalPackage/GetAllHospitalPackages?page={page}&pageSize={pageSize}
   * Returns the actual assigned packages with all details
   * @param page Page number (1-based)
   * @param pageSize Number of records per page
   */
  getAllHospitalPackages(page: number, pageSize: number): Observable<ApiResponse<AssignmentModel>> {
    return this.api.get(
      ApiEndpoints.HOSPITAL_PACKAGE.GET_ALL(page, pageSize)
    );
  }

  /**
   * Get all hospital package assignments (alternative endpoint)
   * GET /api/HospitalPackage/GetAll?page={page}&pageSize={pageSize}
   * @param page Page number (1-based)
   * @param pageSize Number of records per page
   */
  getAssignments(page: number, pageSize: number): Observable<ApiResponse<AssignmentModel>> {
    return this.api.get(
      ApiEndpoints.HOSPITAL_PACKAGE.GET_ALL(page, pageSize)
    );
  }

  /**
   * Get single assignment by ID
   * GET /api/HospitalPackage/{id}
   * @param id Assignment ID (hospitalPackageId)
   */
  getAssignmentById(id: string): Observable<ApiResponse<AssignmentModel>> {
    return this.api.get(
      ApiEndpoints.HOSPITAL_PACKAGE.GET_BY_ID(id)
    );
  }

  /**
   * Get packages by hospital ID
   * GET /api/HospitalPackage/hospital/{hospitalId}
   * @param hospitalId Hospital ID
   */
  getPackagesByHospital(hospitalId: string): Observable<ApiResponse<AssignmentModel>> {
    return this.api.get(
      ApiEndpoints.HOSPITAL_PACKAGE.GET_BY_HOSPITAL(hospitalId)
    );
  }

  /**
   * Get active packages by hospital ID
   * GET /api/HospitalPackage/active/{hospitalId}
   * @param hospitalId Hospital ID
   */
  getActivePackagesByHospital(hospitalId: string): Observable<ApiResponse<AssignmentModel>> {
    return this.api.get(
      ApiEndpoints.HOSPITAL_PACKAGE.GET_ACTIVE_BY_HOSPITAL(hospitalId)
    );
  }

  /**
   * Assign package to hospital
   * POST /api/HospitalPackage
   * Payload: { hospitalId, packageId, startDate }
   * @param assignmentData Assignment details
   */
  assignPackage(assignmentData: AssignmentModel): Observable<ApiResponse<AssignmentModel>> {
    const payload = {
      hospitalId: assignmentData.hospitalId,
      packageId: assignmentData.packageId,
      startDate: assignmentData.startDate
    };
    
    return this.api.post(
      ApiEndpoints.HOSPITAL_PACKAGE.ASSIGN,
      payload
    );
  }

  /**
   * Update an existing assignment
   * PUT /api/HospitalPackage/{id}
   * @param assignmentData Assignment details with hospitalPackageId
   */
  updateAssignment(assignmentData: AssignmentModel): Observable<ApiResponse<AssignmentModel>> {
    const payload = {
      hospitalId: assignmentData.hospitalId,
      packageId: assignmentData.packageId,
      startDate: assignmentData.startDate,
      endDate: assignmentData.endDate || null,
      isActive: assignmentData.isActive
    };
    
    return this.api.put(
      ApiEndpoints.HOSPITAL_PACKAGE.UPDATE(assignmentData.hospitalPackageId!),
      payload
    );
  }

  /**
   * Delete an assignment
   * DELETE /api/HospitalPackage/{id}
   * @param id Assignment ID (hospitalPackageId)
   */
  deleteAssignment(id: string): Observable<ApiResponse<AssignmentModel>> {
    return this.api.delete(
      ApiEndpoints.HOSPITAL_PACKAGE.DELETE(id)
    );
  }

  /**
   * Change assignment status (activate/deactivate)
   * PUT /api/HospitalPackage/activate-deactivate?id={id}&isActive={isActive}
   * @param id Assignment ID (hospitalPackageId)
   * @param isActive New status
   */
  changeAssignmentStatus(id: string, isActive: boolean): Observable<ApiResponse<AssignmentModel>> {
    return this.api.put(
      ApiEndpoints.HOSPITAL_PACKAGE.CHANGE_STATUS(id, isActive),
      {} // Empty body for status change
    );
  }
}