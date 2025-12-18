

import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../shared/constants/api-endpoints';
import { ToastService } from '../../../../shared/services/toast-service';

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

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  ngOnInit(): void {
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

    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.api.get<any>(ApiEndpoints.PROFILE.GETPROFILE).subscribe({
      next: (res) => {
        const data = res?.data ?? (Array.isArray(res?.dataList) ? res.dataList[0] : null);
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
          // If auth_user present in localStorage, prefer its hospitalId
          const authHospitalId = this.getAuthHospitalId();
          if (authHospitalId) {
            this.form.patchValue({ hospitalId: authHospitalId });
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
    const payload = { ...this.form.value };
    this.api.put<any>(ApiEndpoints.PROFILE.UPDATEPROFILE, payload).subscribe({
      next: (res) => {
         if (res?.isSuccess === false) {

        // show toast message
        this.toast.error(res?.message || 'Profile update failed');
        this.saving = false;
        return;
      }
        this.toast.success(res?.message ?? 'Profile updated successfully');
        this.saving = false;
      },
      error: (err) => {
        console.error('Profile update failed', err);
        this.toast.error(err?.error?.message ?? 'Failed to update profile');
        this.saving = false;
      }
    });
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
