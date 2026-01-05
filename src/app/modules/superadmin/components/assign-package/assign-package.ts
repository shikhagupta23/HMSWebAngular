// assign-package.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AssignPackageService } from '../../services/assign-package-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { SignalRService } from '../../../../shared/services/signal-rservice';
import { Subscription } from 'rxjs';

interface PackageDropdown {
  id: string;
  name: string;
  price?: number;
  durationInDays?: number;
}

interface HospitalDropdown {
  id: string;
  name: string;
}

interface AssignmentModel {
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

@Component({
  selector: 'app-assign-package',
  standalone: false,
  templateUrl: './assign-package.html',
  styleUrl: './assign-package.scss',
})
export class AssignPackage implements OnInit {

  private toast = inject(ToastService);
  private signalRService = inject(SignalRService);
  private subscriptions: Subscription[] = [];
  // Data arrays
  assignments: AssignmentModel[] = [];
  hospitals: HospitalDropdown[] = [];
  packages: PackageDropdown[] = [];
  
  // Forms
  assignForm: FormGroup;
  editForm: FormGroup;
  
  // State management
  loading = false;
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  totalRecords = 0;
  minDate: string = '';

  // Selected assignment for editing
  selectedAssignment: AssignmentModel | null = null;
  
  // Confirmation modal
  confirmAction = '';
  confirmAssignment: AssignmentModel | null = null;

  constructor(
    private fb: FormBuilder,
    private assignPackageService: AssignPackageService
  ) {
    // Initialize assign form
    this.assignForm = this.fb.group({
      hospitalId: ['', Validators.required],
      packageId: ['', Validators.required],
      startDate: ['', Validators.required]
    });

    // Initialize edit form
    this.editForm = this.fb.group({
      hospitalPackageId: [''],
      hospitalId: [''],
      packageId: [''],
      startDate: ['', Validators.required],
      endDate: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Set minimum date to today
    this.minDate = new Date().toISOString().split('T')[0];
    
    this.loadHospitalDropdown();
    this.loadPackageDropdown();
    this.loadAssignments();

    this.signalRService.connect().then(() => {
      this.subscriptions.push(
        this.signalRService.onPackageAssigned().subscribe(() => {
          this.onPackageAssignSignalR();
        })
      )
    })
  }

  /**
   * Load hospital dropdown data from API
   */
  loadHospitalDropdown(): void {
    this.assignPackageService.getHospitalDropdown().subscribe({
      next: (response: any) => {
        // Handle both array and object responses
        if (Array.isArray(response)) {
          this.hospitals = response;
        } else {
          this.hospitals = response.data || response.dataList || response;
        }
      },
      error: (err) => {
        console.error('Error loading hospitals:', err);
        this.toast.error('Failed to load hospitals. Please try again.');
      }
    });
  }

  /**
   * Load package dropdown data from API
   */
  loadPackageDropdown(): void {
    this.assignPackageService.getPackageDropdown().subscribe({
      next: (response: any) => {
        // Handle both array and object responses
        if (Array.isArray(response)) {
          this.packages = response;
        } else {
          this.packages = response.data || response.dataList || response;
        }
      },
      error: (err) => {
        console.error('Error loading packages:', err);
        this.toast.error('Failed to load packages. Please try again.');
      }
    });
  }

  /**
   * Load all assignments with pagination
   */
  loadAssignments(): void {
    this.loading = true;
    this.assignPackageService.getAllHospitalPackages(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        // Handle both array and object responses
        if (Array.isArray(response)) {
          this.assignments = response;
          this.totalRecords = response.length;
        } else {
          this.assignments = response.data || response.dataList || response;
          this.totalRecords = response.totalRecords || this.assignments.length;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading assignments:', err);
        this.loading = false;
        this.toast.error('Failed to load assignments. Please try again.');
      }
    });
  }

  /**
   * Open assign modal and reset form
   */
  openAssignModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.assignForm.reset({ 
      hospitalId: '',
      packageId: '',
      startDate: today
    });
  }

  /**
   * Open edit modal with selected assignment data
   */
  openEditModal(assignment: AssignmentModel): void {
    this.selectedAssignment = assignment;
    this.editForm.patchValue({
      hospitalPackageId: assignment.hospitalPackageId,
      hospitalId: assignment.hospitalId,
      packageId: assignment.packageId,
      startDate: this.formatDateForInput(assignment.startDate),
      endDate: assignment.endDate ? this.formatDateForInput(assignment.endDate) : '',
      isActive: assignment.isActive
    });
  }

