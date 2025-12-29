// package.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PackageService } from '../../services/package-service';

interface PackageModel {
  packageId?: string;
  packageName: string;
  description: string;
  price: number;
  durationInDays: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-package',
  standalone: false,
  templateUrl: './package.html',
  styleUrl: './package.scss',
})
export class Package implements OnInit {
  packages: PackageModel[] = [];
  packageForm: FormGroup;
  loading = false;
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;

  // Confirmation Modal
  showConfirmModal = false;
  confirmPackage: PackageModel | null = null;
  confirmAction = '';

  constructor(
    private fb: FormBuilder,
    private packageService: PackageService
  ) {
    this.packageForm = this.fb.group({
      packageName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0)]],
      durationInDays: [0, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loading = true;
    this.packageService.getPackages(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        this.packages = response.data || response;
        this.totalRecords = response.totalRecords || this.packages.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading packages:', err);
        this.loading = false;
        alert('Failed to load packages. Please try again.');
      }
    });
  }

  openAddModal(): void {
    this.packageForm.reset({ isActive: true });
    // Bootstrap modal trigger will handle opening
  }

  savePackage(): void {
    if (this.packageForm.invalid) {
      Object.keys(this.packageForm.controls).forEach(key => {
        this.packageForm.controls[key].markAsTouched();
      });
      return;
    }

    const packageData = this.packageForm.value;
    this.addPackage(packageData);
  }

  addPackage(packageData: PackageModel): void {
    this.loading = true;
    this.packageService.addPackage(packageData).subscribe({
      next: (response) => {
        console.log('Package added successfully:', response);
        alert('Package added successfully!');
        this.loadPackages();
        this.closeModal('addPackageModal');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error adding package:', err);
        alert('Failed to add package. Please try again.');
        this.loading = false;
      }
    });
  }

  updatePackage(id: string, packageData: PackageModel): void {
    this.loading = true;
    const updateData = {
      ...packageData,
      packageId: id
    };
    
    this.packageService.updatePackage(updateData).subscribe({
      next: (response) => {
        console.log('Package updated successfully:', response);
        alert('Package updated successfully!');
        this.loadPackages();
        this.closeModal('editPackageModal');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error updating package:', err);
        alert('Failed to update package. Please try again.');
        this.loading = false;
      }
    });
  }

  toggleStatus(pkg: PackageModel, event: Event): void {
    // Prevent the toggle from happening immediately
    event.preventDefault();
    
    // Store the package and action for confirmation
    this.confirmPackage = pkg;
    this.confirmAction = pkg.isActive ? 'deactivate' : 'activate';
    
    // Open confirmation modal
    const confirmModal = document.getElementById('confirmStatusModal');
    if (confirmModal) {
      const modal = new (window as any).bootstrap.Modal(confirmModal);
      modal.show();
    }
  }

  confirmStatusChange(): void {
    if (!this.confirmPackage) return;
    
    const newStatus = !this.confirmPackage.isActive;
    
    this.packageService.changeStatus(this.confirmPackage.packageId!, newStatus).subscribe({
      next: (response) => {
        console.log('Status changed successfully:', response);
        this.confirmPackage!.isActive = newStatus;
        alert(`Package ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        this.closeModal('confirmStatusModal');
        this.confirmPackage = null;
      },
      error: (err) => {
        console.error('Error changing status:', err);
        alert('Failed to change status. Please try again.');
        this.closeModal('confirmStatusModal');
        this.confirmPackage = null;
      }
    });
  }

  cancelStatusChange(): void {
    this.confirmPackage = null;
    this.confirmAction = '';
    this.closeModal('confirmStatusModal');
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = parseInt(target.value, 10);
    this.currentPage = 1;
    this.loadPackages();
  }

  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    if (modalId !== 'confirmStatusModal') {
      this.packageForm.reset({ isActive: true });
    }
  }

  get filteredPackages(): PackageModel[] {
    if (!this.searchTerm) return this.packages;
    
    const term = this.searchTerm.toLowerCase();
    return this.packages.filter(pkg =>
      pkg.packageName.toLowerCase().includes(term) ||
      pkg.description.toLowerCase().includes(term) ||
      pkg.price.toString().includes(term)
    );
  }

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
}