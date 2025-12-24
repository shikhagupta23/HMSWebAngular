import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../services/users-service';
import { HospitalService } from '../../services/hospital-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { AuthService } from '../../../auth/services/auth-service';

declare const bootstrap: any;

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit, AfterViewInit {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;

  dataList: any[] = [];
  isEditMode = false;
editingUserId: string | null = null;

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';

  addUserForm!: FormGroup;
  roles: any[] = [];
  hospitals: any[] = [];
  loggedInHospitalId: any = null;
  loggedInUserRole: string | null = null;

  private fb = inject(FormBuilder);
  private api = inject(UsersService);
  private hospitalApi = inject(HospitalService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    // read logged in user's hospitalId from localStorage
    try {
      const authRaw = localStorage.getItem('auth_user');
      const authObj = authRaw ? JSON.parse(authRaw) : null;
      this.loggedInHospitalId = authObj?.hospitalId ?? authObj?.HospitalId ?? null;
    } catch (e) {
      this.loggedInHospitalId = null;
    }
    // determine logged-in user's role from token
    try {
      this.loggedInUserRole = this.auth.getUserRole();
    } catch (e) {
      this.loggedInUserRole = null;
    }

    this.initForm();
    this.loadUsers();
    this.loadRoles();
    this.loadHospitals();
  }
  ngAfterViewInit(): void {
    const modalEl = document.getElementById('addUserModal');

    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.resetAddUserForm();
      });
    }
  }
  resetAddUserForm() {
    this.addUserForm.reset({
      HospitalId: this.loggedInHospitalId || '',
    });

    this.addUserForm.markAsPristine();
    this.addUserForm.markAsUntouched();
  }

  initForm() {
    this.addUserForm = this.fb.group({
      FullName: ['', [Validators.required, Validators.minLength(3)]],

      Gender: ['', Validators.required],

      DateOfBirth: [''],

      RoleId: ['', Validators.required],

      HospitalId: [
        this.loggedInHospitalId || '',
        this.showHospitalSelect ? Validators.required : [],
      ],

      Email: ['', [Validators.required, Validators.email]],

      PhoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],

     Password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],

      Address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(250)]],
    });
  }

  loadUsers() {
    this.api.getUsers(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
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
        console.error(err);
        this.toast.error('Failed to load users');
      },
    });
  }

  loadRoles() {
    this.api.getSystemRoles().subscribe({
      next: (res: any) => {
        // API may return { dataList:null, data: { ... } } or array
        this.roles = res.dataList;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load roles');
      },
    });
  }

  loadHospitals() {
    this.hospitalApi.getHospitals(1, 100, '').subscribe({
      next: (res: any) => {
        this.hospitals =
          res.dataList ?? res.items ?? res.data ?? res.result ?? (Array.isArray(res) ? res : []);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  onSearch() {
    this.pageNumber = 1;
    this.loadUsers();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadUsers();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadUsers();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadUsers();
    }
  }

 onSubmit() {
  if (this.addUserForm.invalid) {
    this.addUserForm.markAllAsTouched();
    return;
  }

  const v = this.addUserForm.value;

  if (this.isEditMode && this.editingUserId) {
    // 🔵 EDIT (PATCH)
    const payload = {
      id: this.editingUserId,
      FullName: v.FullName,
      Gender: v.Gender,
      DateOfBirth: v.DateOfBirth,
      Role: v.RoleId,
      HospitalId: v.HospitalId,
      PhoneNumber: v.PhoneNumber,
      Email: v.Email,
      Address: v.Address,
    };

    this.api.updateUser( payload).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'User updated successfully');
        this.closeModal();
        this.resetEditState();
        this.loadUsers();
      },
      error: () => {
        this.toast.error('Failed to update user');
      },
    });

  } else {
    // 🟢 ADD
    const payload = {
      FullName: v.FullName,
      Gender: v.Gender,
      DateOfBirth: v.DateOfBirth,
      Role: v.RoleId,
      HospitalId: v.HospitalId || this.loggedInHospitalId,
      Email: v.Email,
      PhoneNumber: v.PhoneNumber,
      Password: v.Password,
      Address: v.Address,
      UserName: v.PhoneNumber,
    };

    this.api.addUser(payload).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'User added successfully');
        this.closeModal();
        this.resetEditState();
        this.loadUsers();
      },
      error: () => {
        this.toast.error('Failed to add user');
      },
    });
  }
}

  get showHospitalSelect(): boolean {
    try {
      const role = (this.loggedInUserRole || '').toLowerCase();
      return (role.includes('super') && role.includes('admin')) || role === 'superadmin';
    } catch (e) {
      return false;
    }
  }
  closeModal(): void {
    this.closeModalBtn?.nativeElement.click();
  }

  formatDate(date: string) {
    return date ? new Date(date).toDateString() : '';
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  onPageSizeChange() {
    this.pageNumber = 1;
    this.loadUsers();
  }

  onEmailInput() {
    const control = this.addUserForm.get('Email');
    if (control && control.value) {
      const lower = control.value.toLowerCase();
      if (control.value !== lower) {
        control.setValue(lower, { emitEvent: false });
      }
    }
  }
  onToggleExtend(item: any, checked: boolean) {
    const id = item.userId;

    if (!id) {
      this.toast.error('Unable to determine record id');
      console.groupEnd();
      return;
    }

    const prevExtend = item.isActive;
    // UI: optimistic update
    item._updatingExtend = true;
    item.isActive = checked;
    item.isExtended = checked;

    this.api.updateStatus(id, checked).subscribe({
      next: (res: any) => {
        this.toast.success('Extend status updated');
        item._updatingExtend = false;
        console.groupEnd();
      },

      error: (err: any) => {

        // revert UI state
        item.isActive = prevExtend;
        item.isExtended = prevExtend;
        item._updatingExtend = false;

        this.toast.error('Failed to update extend status');
        console.groupEnd();
      },
    });
  }
 editUser(user: any) {
  this.isEditMode = true;
  this.editingUserId = user.userId || user.id;
console.log(user)
  // remove password validation in edit mode
  this.addUserForm.get('Password')?.clearValidators();
  this.addUserForm.get('Password')?.updateValueAndValidity();

  // Call GET user by id API
  // this.api.getUserById(this.editingUserId).subscribe({
  //   next: (res: any) => {
  //     const u = res.data || res;

  //     this.addUserForm.patchValue({
  //       FullName: u.fullName,
  //       Gender: u.gender,
  //       DateOfBirth: u.dateOfBirth?.substring(0, 10),
  //       RoleId: u.roleId || u.role,
  //       HospitalId: u.hospitalId,
  //       PhoneNumber: u.phoneNumber,
  //       Email: u.email,
  //       Address: u.address,
  //     });

  //     // open modal programmatically
  //     const modal = new bootstrap.Modal(
  //       document.getElementById('addUserModal')
  //     );
  //     modal.show();
  //   },
  //   error: () => {
  //     this.toast.error('Failed to load user details');
  //   },
  // });
}
resetEditState() {
  this.isEditMode = false;
  this.editingUserId = null;

  // restore password validation
  this.addUserForm.get('Password')?.setValidators([
    Validators.required,
    Validators.minLength(6),
  ]);
  this.addUserForm.get('Password')?.updateValueAndValidity();

  this.resetAddUserForm();
}


}
