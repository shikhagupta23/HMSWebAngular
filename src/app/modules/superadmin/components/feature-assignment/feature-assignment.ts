import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatureAccessService } from '../../services/feature-access-service';
import { UsersService } from '../../services/users-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { SignalRService } from '../../../../shared/services/signal-rservice';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth-service';

declare const bootstrap: any;

@Component({
  selector: 'app-feature-assignment',
  standalone: false,
  templateUrl: './feature-assignment.html',
  styleUrl: './feature-assignment.scss',
})
export class FeatureAssignment implements OnInit {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;
  assignForm!: FormGroup;
  dataList: any[] = [];
  featureList: any[] = [];
  hospitalList: any[] = [];
  userList: any[] = [];
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';
  selectedId: any = null;
  whatsAppForm!: FormGroup;
  selectedFeatureAccessId!: string;
  selectedHospitalId!: string;
  whatsAppConfigDataAvailable = false;
  whatsAppConfigData: any 
  private fb = inject(FormBuilder);
  private api = inject(FeatureAccessService);
  private usersApi = inject(UsersService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

 initWhatsAppForm() {
  this.whatsAppForm = this.fb.group({
    whatsAppNumber: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10,15}$/) // country code supported
      ]
    ],
    totalMessageCount: [
      null,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],
    validFrom: [
      null,
      Validators.required
    ],
    validTo: [
      null,
      Validators.required
    ],
    providerName: [
      '',
      Validators.required
    ],
    apiKey: [
      '',
      Validators.required
    ]
  }, { validators: this.dateRangeValidator });
}

  private signalRService = inject(SignalRService);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    this.initWhatsAppForm();
    this.loadList();
    this.loadFeatureList();
    
    if (this.isSuperAdmin) {
      this.loadHospitalList();
    } else {
      const hospitalId = this.loggedInHospitalId;

      this.assignForm.patchValue({
        hospitalId: hospitalId
      });

      this.assignForm.get('hospitalId')?.disable();

      this.loadUsersForNonSuperAdmin();
    }

    this.assignForm.get('featureId')?.valueChanges.subscribe(featureId => {
      if (!featureId) return;

      if (this.isSuperAdmin) {
        this.assignForm.get('hospitalId')?.enable();
        this.assignForm.get('hospitalId')?.reset();
        this.assignForm.get('userId')?.disable();
        this.userList = [];
      } else {
        this.loadUsersForNonSuperAdmin();
      }
    });

      // 🔥 HOSPITAL CHANGE HANDLER (SuperAdmin only)
    this.assignForm.get('hospitalId')?.valueChanges.subscribe(hospitalId => {
      if (!hospitalId || !this.isSuperAdmin) return;

      const featureId = this.assignForm.get('featureId')?.value;
      if (!featureId) return;

      this.loadUsersForSuperAdmin(hospitalId, featureId);
    });

    this.assignForm.get('featureId')?.valueChanges.subscribe(v => {
      if (this.isSuperAdmin) {
        this.assignForm.get('canAddAnotherUser')?.enable();
      }
    });

    this.signalRService.connect().then(() => {
      this.subscriptions.push(
        this.signalRService.onFeatureAssigned().subscribe(() => {
          this.onFeatureAssignSignalR();
        })
      )
    });
  }
  ngAfterViewInit(): void {
    const modalEl = document.getElementById('featureAssignModal');

    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
      });
    }
    const whatsAppModalEl = document.getElementById('whatsAppConfigModal');
  if (whatsAppModalEl) {
    whatsAppModalEl.addEventListener('hidden.bs.modal', () => {
      this.resetWhatsAppForm();
    });
  }
  }
  resetWhatsAppForm(): void {
  this.whatsAppForm.reset();

  this.whatsAppConfigDataAvailable = false;
  this.whatsAppConfigData = null;

  this.selectedFeatureAccessId = '';
  this.selectedHospitalId = '';
}


  loadUsersForAdminRole() {
    this.usersApi.getRoleId('admin').subscribe({
      next: (res: any) => {
        const roles = res.dataList;
        const adminRole = roles.find((r: any) =>
          (r.name || r.Name || r.roleName || r.RoleName || '')
            .toString()
            .toLowerCase()
            .includes('admin')
        );
        const roleId = adminRole
          ? adminRole.id ?? adminRole.roleId ?? adminRole.RoleId ?? adminRole.Id
          : '';
        this.loadUserList(roleId);
      },
      error: (err) => {
        this.loadUserList('');
      },
    });
  }

  initForm() {
    this.assignForm = this.fb.group({
      featureId: [null, Validators.required],
      hospitalId: [{ value: null, disabled: true }, Validators.required],
      userId: [{ value: null, disabled: true }, Validators.required],
      canAddAnotherUser: [{ value: false, disabled: true }],
    });
  }
  loadList() {
    this.api.getFeatureAccess(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        this.dataList = res.dataList;
        this.pageNumber = res.pageNumber ?? this.pageNumber;
        this.pageSize = res.pageSize ?? this.pageSize;
        this.totalCount = res.totalCount ?? res.total ?? this.dataList?.length ?? 0;
        const computedPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        this.totalPages = res.totalPages ?? computedPages;
      },
      error: (err) => {
        this.toast.error('Failed to load feature assignments');
      },
    });
  }

  loadFeatureList() {
    this.api.getFeatureList().subscribe({
      next: (res: any) => {
        this.featureList = res?.dataList;
      },
      error: (err) => {
        this.toast.error('Failed to load feature list');
      },
    });
  }

  loadHospitalList() {
    this.api.getHospitalList().subscribe({
      next: (res: any) => {
        this.hospitalList = res?.dataList;
      },
      error: (err) => {
        this.toast.error('Failed to load hospital list');
      },
    });
  }

  loadUserList(role: string = '', search: string = '') {
    const roleToUse = role || '';
    this.api.getUserList(roleToUse, 1, 100, search).subscribe({
      next: (res: any) => {
        this.userList = res?.data ?? res?.items ?? res ?? [];
      },
      error: (err) => {
        this.toast.error('Failed to load user list');
      }
    });
  }

  onSearch() {
    this.pageNumber = 1;
    this.loadList();
  }

  onPageSizeChange() {
    this.pageNumber = 1;
    this.loadList();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadList();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadList();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadList();
    }
  }

  onSubmit() {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const payload: any = {
      featureId: this.assignForm.value.featureId,
      name: this.assignForm.value.name,
      hospitalId: this.isSuperAdmin ? this.assignForm.value.hospitalId : this.loggedInHospitalId,
      userId: this.assignForm.value.userId,
      canAddAnotherUser: !!this.assignForm.value.canAddAnotherUser,
      assignedBy: this.authService.getLoggedInUserId(),
    };
    if (this.selectedId != null) {
      payload.id = this.selectedId;
    }

    this.api.saveFeatureAccess(payload).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          // ❌ API responded but operation failed
          this.toast.error(res?.message || 'Failed to save feature assignment');
          return;
        }

        // ✅ SUCCESS
        this.toast.success(res?.message || 'Feature assignment saved');
        this.closeModal();
        this.selectedId = null;
        this.assignForm.reset();
        this.loadList();
      },
      error: (err) => {
        this.toast.error('Failed to save feature assignment');
      },
    });
  }
  closeModal(): void {
    this.closeModalBtn?.nativeElement.click();
  }
  onEdit(item: any) {
    this.selectedId = item.id ?? item.featureAccessId ?? null;
    this.assignForm.patchValue({
      featureId: item.featureId ?? item.FeatureId ?? null,
      name: item.name ?? item.Name ?? '',
      hospitalId: item.hospitalId ?? item.HospitalId ?? null,
      userId: item.userId ?? item.UserId ?? null,
      canAddAnotherUser: !!(item.canAddAnotherUser ?? item.canAddAnother ?? item.CanAddAnotherUser),
    });

    const modalEl = document.getElementById('featureAssignModal');
    if (modalEl) {
      const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      m.show();
    }
  }
  //   closeModal(): void {
  //   this.closeModalBtn?.nativeElement.click();
  // }

  onToggleExtend(item: any, checked: boolean) {
    const id = item.featureAccessId;

    if (!id) {
      this.toast.error('Unable to determine record id');
      return;
    }

    const prevExtend = item.isExtend ?? item.isExtended;

    // UI: optimistic update
    item._updatingExtend = true;
    item.isExtend = checked;
    item.isExtended = checked;

    this.api.updateStatus(id, checked).subscribe({
     next: (res: any) => {
  if (!res?.isSuccess) {
    // ❌ API responded but failed
    this.toast.error(res?.message || 'Failed to update extend status');
    item._updatingExtend = false;
    return;
  }

  // ✅ SUCCESS
  this.toast.success(res?.message || 'Extend status updated');
  item._updatingExtend = false;
},


      error: (err) => {
        // revert UI state
        item.isExtend = prevExtend;
        item.isExtended = prevExtend;
        item._updatingExtend = false;

        this.toast.error('Failed to update extend status');
      },
    });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  loadUsersAsPerSelection() {
    const hospitalId = this.assignForm.get('hospitalId')?.value;
    const featureId = this.assignForm.get('featureId')?.value;
    const role = 'SuperAdmin';

    if (!hospitalId || !featureId) {
      this.userList = [];
      return;
    }

    this.api.getUsersAsPerHospitalFeature(hospitalId, featureId, role).subscribe({
      next: (res: any) => {
        this.userList = res?.dataList ?? [];
      },
      error: () => {
        this.toast.error('Failed to load users');
        this.userList = [];
      },
    });
  }
  resetForm() {
    this.assignForm.reset();
    this.assignForm.get('hospitalId')?.disable();
    this.assignForm.get('userId')?.disable();
    this.assignForm.get('canAddAnotherUser')?.disable();
    this.userList = [];
  }
  openWhatsAppModal(item: any) {
  this.selectedFeatureAccessId = item.featureAccessId || item.id;
  this.selectedHospitalId = item.hospitalId || item.HospitalId;
console.log('Selected Feature Access ID:', this.selectedFeatureAccessId, item);
  // reset form first
  this.whatsAppForm.reset();

  const modalEl = document.getElementById('whatsAppConfigModal');
  const modal =
    bootstrap.Modal.getInstance(modalEl!) || new bootstrap.Modal(modalEl!);
  modal.show();

  // 🔹 CALL API TO GET EXISTING DATA
  this.api
    .getWhatsAppFeatureDetail(this.selectedFeatureAccessId, this.selectedHospitalId)
    .subscribe({
      next: (res: any) => {
        if (!res?.isSuccess ) {
          // no config exists yet → fresh form
          return;
        }
this.whatsAppConfigData=res.dataList[0];
console.log('WhatsApp Config Data Loaded:', this.whatsAppConfigData);
        const d = res.dataList[0];
console.log('WhatsApp Config Data:', d, 'jjjjjjjjjjjj', res);
this.whatsAppConfigDataAvailable = res.dataList && res.dataList.length > 0;
        // ✅ PATCH FORM
        this.whatsAppForm.patchValue({
          whatsAppNumber: d.whatsAppNumber,
          totalMessageCount: d.totalMessageCount,
          validFrom: d.validFrom ? d.validFrom.split('T')[0] : null,
          validTo: d.validTo ? d.validTo.split('T')[0] : null,
          providerName: d.providerName,
          apiKey: d.apiKey
        });
      },
      error: () => {
        // silent fail (new config scenario)
      }
    });
}

saveWhatsAppConfig() {
  if (this.whatsAppForm.invalid) {
    this.whatsAppForm.markAllAsTouched();
    return;
  }

  const payload = {
    featureAccessId: this.selectedFeatureAccessId,
    hospitalId: this.selectedHospitalId,
    ...this.whatsAppForm.value
  };

  this.api.saveWhatsAppFeatureDetail(payload).subscribe({
    next: (res: any) => {
      if (!res?.isSuccess) {
        this.toast.error(res?.message || 'Failed to save WhatsApp config');
        return;
      }

      this.toast.success('WhatsApp configured successfully');

      const modalEl = document.getElementById('whatsAppConfigModal');
      bootstrap.Modal.getInstance(modalEl!)?.hide();
    },
    error: () => this.toast.error('Failed to save WhatsApp config')
  });
}
dateRangeValidator(group: FormGroup) {
  const from = group.get('validFrom')?.value;
  const to = group.get('validTo')?.value;

  if (from && to && new Date(to) < new Date(from)) {
    return { dateInvalid: true };
  }
  return null;
}
  private onFeatureAssignSignalR() : void{
    this.loadList();
  }

  get isSuperAdmin(): boolean {
    return this.authService.role?.toLowerCase() === 'superadmin';
  }

  get loggedInHospitalId(): string | null {
    return this.authService.currentUser?.hospitalId ?? null;
  }

  loadUsersForNonSuperAdmin() {
    const featureId = this.assignForm.get('featureId')?.value;
    const hospitalId = this.loggedInHospitalId;

    if (!featureId || !hospitalId) {
      this.userList = [];
      return;
    }

    this.api
      .getUsersAsPerHospitalFeature(
        hospitalId,
        featureId,
        this.authService.role ?? ''
      )
      .subscribe({
        next: (res: any) => {
          this.userList = res?.dataList ?? [];
          this.assignForm.get('userId')?.enable();
        },
        error: () => {
          this.toast.error('Failed to load users');
          this.userList = [];
        }
      });
  }

  loadUsersForSuperAdmin(hospitalId: string, featureId: string) {
    this.api
      .getUsersAsPerHospitalFeature(
        hospitalId,
        featureId,
        'SuperAdmin'
      )
      .subscribe({
        next: (res: any) => {
          this.userList = res?.dataList ?? [];
          this.assignForm.get('userId')?.enable();
        },
        error: () => {
          this.toast.error('Failed to load users');
          this.userList = [];
        }
      });
  }

}
