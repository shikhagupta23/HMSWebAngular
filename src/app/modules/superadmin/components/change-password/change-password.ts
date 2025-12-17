import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { ApiEndpoints } from '../../../../shared/constants/api-endpoints';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword implements OnInit {
  form!: FormGroup;
  submitting = false;

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: [this.matchPasswords] });
  }

  matchPasswords(control: AbstractControl) {
    const newPass = control.get('newPassword')?.value;
    const confirm = control.get('confirmNewPassword')?.value;
    return newPass && confirm && newPass !== confirm ? { passwordMismatch: true } : null;
  }

  get email() { return this.form.get('email'); }
  get oldPassword() { return this.form.get('oldPassword'); }
  get newPassword() { return this.form.get('newPassword'); }
  get confirmNewPassword() { return this.form.get('confirmNewPassword'); }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const payload = {
      email: this.email?.value,
      oldPassword: this.oldPassword?.value,
      newPassword: this.newPassword?.value
    };

    this.api.post<any>(ApiEndpoints.USER.CHANGE_PASSWORD, payload).subscribe({
      next: (res) => {
        this.toast.success(res?.message ?? 'Password changed successfully');
        this.form.reset();
        this.submitting = false;
      },
      error: (err) => {
        console.error('Change password failed', err);
        this.toast.error(err?.error?.message ?? 'Failed to change password');
        this.submitting = false;
      }
    });
  }

}

