import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatureService } from '../../services/feature-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { SignalRService } from '../../../../shared/services/signal-rservice';
import { Subscription } from 'rxjs';

declare const bootstrap: any;

@Component({
  selector: 'app-create-feature',
  standalone: false,
  templateUrl: './create-feature.html',
  styleUrl: './create-feature.scss',
})
export class CreateFeature implements OnInit, AfterViewInit {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;

  featureForm!: FormGroup;
  dataList: any[] = [];
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';
  selectedFeatureId: any = null;
isEditMode = false;
  private fb = inject(FormBuilder);
  private api = inject(FeatureService);
  private toast = inject(ToastService);
  private signalRService = inject(SignalRService);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadFeatures();
    
    this.signalRService.connect().then(() => {

      this.subscriptions.push(
        this.signalRService.onFeatureAdded().subscribe(() => {
          this.onFeatureAddSignalR();
        })
      )
    });
  }

  ngAfterViewInit(): void {
  const modalEl = document.getElementById('createFeatureModal');

  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', () => {
      this.featureForm.reset();
      this.isEditMode = false;
      this.selectedFeatureId = null;
    });
  }
}


  resetFeatureForm() {
    this.featureForm.reset();

    this.featureForm.markAsPristine();
    this.featureForm.markAsUntouched();
  }

  initForm() {
    this.featureForm = this.fb.group({
      name: ['', Validators.required],
      featureKey: ['', Validators.required],
    });
  }

  loadFeatures() {
    this.api.getFeatures(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        this.dataList =
          res.dataList ?? res.items ?? res.data ?? res.result ?? (Array.isArray(res) ? res : []);
        this.pageNumber = res.pageNumber ?? this.pageNumber;
        this.pageSize = res.pageSize ?? this.pageSize;
        this.totalCount = res.totalCount ?? res.total ?? this.dataList?.length ?? 0;
        const computedPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        this.totalPages = res.totalPages ?? computedPages;
      },
      error: (err) => {
        this.toast.error('Failed to load features');
      },
    });
  }

  onSearch() {
    this.pageNumber = 1;
    this.loadFeatures();
  }

  onPageSizeChange() {
    this.pageNumber = 1;
    this.loadFeatures();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadFeatures();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadFeatures();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadFeatures();
    }
  }

 onSubmit() {
  if (this.featureForm.invalid) {
    this.featureForm.markAllAsTouched();
    return;
  }

  const nameVal = this.featureForm.value.name;
  const featureKeyVal = this.featureForm.value.featureKey;

  const payload: any = {
    name: nameVal,
    description: nameVal,
    featureUniqueEnumKey: featureKeyVal,
    featureTypeId: 0,
  };

  // 🔁 EDIT MODE → UPDATE API
  if (this.isEditMode && this.selectedFeatureId) {
    payload.id = this.selectedFeatureId;

    this.api.updateFeature(payload).subscribe({
      next: (res: any) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to update feature');
          return;
        }

        this.toast.success(res?.message || 'Feature updated successfully');
        this.afterSave();
      },
      error: () => this.toast.error('Failed to update feature'),
    });

    return;
  }

  // ➕ CREATE MODE → SAVE API
  this.api.saveFeature(payload).subscribe({
    next: (res: any) => {
      if (!res?.isSuccess) {
        this.toast.error(res?.message || 'Failed to save feature');
        return;
      }

      this.toast.success(res?.message || 'Feature saved successfully');
      this.afterSave();
    },
    error: () => this.toast.error('Failed to save feature'),
  });
}
afterSave() {
  this.closeModal();
  this.featureForm.reset();
  this.featureForm.markAsPristine();
  this.featureForm.markAsUntouched();

  this.isEditMode = false;
  this.selectedFeatureId = null;

  this.loadFeatures();
}


  onEdit(item: any) {
  this.isEditMode = true;
  this.selectedFeatureId = item.id ?? item.featureId ?? item.FeatureId ?? null;

  this.featureForm.patchValue({
    name: item.name ?? item.Name ?? '',
    featureKey: item.featureUniqueEnumKey ?? item.FeatureUniqueEnumKey ?? '',
  });

  const modalEl = document.getElementById('createFeatureModal');
  if (modalEl) {
    const modal =
      bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
  }
}


  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  closeModal(): void {
  this.closeModalBtn?.nativeElement.click();
}

private onFeatureAddSignalR(): void{
  this.loadFeatures();
}

  deleteFeature(f: any) {
    this.api.deleteFeature(f.id).subscribe({
      next: (res: any) => {
        if (res?.isSuccess) {
          this.toast.success(res.message || ' Feature deleted successfully');
          this.loadFeatures();
        } else {
          this.toast.error(res?.message || 'Delete failed');
        }
      },
      error: () => {
        this.toast.error('Failed to delete test');
      }
    });
}

}
