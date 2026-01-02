

import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../shared/constants/api-endpoints';
import { ToastService } from '../../../../shared/services/toast-service';
import { AuthService } from '../../../auth/services/auth-service';
import { UsersService } from '../../services/users-service';
import { AsidebarService } from '../../../../shared/components/asidebar/services/asidebar-service';

@Component({
  selector: 'app-profile-setting',
  standalone: false,
  templateUrl: './profile-setting.html',
  styleUrl: './profile-setting.scss',
})
export class ProfileSetting implements OnInit {
  form!: FormGroup;
  loading = false;
  saving = false;
   isDoctor = false;
departments: any[] = [];
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);
private authService = inject(AuthService);
 private userApi = inject(UsersService);
 private asidebarService = inject(AsidebarService);
 profiledata: any ;
  ngOnInit(): void {
    this.loadDoctorDepartments();
    const role = this.authService.getUserRole();
    this.isDoctor = role === 'Doctor'; // 🔥 role check
    this.form = this.fb.group({
      id: [''],
      hospitalId: [''],
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      address: [''],
      dateOfBirth: [''],
      gender: ['']
    });
if (this.isDoctor) {
      this.form.addControl('department', this.fb.control('', Validators.required));
      this.form.addControl('registrationNo', this.fb.control('', Validators.required));
      this.form.addControl('degree', this.fb.control('', Validators.required));
      this.form.addControl('speciality', this.fb.control('', Validators.required));
    }
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
      const role = this.authService.getUserRole();
  const isDoctor = role === 'Doctor';
const doctorId = this.authService.getLoggedInUserId();
  // 🔥 Decide API dynamically
  const api$ = isDoctor
    ? this.asidebarService.getDoctorDetailsById(doctorId)
    : this.api.get<any>(ApiEndpoints.PROFILE.GETPROFILE);

  api$.subscribe({
      next: (res) => {
        this.profiledata = res?.data ?? (Array.isArray(res?.dataList) ? res.dataList[0] : null);
        const data = this.profiledata;
        if(isDoctor){
 this.form.patchValue({
          id: data.doctorId,
          userName: data.doctorName,
          email: data.doctorEmail,
          phoneNumber: data.doctorPhoneNumber,
          address: data.doctorFullAddress,
          dateOfBirth: this.normalizeDateForInput(data.dob),
          gender: data.gender,

          // doctor-only fields
          department: data.doctorDepartmentMasterId?.toUpperCase(),
          registrationNo: data.doctorRegNo,
          degree: data.doctorDegree,
          speciality: data.doctorSpeciality
        });
        }else{
          
        
        if (data) {
          // Patch form with API fields
          this.form.patchValue({
            id: data.id,
            hospitalId: data.hospitalId,
            userName: data.userName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            address: data.address,
            dateOfBirth: this.normalizeDateForInput(data.dateOfBirth),
            gender: data.gender
          });
          if (this.isDoctor) {
  this.form.patchValue({
    department: data.doctorDepartmentMasterId,
    registrationNo: data.doctorRegNo,
    degree: data.doctorDegree,
    speciality: data.doctorSpeciality
  });
}

          // If auth_user present in localStorage, prefer its hospitalId
          const authHospitalId = this.getAuthHospitalId();
          if (authHospitalId) {
            this.form.patchValue({ hospitalId: authHospitalId });
          }
        }
      }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.toast.error('Failed to load profile');
        this.loading = false;
      }
    });
  }

  loadDoctorDepartments() {
  this.userApi.getDoctorDepartments().subscribe({
    next: (res: any) => {
      this.departments =
        res.dataList ;
    },
    error: () => {
      this.toast.error('Failed to load departments');
    },
  });
}

  private normalizeDateForInput(dateStr: any): string {
    if (!dateStr) return '';
    // If already in ISO yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss format
    if (typeof dateStr === 'string') {
      const isoMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
      if (isoMatch) return isoMatch[0];

      // If format is dd/MM/yyyy (e.g. 24/02/1999)
      const dm = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dm) {
        const day = dm[1].padStart(2, '0');
        const month = dm[2].padStart(2, '0');
        const year = dm[3];
        return `${year}-${month}-${day}`;
      }

      // If format contains T (date-time), split
      if (dateStr.indexOf('T') >= 0) {
        return dateStr.split('T')[0];
      }

      // Try to parse using Date and format
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    return '';
  }

  submit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.saving = true;

  const role = this.authService.getUserRole();
  const isDoctor = role === 'Doctor';

  if (isDoctor) {
    // ================= DOCTOR UPDATE =================
    const doctorPayload = {
      doctorId: this.form.value.id,
      doctorName: this.form.value.userName,
      doctorPhoneNumber: this.form.value.phoneNumber,
      doctorEmail: this.form.value.email,
      gender: this.form.value.gender,
      dob: this.form.value.dateOfBirth,
      doctorFullAddress: this.form.value.address,

      doctorDepartmentMasterId: this.form.value.department, 

      doctorDegree: this.form.value.degree,
      doctorSpeciality: this.form.value.speciality,
      doctorRegNo: this.form.value.registrationNo,
      doctorProfileId:this.profiledata?.doctorProfileId,
      AspNetUserDetailsId: this.profiledata?.aspNetUserDetailsId
    };
    this.api
      .post<any>(
        ApiEndpoints.DOCTOR.updateDoctorProfile,
        doctorPayload
      )
      .subscribe({
        next: (res) => {
          if (res?.isSuccess === false) {
            this.toast.error(res?.message || 'Doctor profile update failed');
            this.saving = false;
            return;
          }
          this.toast.success(res?.message || 'Doctor profile updated successfully');
          this.saving = false;
        },
        error: (err) => {
          console.error('Doctor update failed', err);
          this.toast.error(err?.error?.message || 'Failed to update doctor profile');
          this.saving = false;
        }
      });

  } else {
    // ================= NORMAL PROFILE UPDATE =================
    const payload = { ...this.form.value };

    this.api
      .put<any>(ApiEndpoints.PROFILE.UPDATEPROFILE, payload)
      .subscribe({
        next: (res) => {
          if (res?.isSuccess === false) {
            this.toast.error(res?.message || 'Profile update failed');
            this.saving = false;
            return;
          }
          this.toast.success(res?.message || 'Profile updated successfully');
          this.saving = false;
        },
        error: (err) => {
          console.error('Profile update failed', err);
          this.toast.error(err?.error?.message || 'Failed to update profile');
          this.saving = false;
        }
      });
  }
}


  private getAuthHospitalId(): string | null {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj?.hospitalId ?? null;
    } catch (e) {
      console.warn('Failed to parse auth_user from localStorage', e);
      return null;
    }
  }

  // convenience getters
  get f() { return this.form.controls; }
}
