import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../../environment/environment.delvelopment';

// Updated interface to match API response
interface DrugDose {
  doseId: string;
  doseDescription: string;
  drugTypeId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  drugType?: DrugType;
}

interface DrugType {
  drugTypeId: string;
  typeName: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Updated response interface to match backend PagedResponse
interface DrugDoseResponse {
  dataList: DrugDose[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isSuccess: boolean;
  message: string;
  id?: string;
}

interface DrugTypeResponse {
  dataList: DrugType[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isSuccess: boolean;
  message: string;
  id?: string;
}

// API Response for Create/Update/Delete operations
interface ApiResponse {
  isSuccess: boolean;
  message: string;
  id?: string;
}

@Component({
  selector: 'app-drugdose',
  standalone: false,
  templateUrl: './drugdose.html',
  styleUrls: ['./drugdose.css']
})
export class DrugdoseComponent implements OnInit, OnDestroy {
  doses: DrugDose[] = [];
  filteredDoses: DrugDose[] = [];
  paginatedDoses: DrugDose[] = [];
  showModal = false;
  isEditMode = false;
  formData: DrugDose = { 
    doseId: '', 
    doseDescription: '', 
    drugTypeId: '',
    isActive: true 
  };
  entriesPerPage = 10;
  searchTerm = '';
  filterType = '';
  drugTypes: DrugType[] = [];
  isLoading = false;
  error = '';

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  // Debounce search - Industry Standard
  private searchSubject = new Subject<string>();

  // API Endpoints
  private readonly API_ENDPOINTS = {
    GET_ALL_DOSE: '/DrugManagement/getAllDrugDose',
    CREATE_DOSE: '/DrugManagement/createDrugDose',
    UPDATE_DOSE: '/DrugManagement/updateDrugDose',
    DELETE_DOSE: '/DrugManagement/deleteDrugDose',
    GET_ALL_TYPE: '/DrugManagement/getAllDrugType'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugTypes();
    this.loadDrugDoses();
    
    // Setup debounced search - waits 500ms after user stops typing
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only trigger if search term actually changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.loadDrugDoses();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.searchSubject.complete();
  }

  loadDrugTypes(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL_TYPE}`;
    
    // Get all drug types without pagination for dropdown
    let params = new HttpParams()
      .set('page', '1')
      .set('pageSize', '1000'); // Get all types

    this.http.get<DrugTypeResponse>(apiUrl, { params })
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.drugTypes = response.dataList.filter(dt => dt.isActive);
          }
        },
        error: (err) => {
          console.error('Error loading drug types:', err);
        }
      });
  }

  loadDrugDoses(): void {
    this.isLoading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.entriesPerPage.toString());

    // Add search term if it exists
    if (this.searchTerm && this.searchTerm.trim()) {
      params = params.set('searchTerm', this.searchTerm.trim());
    }

    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL_DOSE}`;

    this.http.get<DrugDoseResponse>(apiUrl, { params })
      .subscribe({
        next: (response) => {
          
          if (response.isSuccess) {
            this.doses = response.dataList || [];
            this.applyClientSideFilter();
            this.totalCount = response.totalCount;
            this.totalPages = response.totalPages;
          } else {
            this.error = response.message || 'Failed to load drug dose data';
            this.doses = [];
            this.paginatedDoses = [];
            this.filteredDoses = [];
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load drug dose data';
          console.error('API Error:', err);
          this.doses = [];
          this.paginatedDoses = [];
          this.filteredDoses = [];
          this.isLoading = false;
        }
      });
  }

  applyClientSideFilter(): void {
    // Apply drug type filter on client side
    if (this.filterType) {
      this.filteredDoses = this.doses.filter(dose => 
        dose.drugTypeId === this.filterType
      );
      this.paginatedDoses = this.filteredDoses;
    } else {
      this.filteredDoses = [...this.doses];
      this.paginatedDoses = this.doses;
    }
  }

  // Updated search method - now uses debouncing
  onSearch(): void {
    // Push the search term to the subject - debouncing will handle the delay
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.applyClientSideFilter();
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadDrugDoses();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDrugDoses();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  getStartIndex(): number {
    return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.entriesPerPage + 1;
  }

  getEndIndex(): number {
    const totalToShow = this.filterType ? this.filteredDoses.length : this.totalCount;
    return Math.min(this.currentPage * this.entriesPerPage, totalToShow);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = { 
      doseId: '', 
      doseDescription: '', 
      drugTypeId: '',
      isActive: true 
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { 
      doseId: '', 
      doseDescription: '', 
      drugTypeId: '',
      isActive: true 
    };
    this.isEditMode = false;
  }

  saveDose(): void {
    if (!this.formData.doseDescription || !this.formData.doseDescription.trim()) {
      alert('Please enter dose description');
      return;
    }

    if (!this.formData.drugTypeId) {
      alert('Please select drug type');
      return;
    }

    if (this.isEditMode) {
      // Update existing dose via API - doseId in URL path
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE_DOSE}/${this.formData.doseId}`;
      
      // Prepare update data without doseId (it's in the URL)
      const updateData = {
        doseDescription: this.formData.doseDescription,
        drugTypeId: this.formData.drugTypeId,
        isActive: this.formData.isActive
      };
      
      this.http.put<ApiResponse>(updateUrl, updateData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.closeModal();
              this.loadDrugDoses();
            } else {
              alert(response.message || 'Failed to update dose');
            }
          },
          error: (err) => {
            console.error('Update error:', err);
            alert('Failed to update dose. Please try again.');
          }
        });
    } else {
      // Create new dose via API
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE_DOSE}`;
      
      // Don't send doseId for new records
      const createData = {
        doseDescription: this.formData.doseDescription,
        drugTypeId: this.formData.drugTypeId,
        isActive: this.formData.isActive
      };
      
      this.http.post<ApiResponse>(createUrl, createData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.closeModal();
              this.loadDrugDoses();
            } else {
              alert(response.message || 'Failed to create dose');
            }
          },
          error: (err) => {
            console.error('Create error:', err);
            alert('Failed to create dose. Please try again.');
          }
        });
    }
  }

  deleteDose(doseId: string): void {
    if (confirm('Are you sure you want to delete this dose?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE_DOSE}`;
      
      const dose = this.doses.find(d => d.doseId === doseId);
      if (!dose) {
        alert('Dose not found');
        return;
      }
      
      // Send the entire DrugDose object as the backend expects
      this.http.delete<ApiResponse>(deleteUrl, { body: dose })
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.loadDrugDoses();
            } else {
              alert(response.message || 'Failed to delete dose');
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            alert('Failed to delete dose. Please try again.');
          }
        });
    }
  }

  editDose(doseId: string): void {
    const dose = this.doses.find(d => d.doseId === doseId);
    if (dose) {
      this.isEditMode = true;
      this.formData = { ...dose };
      this.showModal = true;
    }
  }

  // Helper method to get drug type name by ID
  getDrugTypeName(drugTypeId: string): string {
    const drugType = this.drugTypes.find(dt => dt.drugTypeId === drugTypeId);
    return drugType ? drugType.typeName : 'N/A';
  }
}