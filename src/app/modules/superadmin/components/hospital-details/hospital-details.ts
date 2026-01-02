import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../../../environment/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../services/users-service';
import { HospitalService } from '../../services/hospital-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { AuthService } from '../../../auth/services/auth-service';
declare const bootstrap: any;
@Component({
  selector: 'app-hospital-details',
  standalone: false,
  templateUrl: './hospital-details.html',
  styleUrl: './hospital-details.scss',
})
export class HospitalDetails implements OnInit {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('confirmStatusModal') confirmStatusModal!: ElementRef;
  private fb = inject(FormBuilder);
  private api = inject(UsersService);
  private hospitalApi = inject(HospitalService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private location = inject(Location);

  hospitalId!: string;
  hospitalDetails: any;

  addUserForm!: FormGroup;

  isEditMode = false;
  editingUserId!: string;

  loggedInHospitalId: string | null = null;
  loggedInUserRole: string | null = null;
  filteredUsers: any[] = [];
  roles: any[] = [];
  users: any[] = [];
  totalCount = 0;
  searchTerm: string = '';
  pendingUser: any = null;
  pendingStatus: boolean | null = null;
  previousStatus: boolean | null = null;
  private confirmModalInstance: any;
  ngOnInit(): void {
    const state = history.state;

    if (state?.hospitalId) {
      const hospitalId =
        typeof state?.hospitalId === 'object' ? state.hospitalId.id : state?.hospitalId;

      this.hospitalId = hospitalId;
      this.hospitalDetails = state.hospitalDetails;
    } else {
      console.warn('No state found, fallback to route params if needed');
    }

    this.loggedInUserRole = this.auth.getUserRole?.() ?? null;

    this.initForm();
    this.loadRoles();
    this.loadUsersByHospital();
  }
   ngAfterViewInit(): void {
  // existing addUserModal logic
  const modalEl = document.getElementById('addUserModal');
  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', () => {
      this.resetAddUserForm();
    });
  }

  // ✅ USER STATUS CONFIRM MODAL ROLLBACK
  if (this.confirmStatusModal?.nativeElement) {
    const modalElcnf = this.confirmStatusModal.nativeElement;

    modalElcnf.addEventListener('hidden.bs.modal', () => {
      if (this.pendingUser) {
        this.loadUsersByHospital();
        this.pendingUser.isActive = this.previousStatus;
        this.clearPendingUserState();
      }
    });
  }
}

  /* ---------------- FORM ---------------- */

  initForm(): void {
    this.addUserForm = this.fb.group({
      FullName: ['', [Validators.required, Validators.minLength(3)]],
      Gender: ['', Validators.required],
      DateOfBirth: [''],
      RoleId: ['', Validators.required],
      HospitalId: [this.loggedInHospitalId, ,],
      Email: ['', [Validators.required, Validators.email]],
      PhoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      Password: ['', [Validators.required, Validators.minLength(6)]],
      Address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(250)]],
    });
  }

  loadUsersByHospital(): void {
    if (!this.hospitalId) {
      this.toast.error('Hospital Id not found');
      return;
    }

    this.hospitalApi
      .getUsersByHospitalId(this.hospitalId, 1, 100, '') // load once
      .subscribe({
        next: (res: any) => {
          this.users = res?.dataList || [];
          this.filteredUsers = [...this.users]; // ✅ copy
          this.totalCount = res?.totalCount || 0;
        },
        error: () => this.toast.error('Failed to load users'),
      });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter((u, index) => {
      const fields = [u.fullName, u.email, u.phone, u.userRole, u.address, u.gender];


      const match = fields.some((field) => {
        if (!field) return false;

        const value = field.toString().toLowerCase();
        const result = value.includes(term);

        return result;
      });

      return match;
    });
  }

  /* ---------------- ACTIONS ---------------- */

  goBack(): void {
    this.location.back();
  }

  getHospitalLogo(h: any): string {
    if (!h?.hospitalImage) return '';
    return `${environment.hospitalLogoPath}${h.hospitalImage}`;
  }

  onSubmit(): void {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      return;
    }

    const v = this.addUserForm.value;

    if (this.isEditMode && this.editingUserId) {
      const payload = {
        userId: this.editingUserId,
        FullName: v.FullName,
        Gender: v.Gender,
        DateOfBirth: v.DateOfBirth,
        Role: v.RoleId,
        HospitalId: this.hospitalDetails.id,
        PhoneNumber: v.PhoneNumber,
        Email: v.Email,
        Address: v.Address,
      };

      this.api.updateUser(payload).subscribe({
        next: (res: any) => {
          if (!res?.isSuccess) {
            this.toast.error(res?.message || 'Failed to update user');
            return;
          }

          this.toast.success(res?.message || 'User updated successfully');
          this.closeModal();
          this.resetEditState();
          this.loadUsersByHospital();
        },
        error: () => this.toast.error('Failed to update user'),
      });
    } else {
      const payload = {
        FullName: v.FullName,
        Gender: v.Gender,
        DateOfBirth: v.DateOfBirth,
        Role: v.RoleId,
        HospitalId: this.hospitalDetails.id,
        Email: v.Email,
        PhoneNumber: v.PhoneNumber,
        Password: v.Password,
        Address: v.Address,
        UserName: v.PhoneNumber,
      };

      this.api.addUser(payload).subscribe({
        next: (res: any) => {
          if (!res?.isSuccess) {
            // ❌ API responded but operation failed
            this.toast.error(res?.message || 'Failed to add user');
            return;
          }

          // ✅ SUCCESS
          this.toast.success(res?.message || 'User added successfully');
          this.closeModal();
          this.resetEditState();
          this.loadUsersByHospital();
        },
        error: () => this.toast.error('Failed to add user'),
      });
    }
  }

  /* ---------------- EDIT ---------------- */

 openEditUser(user: any): void {
  // 🔹 SET EDIT STATE
  this.isEditMode = true;
  this.editingUserId = user.userId || user.id;

  // 🔹 HANDLE PASSWORD FIELD
  const pwd = this.addUserForm.get('Password');
  pwd?.clearValidators();
  pwd?.disable();
  pwd?.updateValueAndValidity();

  // 🔹 CALL API FOR FULL USER DATA
  this.api.getUserById(this.editingUserId).subscribe({
    next: (res: any) => {
      if (!res?.isSuccess || !res?.data) {
        this.toast.error('Failed to load user details');
        return;
      }

      const u = res.data;

      // 🔹 PATCH FORM SAFELY
      this.addUserForm.patchValue({
        FullName: u.fullName ?? '',
        Gender: u.gender ?? '',
        DateOfBirth: u.dob ? u.dob.substring(0, 10) : null,
        RoleId: u.roleId ?? u.role ?? '',
        HospitalId: u.hospitalId ?? '',
        PhoneNumber: u.phoneNumber ?? u.phone ?? '',
        Email: u.email ?? '',
        Address: u.address ?? '',

        // 👨‍⚕️ Doctor fields (optional)
        DoctorRegistrationNo: u.doctorRegistrationNo ?? '',
        DepartmentId: u.doctorDepartmentId ?? u.doctordepartmentId ?? '',
      });

      // 🔹 OPEN MODAL AFTER PATCH
      const modalEl = document.getElementById('addUserModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      }
    },
    error: () => {
      this.toast.error('Failed to load user details');
    },
  });
}


  resetEditState(): void {
    this.isEditMode = false;
    this.editingUserId = '';

    const pwd = this.addUserForm.get('Password');
    pwd?.enable();
    pwd?.setValidators([Validators.required, Validators.minLength(6)]);
    pwd?.updateValueAndValidity();

    this.resetAddUserForm();
  }

  resetAddUserForm(): void {
    this.addUserForm.reset({
      HospitalId: this.loggedInHospitalId || '',
    });
  }

  closeModal(): void {
    this.closeModalBtn?.nativeElement.click();
  }

  /* ---------------- HELPERS ---------------- */

  loadRoles(): void {
    this.api.getSystemRoles().subscribe({
      next: (res: any) => (this.roles = res?.dataList || []),
      error: () => this.toast.error('Failed to load roles'),
    });
  }

  onEmailInput(): void {
    const ctrl = this.addUserForm.get('Email');
    if (ctrl?.value) {
      ctrl.setValue(ctrl.value.toLowerCase(), { emitEvent: false });
    }
  }

  onToggleExtend(item: any, checked: boolean) {
    const userId = item.userId || item.id;

    if (!userId) {
      this.toast.error('Unable to determine user id');
      return;
    }

    // store pending state
    this.pendingUser = item;
    this.pendingStatus = checked;
    this.previousStatus = item.isActive;

    // allow UI to show toggled state temporarily
    item.isActive = checked;

    // open confirmation modal
    this.confirmModalInstance = new bootstrap.Modal(this.confirmStatusModal.nativeElement);
    this.confirmModalInstance.show();
  }
  confirmUserStatusUpdate() {
    if (!this.pendingUser) return;

    const item = this.pendingUser;
    const checked = this.pendingStatus!;
    const userId = item.userId || item.id;

    item._updatingExtend = true;

    this.api.updateUserStatus(userId, checked).subscribe({
      next: () => {
        this.toast.success('User status updated');
        item._updatingExtend = false;

        // ✅ clear state BEFORE closing modal
        this.clearPendingUserState();

        this.confirmModalInstance?.hide();
      },
      error: () => {
        // rollback on API failure
        item.isActive = this.previousStatus;
        item._updatingExtend = false;

        this.toast.error('Failed to update user status');

        this.clearPendingUserState();
        this.confirmModalInstance?.hide();
      },
    });
  }
  clearPendingUserState() {
    this.pendingUser = null;
    this.pendingStatus = null;
    this.previousStatus = null;
  }
}
