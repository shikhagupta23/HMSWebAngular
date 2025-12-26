import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast-service';
import { AuthService } from '../../services/auth-service';

type AuthStep = 'login' | 'forgot' | 'otp';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './LoginPage.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  currentYear = new Date().getFullYear();

  loginForm!: FormGroup;
  forgotForm!: FormGroup;
  otpForm!: FormGroup;

  step: AuthStep = 'login';
  phoneForOtp = '';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.forgotForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    });
  }

  /* ========== LOGIN ========== */
  submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = {
      userId: this.loginForm.value.phoneNumber,
      password: this.loginForm.value.password,
      appId: 0
    };

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Login failed');
          return;
        }
        this.authService.saveAuth(res);
        this.toast.success('Login successful');
        this.handleRoleNavigation(res.data?.userRole);
      },
      error: () => this.toast.error('Login failed')
    });
  }

  /* ========== FORGOT PASSWORD ========== */
  sendOtp() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.phoneForOtp = this.forgotForm.value.phoneNumber;

    this.authService.forgotPassword(this.phoneForOtp).subscribe({
      next: (res: any) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'OTP send failed');
          return;
        }
        this.toast.success('OTP sent successfully');
        this.step = 'otp';
      },
      error: () => this.toast.error('OTP send failed')
    });
  }

  /* ========== VERIFY OTP ========== */
  verifyOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.authService.verifyOtp(this.phoneForOtp, this.otpForm.value.otp).subscribe({
      next: (res: any) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Invalid OTP');
          return;
        }
        this.toast.success('OTP verified successfully');
        this.step = 'login';
      },
      error: () => this.toast.error('OTP verification failed')
    });
  }

  backToLogin() {
    this.step = 'login';
    this.forgotForm.reset();
    this.otpForm.reset();
  }

  private handleRoleNavigation(role: string) {
    const routes: any = {
      doctor: '/dashboard',
      receptionist: '/dashboard',
      admin: '/superadmin',
      superadmin: '/superadmin',
    };

    const path = routes[role?.toLowerCase()];
    path ? this.router.navigate([path]) : this.toast.error('Unauthorized role');
  }
}
