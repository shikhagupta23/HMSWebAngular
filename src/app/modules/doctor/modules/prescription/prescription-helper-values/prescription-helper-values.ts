import { Component, inject, OnInit } from '@angular/core';
import { PrescriptionService } from '../services/prescription-service';
import { ToastService } from '../../../../../shared/services/toast-service';
declare var bootstrap: any;

@Component({
  selector: 'app-prescription-helper-values',
  standalone: false,
  templateUrl: './prescription-helper-values.html',
  styleUrl: './prescription-helper-values.scss',
})
export class PrescriptionHelperValues implements OnInit{

  private prescService = inject(PrescriptionService);
  private toast = inject(ToastService);

  tabs: { name: string; masterId: string }[] = [];
  activeTab!: { name: string; masterId: string };
  listData: any[] = [];
  inputValue = '';
  pageNumber = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;
  pages: number[] = [];
  searchTerm = '';
  selectedItem: any = null;
  isEditMode = false;

  ngOnInit(): void {
    this.loadPrescriptionMasterValues();

    const modalEl = document.getElementById('addHelperModal');
    modalEl?.addEventListener('hidden.bs.modal', () => {
      this.isEditMode = false;
      this.selectedItem = null;
      this.inputValue = '';
    });
  }

  onTabClick(tab: any) {
    this.activeTab = tab;
    this.pageNumber = 1;

    this.isEditMode = false;
    this.selectedItem = null;
    this.inputValue = '';

    this.getListByMasterId();
  }

  openEditPopup(item: any) {
    this.isEditMode = true;
    this.selectedItem = item;
    this.inputValue = item.value;

    new bootstrap.Modal(
      document.getElementById('addHelperModal')!
    ).show();
  }

  openAddPopup() {
    this.inputValue = '';
    new bootstrap.Modal(
      document.getElementById('addHelperModal')!
    ).show();
  }

  saveData() {
    if (!this.inputValue.trim()) {
      this.toast.warning('Please enter a value');
      return;
    }

    const payload = {
      id: this.isEditMode ? this.selectedItem.id : undefined,
      prescriptionHelperMasterId: this.activeTab.masterId,
      value: this.inputValue
    };

    const apiCall = this.isEditMode
      ? this.prescService.updatePrescriptionHelperValue(payload)
      : this.prescService.savePrescriptionHeleprValue(payload);

    apiCall.subscribe({
      next: (res: any) => {
        this.toast.success(res?.message || 'Saved successfully');

        bootstrap.Modal
          .getInstance(document.getElementById('addHelperModal')!)
          ?.hide();

        this.inputValue = '';
        this.isEditMode = false;
        this.selectedItem = null;

        this.getListByMasterId();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Operation failed');
      }
    });
  }

  getListByMasterId() {
    this.prescService
      .getHelperValuesByPrescMasterIdList(
        this.activeTab.masterId,
        this.pageNumber,
        this.pageSize,
        this.searchTerm || ''
      )
      .subscribe({
        next: (res: any) => {
          if (res?.isSuccess) {

            this.listData = res.dataList ?? [];

            this.pageNumber = res.pageNumber ?? 1;
            this.pageSize = res.pageSize ?? this.pageSize;
            this.totalPages = res.totalPages ?? 0;
            this.totalCount = res.totalCount ?? 0;

            this.pages = Array.from(
              { length: this.totalPages },
              (_, i) => i + 1
            );

          } else {
            this.listData = [];
            this.pages = [];
            this.toast.error(res?.message || 'Data not found');
          }
        },
        error: () => {
          this.toast.error('Failed to load helper values');
        }
      });
  }

  loadPrescriptionMasterValues() {
    this.prescService.getPrescriptionMasterValues().subscribe({
      next: (res: any) => {
        if (res.isSuccess && res.dataList?.length) {

          this.tabs = res.dataList.map((item: any) => ({
            name: item.text,
            masterId: item.value
          }));

          this.activeTab = this.tabs[0];
          this.getListByMasterId();

          this.toast.success(res.message || 'Tabs loaded successfully');
        } else {
          this.toast.error(res.message || 'No tabs found');
        }
      },
      error: () => this.toast.error('Failed to load Helper Masters')
    });
  }

  goToPage(page: number) {
    if (page === this.pageNumber) return;
    this.pageNumber = page;
    this.getListByMasterId();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.getListByMasterId();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.getListByMasterId();
    }
  }

  deleteItem(item: any) {
    this.prescService
      .deletePrescriptionHelperValue(item.id)
      .subscribe({
        next: (res: any) => {
          this.toast.success(res?.message || 'Deleted successfully');
          this.getListByMasterId();
        },
        error: () => {
          this.toast.error('Failed to delete helper value');
        }
      });
  }
}
