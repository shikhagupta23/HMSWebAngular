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

  ngOnInit(): void {
    this.loadPrescriptionMasterValues();
  }

  onTabClick(tab: any) {
    this.activeTab = tab;
    this.getListByMasterId();
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
      prescriptionHelperMasterId: this.activeTab.masterId,
      value: this.inputValue
    };

    this.prescService.savePrescriptionHeleprValue(payload).subscribe({
      next: (res: any) => {
        this.toast.success(
          res?.message || 'Helper value saved successfully!'
        );

        bootstrap.Modal
          .getInstance(document.getElementById('addHelperModal')!)
          ?.hide();

        this.inputValue = '';
        this.getListByMasterId();
      },
      error: (err) => {
        this.toast.error(
          err?.error?.message || 'Failed to save helper value'
        );
      }
    });
  }

  getListByMasterId() {
    this.prescService
      .getHelperValuesByPrescMasterIdList(this.activeTab.masterId)
      .subscribe(res => {
        if(res.isSuccess){
          this.listData = res.dataList || [];
        }
        else{
          this.toast.error(res.message || 'Data Not Found!')
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

}
