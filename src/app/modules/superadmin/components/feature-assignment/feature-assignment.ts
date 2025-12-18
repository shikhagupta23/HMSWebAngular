import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatureAccessService } from '../../services/feature-access-service';
import { UsersService } from '../../services/users-service';
import { ToastService } from '../../../../shared/services/toast-service';

declare const bootstrap: any;

@Component({
  selector: 'app-feature-assignment',
  standalone: false,
  templateUrl: './feature-assignment.html',
  styleUrl: './feature-assignment.scss',
})
export class FeatureAssignment implements OnInit {
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

  private fb = inject(FormBuilder);
  private api = inject(FeatureAccessService);
  private usersApi = inject(UsersService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.initForm();
    this.loadList();
    this.loadFeatureList();
    this.loadHospitalList();
    this.loadUsersForAdminRole();
  }

  loadUsersForAdminRole() {
    this.usersApi.getRoleId('admin').subscribe({
      next: (res: any) => {
        console.log('Roles:', res); 
        const roles = res.dataList ;
        const adminRole = roles.find((r: any) => (r.name || r.Name || r.roleName || r.RoleName || '').toString().toLowerCase().includes('admin'));
        const roleId = adminRole ? (adminRole.id ?? adminRole.roleId ?? adminRole.RoleId ?? adminRole.Id) : '';
        this.loadUserList(roleId);
      },
      error: (err) => {
        console.error(err);
        this.loadUserList('');
      }
    });
  }

  initForm() {
    this.assignForm = this.fb.group({
      featureId: [null, Validators.required],
      name: ['', Validators.required],
      hospitalId: [null, Validators.required],
      userId: [null, Validators.required],
      canAddAnotherUser: [false]
    });
  }

  loadList() {
    this.api.getFeatureAccess(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        console.log('Feature Access List:', res);
        this.dataList = res.dataList ;
        this.pageNumber = res.pageNumber ?? this.pageNumber;
        this.pageSize = res.pageSize ?? this.pageSize;
        this.totalCount = res.totalCount ?? res.total ?? (this.dataList?.length ?? 0);
        const computedPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        this.totalPages = res.totalPages ?? computedPages;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load feature assignments');
      }
    });
  }

  loadFeatureList() {
    this.api.getFeatureList().subscribe({
      next: (res: any) => {
        console.log('Features:', res);
        this.featureList = res?.dataList ;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  loadHospitalList() {
    this.api.getHospitalList().subscribe({
      next: (res: any) => {
        console.log('Hospitals:', res);
        this.hospitalList = res?.dataList;
      },
      error: (err) => console.error(err)
    })
  }

  loadUserList(role: string = '', search: string = '') {
    const roleToUse = role || '';
    this.api.getUserList(roleToUse, 1, 100, search).subscribe({
      next: (res: any) => {
        this.userList = res?.data ?? res?.items ?? res ?? [];
      },
      error: (err) => console.error(err)
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
      hospitalId: this.assignForm.value.hospitalId,
      userId: this.assignForm.value.userId,
      canAddAnotherUser: !!this.assignForm.value.canAddAnotherUser
    };
    if (this.selectedId != null) {
      payload.id = this.selectedId;
    }

    this.api.saveFeatureAccess(payload).subscribe({
      next: (res) => {
        this.toast.success('Feature assignment saved');
        const modalEl = document.getElementById('featureAssignModal');
        if (modalEl) {
          const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          m.hide();
        }
        this.selectedId = null;
        this.assignForm.reset();
        this.loadList();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to save feature assignment');
      }
    });
  }

  onEdit(item: any) {
    this.selectedId = item.id ?? item.featureAccessId ?? null;
    this.assignForm.patchValue({
      featureId: item.featureId ?? item.FeatureId ?? null,
      name: item.name ?? item.Name ?? '',
      hospitalId: item.hospitalId ?? item.HospitalId ?? null,
      userId: item.userId ?? item.UserId ?? null,
      canAddAnotherUser: !!(item.canAddAnotherUser ?? item.canAddAnother ?? item.CanAddAnotherUser)
    });

    const modalEl = document.getElementById('featureAssignModal');
    if (modalEl) {
      const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      m.show();
    }
  }

  onToggleExtend(item: any, checked: boolean) {
    const id = item.id ?? item.featureAccessId ?? item.FeatureAccessId ?? item.featureId ?? item.FeatureId ?? null;
    if (id == null) {
      this.toast.error('Unable to determine record id');
      return;
    }
    const prev = item.isExtend ?? item.isExtended ?? item.IsExtend ?? item.IsExtended ?? false;
    item._updatingExtend = true;
    // optimistic update
    item.isExtend = checked;
    item.isExtended = checked;

    this.api.updateStatus(id, checked).subscribe({
      next: (res) => {
        this.toast.success('Extend status updated');
        item._updatingExtend = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to update extend status');
        // revert
        item.isExtend = prev;
        item.isExtended = prev;
        item._updatingExtend = false;
      }
    });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  loadUsersAsPerSelection() {
  const hospitalId = this.assignForm.value.hospitalId;
  const featureId = this.assignForm.value.featureId;
  const role = 'admin'; // or dynamic role

  if (!hospitalId || !featureId) {
    this.userList = [];
    return;
  }

  this.api
    .getUsersAsPerHospitalFeature(hospitalId, featureId, role)
    .subscribe({
      next: (res: any) => {
        this.userList = res?.dataList ?? res?.data ?? [];
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load users');
      }
    });
}


}
