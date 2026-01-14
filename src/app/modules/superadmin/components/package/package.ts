import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PackageService } from '../../services/package-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { SignalRService } from '../../../../shared/services/signal-rservice';
import { Subscription } from 'rxjs';

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
export class Package implements OnInit, OnDestroy {
  private toast = inject(ToastService);
  private signalRService = inject(SignalRService);
  private subscriptions: Subscription[] = [];
  packages: PackageModel[] = [];
  packageForm: FormGroup;
  loading = false;
  searchTerm = '';
  
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;

  // Edit mode tracking
  isEditMode = false;
  currentPackageId: string | null = null;

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
    this.signalRService.connect().then(() => {
      this.subscriptions.push(
        this.signalRService.onPackageCreated().subscribe(() => {
          this.onPackageAddSignalR();
        })
      );
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
        this.toast.error('Failed to load packages. Please try again.');
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentPackageId = null;
    this.packageForm.reset({ isActive: true });
    
    const addModal = document.getElementById('addPackageModal');
    if (addModal) {
      const modal = new (window as any).bootstrap.Modal(addModal);
      modal.show();
    }
  }

  openEditModal(pkg: PackageModel): void {
    this.isEditMode = true;
    this.currentPackageId = pkg.packageId || null;
    
    this.packageForm.patchValue({
      packageName: pkg.packageName,
      description: pkg.description,
      price: pkg.price,
      durationInDays: pkg.durationInDays,
      isActive: pkg.isActive
    });

    const editModal = document.getElementById('editPackageModal');
    if (editModal) {
      const modal = new (window as any).bootstrap.Modal(editModal);
      modal.show();
    }
  }

  savePackage(): void {
    if (this.packageForm.invalid) {
      Object.keys(this.packageForm.controls).forEach(key => {
        this.packageForm.controls[key].markAsTouched();
      });
      return;
    }

    const packageData = this.packageForm.value;
    
    if (this.isEditMode && this.currentPackageId) {
      this.updatePackage(this.currentPackageId, packageData);
    } else {
      this.addPackage(packageData);
    }
  }

  addPackage(packageData: PackageModel): void {
    this.loading = true;
    this.packageService.addPackage(packageData).subscribe({
      next: (response) => {
        if(response.isSuccess){
          this.toast.success(response.message || "Package saved successfully!");
          this.loadPackages();
          this.loading = false;
          this.closeModal('addPackageModal');
        }
        else{
          this.toast.error(response.message || "Failed to saved package!!");
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error adding package:', err);
        this.toast.error('Failed to add package. Please try again.');
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
        if(response.isSuccess){
          this.toast.success('Package updated successfully!');
          this.loadPackages();
          this.closeModal('editPackageModal');
          this.loading = false;
        }
        else{
          this.toast.error(response.message);
          this.loading = false;
        }
      },
      error: (err) => {
        this.toast.error(err.error || 'Failed to update package. Please try again.');
        this.loading = false;
      }
    });
  }

toggleStatus(pkg: PackageModel, event: Event): void {
  // 1. Stop the checkbox from visually changing immediately
  event.preventDefault();
  event.stopPropagation();

  // 2. Store the package we want to change
  this.confirmPackage = { ...pkg }; 
  this.confirmAction = pkg.isActive ? 'deactivate' : 'activate';

  // 3. Open the modal
  const confirmModalEl = document.getElementById('confirmStatusModal');
  if (confirmModalEl) {
    const modal = new (window as any).bootstrap.Modal(confirmModalEl);
    modal.show();
  }
}

 confirmStatusChange(): void {
  if (!this.confirmPackage) return;
  
  const newStatus = !this.confirmPackage.isActive;
  
  this.packageService.changeStatus(this.confirmPackage.packageId!, newStatus)
    .subscribe({
      next: (response) => {
        if (response.isSuccess) {
          // Find the actual package in our list and update its status
          const pkg = this.packages.find(p => p.packageId === this.confirmPackage?.packageId);
          if (pkg) {
            pkg.isActive = newStatus; // UI updates here via data binding
          }
          
          this.toast.success(`Package ${newStatus ? 'activated' : 'deactivated'} successfully!`);
          this.closeModal('confirmStatusModal');
        } else {
          this.toast.error(response.message);
        }
      },
      error: (err) => {
      const apiMessage =
        err?.error?.message ||  
        err?.error ||          
        err?.message ||          
        'Failed to change status';

      this.toast.error(apiMessage);
      this.closeModal('confirmStatusModal');
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

    if (!modalElement) return;

    const modalInstance =
      (window as any).bootstrap.Modal.getInstance(modalElement) ||
      new (window as any).bootstrap.Modal(modalElement);

    modalInstance.hide();

    modalElement.addEventListener(
      'hidden.bs.modal',
      () => {
        document.body.classList.remove('modal-open');

        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
      },
      { once: true }
    );

    if (modalId !== 'confirmStatusModal') {
      this.packageForm.reset({ isActive: true });
      this.isEditMode = false;
      this.currentPackageId = null;
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

  private onPackageAddSignalR(): void{
    this.loadPackages();
  }
}