import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface LabTest {
  id: string;
  testName: string;
  category: string;
  price: number;
  description?: string;
  createdAt?: Date;
}

@Component({
  selector: 'app-labtest',
  standalone: false,
  templateUrl: './labtest.html',
  styleUrls: ['./labtest.scss']
})
export class LabtestComponent implements OnInit {
  
  // API Configuration
  private apiBaseUrl = 'https://api-clinicmanagement.rsdemoprojects.in/api/LabTest';
  
  // Form model
  testName: string = '';
  category: string = '';
  price: number | null = null;
  description: string = '';
  
  labTests: LabTest[] = [];
  filteredLabTests: LabTest[] = [];
  searchText: string = '';
  isEditMode: boolean = false;
  editingTestId: string | null = null;
  showModal: boolean = false;
  
  // Pagination
  pages: number[] = [];

  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;
  Math = Math; // Add Math reference for template

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLabTests();
  }

  /**
   * Get HTTP headers with authorization if needed
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Open the modal
   */
  openModal(): void {
    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.showModal = false;
    document.body.classList.remove('modal-open');
    this.resetForm();
  }

  /**
   * Load lab tests from API
   */
  loadLabTests(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    
    const url = `${this.apiBaseUrl}/Get?page=${page}&pageSize=${this.pageSize}`;
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
  if (response && response.dataList && Array.isArray(response.dataList)) {
    this.labTests = response.dataList;
    this.totalCount = response.totalCount || response.dataList.length;
    this.totalPages =
      response.totalPages || Math.ceil(this.totalCount / this.pageSize);

    this.filteredLabTests = [...this.labTests];
    this.buildPages(); // ✅ ADD THIS
  } else {
    this.labTests = [];
    this.filteredLabTests = [];
    this.totalCount = 0;
    this.totalPages = 0;
    this.pages = [];
  }

  this.isLoading = false;
},

      error: (error) => {
        console.error('Error loading lab tests:', error);
        console.error('Error details:', error.error);
        alert('Failed to load lab tests. Please check console for details.');
        this.isLoading = false;
        // Initialize with empty array on error
        this.labTests = [];
        this.filteredLabTests = [];
      }
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Validation
    if (!this.testName || !this.category || this.price === null || this.price < 0) {
      alert('Please fill all required fields correctly');
      return;
    }

    if (this.isEditMode && this.editingTestId !== null) {
      this.updateTest();
    } else {
      this.addNewTest();
    }
  }

  /**
   * Add a new lab test via API
   */
  addNewTest(): void {
    const newTest = {
      testName: this.testName.trim(),
      category: this.category,
      price: this.price!,
      description: this.description?.trim() || ''
    };

    const url = `${this.apiBaseUrl}/Post`;
    
    this.http.post(url, newTest, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('Add response:', response);
        alert('Lab test added successfully');
        this.closeModal();
        this.loadLabTests(1); // Go to first page to see the new test
      },
      error: (error) => {
        console.error('Error adding lab test:', error);
        console.error('Error details:', error.error);
        alert('Failed to add lab test. Please check console for details.');
      }
    });
  }

  /**
   * Update an existing lab test via API
   */
  updateTest(): void {
    const updatedTest = {
      id: this.editingTestId,
      testName: this.testName.trim(),
      category: this.category,
      price: this.price!,
      description: this.description?.trim() || ''
    };

    const url = `${this.apiBaseUrl}/Put`;
    
    this.http.put(url, updatedTest, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('Update response:', response);
        alert('Lab test updated successfully');
        this.closeModal();
        this.loadLabTests(this.currentPage); // Reload current page
      },
      error: (error) => {
        console.error('Error updating lab test:', error);
        console.error('Error details:', error.error);
        alert('Failed to update lab test. Please check console for details.');
      }
    });
  }

  /**
   * Edit a lab test
   */
  editTest(test: LabTest): void {
    this.isEditMode = true;
    this.editingTestId = test.id;
    
    this.testName = test.testName;
    this.category = test.category;
    this.price = test.price;
    this.description = test.description || '';

    this.openModal();
  }

  /**
   * Delete a lab test via API
   */
  deleteTest(testId: string): void {
    if (confirm('Are you sure you want to delete this lab test?')) {
      const url = `${this.apiBaseUrl}/Delete?id=${testId}`;
      
      this.http.delete(url, { headers: this.getHeaders() }).subscribe({
        next: (response) => {
          console.log('Delete response:', response);
          alert('Lab test deleted successfully');
          
          // If current page becomes empty after delete, go to previous page
          if (this.filteredLabTests.length === 1 && this.currentPage > 1) {
            this.loadLabTests(this.currentPage - 1);
          } else {
            this.loadLabTests(this.currentPage);
          }
          
          // Reset form if editing the deleted test
          if (this.editingTestId === testId) {
            this.resetForm();
          }
        },
        error: (error) => {
          console.error('Error deleting lab test:', error);
          console.error('Error details:', error.error);
          alert('Failed to delete lab test. Please check console for details.');
        }
      });
    }
  }

  /**
   * Search/filter lab tests (client-side filtering)
   */
  filterTests(): void {
    if (!this.searchText.trim()) {
      this.filteredLabTests = [...this.labTests];
      return;
    }

    const searchLower = this.searchText.toLowerCase().trim();
    this.filteredLabTests = this.labTests.filter(test =>
      test.testName.toLowerCase().includes(searchLower) ||
      test.category.toLowerCase().includes(searchLower) ||
      test.price.toString().includes(searchLower)
    );
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadLabTests(page);
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.loadLabTests(this.currentPage - 1);
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadLabTests(this.currentPage + 1);
    }
  }

  /**
   * Get array of page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Reset the form
   */
  resetForm(): void {
    this.testName = '';
    this.category = '';
    this.price = null;
    this.description = '';
    this.isEditMode = false;
    this.editingTestId = null;
  }

  onPageSizeChange(): void {
  this.currentPage = 1;
  this.loadLabTests(1);
}
buildPages(): void {
  this.pages = [];
  const maxPagesToShow = 5;

  let start = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
  let end = Math.min(this.totalPages, start + maxPagesToShow - 1);

  if (end - start < maxPagesToShow - 1) {
    start = Math.max(1, end - maxPagesToShow + 1);
  }

  for (let i = start; i <= end; i++) {
    this.pages.push(i);
  }
}

}