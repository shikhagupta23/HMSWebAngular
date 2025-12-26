import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../../../environment/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../services/users-service';
import { HospitalService } from '../../services/hospital-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { AuthService } from '../../../auth/services/auth-service';

@Component({
  selector: 'app-hospital-details',
  standalone: false,
  templateUrl: './hospital-details.html',
  styleUrl: './hospital-details.scss',
})
export class HospitalDetails implements OnInit {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;

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
  editingUserId: string | null = null;

  loggedInHospitalId: string | null = null;
  loggedInUserRole: string | null = null;

  roles: any[] = [];

  ngOnInit(): void {
    const state = history.state;

    if (state?.hospitalId) {
      const hospitalId =
      typeof state?.hospitalId === 'object'
        ? state.hospitalId.id
        : state?.hospitalId;

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

  /* ---------------- FORM ---------------- */

  initForm(): void {
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
      PhoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
      ],
      Password: ['', [Validators.required, Validators.minLength(6)]],
      Address: [
        '',
        [Validators.required, Validators.minLength(5), Validators.maxLength(250)],
      ],
    });
  }

  loadUsersByHospital(): void {
    if (!this.hospitalId) {
      this.toast.error('Hospital Id not found');
      return;
    }

    this.hospitalApi
      .getUsersByHospitalId(this.hospitalId, 1, 20, '')
      .subscribe({
        next: (res: any) => {
          console.log('Users:', res);
          // assign to table/list variable here
          // this.users = res.dataList;
        },
        error: () => this.toast.error('Failed to load users'),
      });
  }


  get showHospitalSelect(): boolean {
    const role = (this.loggedInUserRole || '').toLowerCase();
    return role.includes('super');
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

      this.api.updateUser(payload).subscribe({
        next: (res: any) => {
          this.toast.success(res?.message || 'User updated successfully');
          this.closeModal();
          this.resetEditState();
        },
        error: () => this.toast.error('Failed to update user'),
      });
    } else {
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
          this.toast.success(res?.message || 'User added successfully');
          this.closeModal();
          this.resetEditState();
        },
        error: () => this.toast.error('Failed to add user'),
      });
    }
  }

  /* ---------------- EDIT ---------------- */

  openEditUser(user: any): void {
    this.isEditMode = true;
    this.editingUserId = user.id;

    this.addUserForm.patchValue({
      FullName: user.fullName,
      Gender: user.gender,
      DateOfBirth: user.dateOfBirth,
      RoleId: user.roleId,
      HospitalId: user.hospitalId,
      PhoneNumber: user.phoneNumber,
      Email: user.email,
      Address: user.address,
    });

    this.addUserForm.get('Password')?.clearValidators();
    this.addUserForm.get('Password')?.disable();
  }

  resetEditState(): void {
    this.isEditMode = false;
    this.editingUserId = null;

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
}
