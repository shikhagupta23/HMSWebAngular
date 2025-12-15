import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatureService } from '../../services/feature-service';
import { ToastService } from '../../../../shared/services/toast-service';

declare const bootstrap: any;

@Component({
  selector: 'app-create-feature',
  standalone: false,
  templateUrl: './create-feature.html',
  styleUrl: './create-feature.scss',
})
export class CreateFeature implements OnInit {
  featureForm!: FormGroup;
  dataList: any[] = [];
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';
  selectedFeatureId: any = null;

  private fb = inject(FormBuilder);
  private api = inject(FeatureService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.initForm();
    this.loadFeatures();
  }

  initForm() {
    this.featureForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  loadFeatures() {
    this.api.getFeatures(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        this.dataList = res.dataList ?? res.items ?? res.data ?? res.result ?? (Array.isArray(res) ? res : []);
        this.pageNumber = res.pageNumber ?? this.pageNumber;
        this.pageSize = res.pageSize ?? this.pageSize;
        this.totalCount = res.totalCount ?? res.total ?? (this.dataList?.length ?? 0);
        const computedPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        this.totalPages = res.totalPages ?? computedPages;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load features');
      }
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
    const payload: any = {
      name: nameVal,
      description: nameVal,
      featureUniqueEnumKey: nameVal,
      featureTypeId: 0
    };
    if (this.selectedFeatureId != null) {
      payload.id = this.selectedFeatureId;
      payload.featureId = this.selectedFeatureId;
    }

    this.api.saveFeature(payload).subscribe({
      next: (res) => {
        this.toast.success('Feature saved successfully');
        const modalEl = document.getElementById('createFeatureModal');
        if (modalEl) {
          const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          m.hide();
        }
            this.selectedFeatureId = null;
            this.featureForm.reset();
        this.loadFeatures();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to save feature');
      }
    });
  }

  onEdit(item: any) {
    this.selectedFeatureId = item.id ?? item.featureId ?? item.FeatureId ?? null;
    this.featureForm.patchValue({
      name: item.name ?? item.Name ?? ''
    });

    const modalEl = document.getElementById('createFeatureModal');
    if (modalEl) {
      const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      m.show();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

}