  /**
   * Save new assignment
   */
  saveAssignment(): void {
    if (this.assignForm.invalid) {
      Object.keys(this.assignForm.controls).forEach(key => {
        this.assignForm.controls[key].markAsTouched();
      });
      return;
    }

    const formValue = this.assignForm.value;
    
    // Convert date to ISO format with time
    const startDate = new Date(formValue.startDate);
    const isoStartDate = startDate.toISOString();
    
    const assignmentData = {
      hospitalId: formValue.hospitalId,
      packageId: formValue.packageId,
      startDate: isoStartDate
    };

    this.loading = true;

    this.assignPackageService.assignPackage(assignmentData as AssignmentModel).subscribe({
      next: (response) => {
        if(response.isSuccess){
        this.toast.success('Package assigned successfully!');
        this.loadAssignments();
        this.closeModal('assignPackageModal');
        this.loading = false;
        }
        else{
          this.toast.error(response.message);
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error assigning package:', err);
        this.toast.error('Failed to assign package. Please try again.');
        this.loading = false;
      }
    });
  }

  /**
   * Update existing assignment
   */
  updateAssignment(): void {
    if (this.editForm.invalid) {
      Object.keys(this.editForm.controls).forEach(key => {
        this.editForm.controls[key].markAsTouched();
      });
      return;
    }

    const assignmentData = this.editForm.value;
    this.loading = true;

    this.assignPackageService.updateAssignment(assignmentData).subscribe({
      next: (response) => {
        if(response.isSuccess){
          this.toast.success('Assignment updated successfully!');
          this.loadAssignments();
          this.closeModal('editAssignmentModal');
          this.loading = false;
        }
        else{
          this.toast.error(response.message);
        }
      },
      error: (err) => {
        console.error('Error updating assignment:', err);
        this.toast.error('Failed to update assignment. Please try again.');
        this.loading = false;
      }
    });
  }

  /**
   * Toggle assignment status with confirmation
   */
  toggleStatus(assignment: AssignmentModel, event: Event): void {
    event.preventDefault();
    
    this.confirmAssignment = assignment;
    this.confirmAction = assignment.isActive ? 'deactivate' : 'activate';
    
    const confirmModal = document.getElementById('confirmStatusModal');
    if (confirmModal) {
      const modal = new (window as any).bootstrap.Modal(confirmModal);
      modal.show();
    }
  }

  /**
   * Confirm status change
   */
  confirmStatusChange(): void {
    if (!this.confirmAssignment) return;
    
    const newStatus = !this.confirmAssignment.isActive;
    
    this.assignPackageService.changeAssignmentStatus(this.confirmAssignment.hospitalPackageId!, newStatus).subscribe({
      next: (response) => {
        if(response.isSuccess){
          this.confirmAssignment!.isActive = newStatus;
          this.toast.success(`Assignment ${newStatus ? 'activated' : 'deactivated'} successfully!`);
          this.closeModal('confirmStatusModal');
          this.confirmAssignment = null;
          this.loadAssignments();
        }
        else{
          this.toast.error(response.message);
        }

      },
      error: (err) => {
        console.error('Error changing status:', err);
        this.toast.error('Failed to change status. Please try again.');
        this.closeModal('confirmStatusModal');
        this.confirmAssignment = null;
      }
    });
  }

  /**
   * Cancel status change
   */
  cancelStatusChange(): void {
    this.confirmAssignment = null;
    this.confirmAction = '';
    this.closeModal('confirmStatusModal');
  }

  /**
   * Delete assignment with confirmation
   */
  deleteAssignment(assignment: AssignmentModel): void {
    const confirmDelete = confirm(
      `Are you sure you want to delete the assignment for "${assignment.hospitalName}"?\n\nThis action cannot be undone.`
    );
    
    if (confirmDelete) {
      this.loading = true;
      this.assignPackageService.deleteAssignment(assignment.hospitalPackageId!).subscribe({
        next: (response) => {
          if(response.isSuccess){
            this.toast.success('Assignment deleted successfully!');
            this.loadAssignments();
            this.loading = false;
          }
          else{
            this.toast.error(response.message);
          }
        },
        error: (err) => {
          this.toast.error('Failed to delete assignment. Please try again.');
          this.loading = false;
        }
      });
    }
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = parseInt(target.value, 10);
    this.currentPage = 1;
    this.loadAssignments();
  }

  /**
   * Close modal by ID
   */
closeModal(modalId: string): void {
  const modalElement = document.getElementById(modalId);

  if (modalElement) {
    let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
      modal = new (window as any).bootstrap.Modal(modalElement);
    }
    modal.hide();
  }

  // 🔥 FORCE REMOVE BACKDROP & BODY CLASS
  setTimeout(() => {
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');

    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());
  }, 200);

  // Reset forms
  if (modalId === 'assignPackageModal') {
    this.assignForm.reset({
      hospitalId: '',
      packageId: '',
      startDate: ''
    });
  } else if (modalId === 'editAssignmentModal') {
    this.editForm.reset({ isActive: true });
    this.selectedAssignment = null;
  }
}


  /**
   * Get filtered assignments based on search term
   */
  get filteredAssignments(): AssignmentModel[] {
    if (!this.searchTerm) return this.assignments;
    
    const term = this.searchTerm.toLowerCase();
    return this.assignments.filter(assignment =>
      assignment.hospitalName?.toLowerCase().includes(term) ||
      assignment.packageName?.toLowerCase().includes(term) ||
      assignment.price?.toString().includes(term)
    );
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Format date for input field (YYYY-MM-DD)
   */
  formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Get package details by ID
   */
  getPackageDetails(packageId: string): string {
    const pkg = this.packages.find(p => p.id === packageId);
    if (pkg) {
      if (pkg.price && pkg.durationInDays) {
        return `${pkg.name} - ₹${pkg.price} (${pkg.durationInDays} days)`;
      }
      return pkg.name;
    }
    return '';
  }

  /**
   * Get hospital name by ID
   */
  getHospitalName(hospitalId: string): string {
    const hospital = this.hospitals.find(h => h.id === hospitalId);
    return hospital ? hospital.name : '';
  }

  private onPackageAssignSignalR(): void{
    this.loadAssignments();
  }
}