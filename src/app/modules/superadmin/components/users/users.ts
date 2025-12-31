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
@ViewChild('confirmStatusModal') confirmStatusModal!: ElementRef;
  dataList: any[] = [];
  isEditMode = false;
editingUserId: string | null = null;
doctorRoleId = 'A105795F-2FCC-4AEB-BC55-3FBC513D0640';

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';
  departments: any[] = [];
  addUserForm!: FormGroup;
  roles: any[] = [];
  hospitals: any[] = [];
  loggedInHospitalId: any = null;
  loggedInUserRole: string | null = null;
pendingUser: any = null;
pendingStatus: boolean | null = null;
previousStatus: boolean | null = null;
newDepartmentName = '';
showDepartmentModal = false;
private addDeptModal: any;

private confirmModalInstance: any;
  private fb = inject(FormBuilder);
  private api = inject(UsersService);
  private hospitalApi = inject(HospitalService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

 ngOnInit(): void {
  // existing code
  try {
    const authRaw = localStorage.getItem('auth_user');
    const authObj = authRaw ? JSON.parse(authRaw) : null;
    this.loggedInHospitalId = authObj?.hospitalId ?? authObj?.HospitalId ?? null;
  } catch (e) {
    this.loggedInHospitalId = null;
  }

  try {
    this.loggedInUserRole = this.auth.getUserRole();
  } catch (e) {
    this.loggedInUserRole = null;
  }

  // 🔥 FORM INIT
  this.initForm();

  // 🔥 ADD THIS BLOCK HERE ⬇️⬇️⬇️
  this.addUserForm.get('RoleId')?.valueChanges.subscribe(roleId => {
    const doctorControls = [
      'DoctorRegistrationNo',
      'DepartmentId',
      'DoctorDegree',
      'DoctorSpeciality',
    ];

    if (roleId === this.doctorRoleId) {
      // apply validators
      doctorControls.forEach(c =>
        this.addUserForm.get(c)?.setValidators(Validators.required)
      );

      // load departments ONLY once
      if (this.departments.length === 0) {
        this.loadDoctorDepartments();
      }
    } else {
      // remove validators + reset values
      doctorControls.forEach(c => {
        this.addUserForm.get(c)?.clearValidators();
        this.addUserForm.get(c)?.setValue('');
      });
    }

    doctorControls.forEach(c =>
      this.addUserForm.get(c)?.updateValueAndValidity()
    );
  });
  // 🔥 END BLOCK

  // existing calls
  this.loadUsers();
  this.loadRoles();
  this.loadHospitals();
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
        console.log('Reverting user status:', this.pendingUser);
        this.loadUsers();
        this.pendingUser.isActive = this.previousStatus;
        this.clearPendingUserState();
      }
    });
  }
}
get isDoctorRoleSelected(): boolean {
  return this.addUserForm?.get('RoleId')?.value === this.doctorRoleId;
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
       // 🔹 Doctor-only fields
    DoctorRegistrationNo: [''],
    DepartmentId: [''],
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
loadDoctorDepartments() {
  this.api.getDoctorDepartments().subscribe({
    next: (res: any) => {
      this.departments =
        res.dataList ;

      console.log('Doctor Departments:', this.departments);
    },
    error: () => {
      this.toast.error('Failed to load departments');
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
  userId: this.editingUserId,
  fullName: v.FullName,
  gender: v.Gender,
  dateOfBirth: v.DateOfBirth
    ? new Date(v.DateOfBirth).toISOString()
    : null,
  roleName: v.userRole,        
  hospitalId: v.HospitalId,
  phoneNumber: v.PhoneNumber,
  email: v.Email,
  address: v.Address,
  doctorDepartmentMasterId: v.DepartmentId,
  doctorRegNo: v.DoctorRegistrationNo
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
      doctorDepartmentMasterId: v.DepartmentId,

  doctorRegNo: v.DoctorRegistrationNo
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
  this.confirmModalInstance = new bootstrap.Modal(
    this.confirmStatusModal.nativeElement
  );
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
    }
  });
}

editUser(user: any) {
  this.isEditMode = true;
  this.editingUserId = user.userId || user.id;

  // remove password validation in edit mode
  this.addUserForm.get('Password')?.clearValidators();
  this.addUserForm.get('Password')?.updateValueAndValidity();

  // 🔥 CALL API TO GET FULL USER DETAILS
  this.api.getUserById(user.userId).subscribe({
    next: (res: any) => {
      if (!res?.isSuccess || !res?.data) {
        this.toast.error('Failed to load user details');
        return;
      }

      const u = res.data;

      // 🔹 PATCH FORM FROM API RESPONSE
      this.addUserForm.patchValue({
        FullName: u.fullName,
        Gender: u.gender,
        DateOfBirth: u.dob ? u.dob.substring(0, 10) : null,
        RoleId: u.roleId, // ⚠️ if backend sends roleName
        HospitalId: u.hospitalId,
        PhoneNumber: u.phone,
        Email: u.email,
        Address: u.address,

        // 👨‍⚕️ Doctor fields (safe even if null)
        DoctorRegistrationNo: u.doctorRegistrationNo ?? '',
        DepartmentId: u.doctordepartmentId ?? '',
       
      });

      // open modal AFTER patch
      const modal = new bootstrap.Modal(
        document.getElementById('addUserModal') as HTMLElement
      );
      modal.show();
    },
    error: () => {
      this.toast.error('Failed to load user details');
    },
  });
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
clearPendingUserState() {
  this.pendingUser = null;
  this.pendingStatus = null;
  this.previousStatus = null;
}
openAddDepartmentModal() {
  this.newDepartmentName = '';
  this.showDepartmentModal = true;
}
closeDepartmentModal() {
  this.showDepartmentModal = false;
  this.newDepartmentName = '';
}

saveDepartment() {
  if (!this.newDepartmentName?.trim()) return;

  const payload = {
    hospitalId: this.loggedInHospitalId,
    departmentName: this.newDepartmentName.trim(),
  };

  this.api.saveDoctorDepartment(payload).subscribe({
    next: () => {
      this.toast.success('Department added successfully');

      // refresh dropdown
      this.loadDoctorDepartments();

      // close custom modal
      this.closeDepartmentModal();
    },
    error: () => {
      this.toast.error('Failed to save department');
    },
  });
}




}
