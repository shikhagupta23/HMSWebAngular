import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environment/environment.delvelopment';

// Updated interface to match API response
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
  selector: 'app-drug-type',
  standalone: false,
  templateUrl: './drugtype.html',
  styleUrls: ['./drugtype.css']
})
export class DrugTypeComponent implements OnInit {
  drugTypes: DrugType[] = [];
  filteredDrugTypes: DrugType[] = [];
  paginatedDrugTypes: DrugType[] = [];
  showModal = false;
  isEditMode = false;
  formData: DrugType = { 
    drugTypeId: '', 
    typeName: '', 
    description: '',
    isActive: true 
  };
  entriesPerPage = 10;
  searchTerm = '';
  isLoading = false;
  error = '';

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  // API Endpoints - Updated to match backend routes
  private readonly API_ENDPOINTS = {
    GET_ALL: '/DrugManagement/getAllDrugType',
    CREATE: '/DrugManagement/createDrugType',
    UPDATE: '/DrugManagement/updateDrugType',
    DELETE: '/DrugManagement/deleteDrugType'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugTypes();
  }

  loadDrugTypes(): void {
    this.isLoading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.entriesPerPage.toString());

    // Add search term if it exists
    if (this.searchTerm && this.searchTerm.trim()) {
      params = params.set('searchTerm', this.searchTerm.trim());
    }

    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL}`;

    this.http.get<DrugTypeResponse>(apiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          
          if (response.isSuccess) {
            this.drugTypes = response.dataList || [];
            this.paginatedDrugTypes = response.dataList || [];
            this.totalCount = response.totalCount;
            this.totalPages = response.totalPages;
            this.filteredDrugTypes = response.dataList || [];
          } else {
            this.error = response.message || 'Failed to load drug type data';
            this.drugTypes = [];
            this.paginatedDrugTypes = [];
            this.filteredDrugTypes = [];
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load drug type data';
          console.error('API Error:', err);
          this.drugTypes = [];
          this.paginatedDrugTypes = [];
          this.filteredDrugTypes = [];
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    // Reset to page 1 when searching
    this.currentPage = 1;
    // Server-side search through API
    this.loadDrugTypes();
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadDrugTypes();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDrugTypes();
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
    return Math.min(this.currentPage * this.entriesPerPage, this.totalCount);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = { 
      drugTypeId: '', 
      typeName: '', 
      description: '',
      isActive: true 
    };
    this.showModal = true;
  }

  openEditModal(drugTypeId: string): void {
    const drugType = this.drugTypes.find(dt => dt.drugTypeId === drugTypeId);
    if (drugType) {
      this.isEditMode = true;
      this.formData = { ...drugType };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { 
      drugTypeId: '', 
      typeName: '', 
      description: '',
      isActive: true 
    };
    this.isEditMode = false;
  }

  saveDrugType(): void {
    if (!this.formData.typeName || !this.formData.typeName.trim()) {
      alert('Please enter drug type name');
      return;
    }

    if (this.isEditMode) {
      // Update existing drug type via API
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}`;
      
      this.http.put<ApiResponse>(updateUrl, this.formData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Update success:', response.message);
              this.closeModal();
              this.loadDrugTypes();
            } else {
              alert(response.message || 'Failed to update drug type');
            }
          },
          error: (err) => {
            console.error('Update error:', err);
            alert('Failed to update drug type. Please try again.');
          }
        });
    } else {
      // Create new drug type via API
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
      
      // Don't send drugTypeId for new records
      const createData = {
        typeName: this.formData.typeName,
        description: this.formData.description,
        isActive: this.formData.isActive
      };
      
      this.http.post<ApiResponse>(createUrl, createData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Create success:', response.message);
              this.closeModal();
              this.loadDrugTypes();
            } else {
              alert(response.message || 'Failed to create drug type');
            }
          },
          error: (err) => {
            console.error('Create error:', err);
            alert('Failed to create drug type. Please try again.');
          }
        });
    }
  }

  deleteDrugType(drugTypeId: string): void {
    if (confirm('Are you sure you want to delete this drug type?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}`;
      
      const drugType = this.drugTypes.find(dt => dt.drugTypeId === drugTypeId);
      if (!drugType) {
        alert('Drug type not found');
        return;
      }
      
      // Send the entire DrugType object as the backend expects
      this.http.delete<ApiResponse>(deleteUrl, { body: drugType })
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Delete success:', response.message);
              this.loadDrugTypes();
            } else {
              alert(response.message || 'Failed to delete drug type');
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            alert('Failed to delete drug type. Please try again.');
          }
        });
    }
  }
}