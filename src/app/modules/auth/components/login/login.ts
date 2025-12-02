import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast-service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  loginForm!: FormGroup;
  private fb =inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  constructor() {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10}$/)   // only numbers + exactly 10 digits
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          // Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          // regex ensures:
          // 1 lowercase, 1 uppercase, 1 number, 1 special char
        ],
      ],
    });
  }

 submit() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const loginPayload = {
    userId: this.loginForm.value.phoneNumber,
    password: this.loginForm.value.password,
    appId: 0
  }; 

  this.authService.login(loginPayload).subscribe({
    next: (response: any) => {
      this.authService.saveAuth(response);
      const role = response.data?.userRole;
      this.handleRoleNavigation(role);
    },
    error: (error: any) => {
      console.error("API Error:", error);
      this.toast.error("Login failed.");
    }
  });
}
private handleRoleNavigation(role: string) {

  const normalizedRole = role.toLowerCase();

  const roleRoutes: Record<string, string> = {
    doctor: '/doctor',
    receptionist: '/receptionist'
  };

  if (roleRoutes[normalizedRole]) {
     this.toast.success("Login successfully!");
    this.router.navigate([roleRoutes[normalizedRole]]);
    return;
  }

  if (['superadmin', 'admin'].includes(normalizedRole)) {
     this.toast.error("Admin login is not allowed from here.");
    return;
  }

  this.toast.error("Unauthorized role or invalid credentials.");

}

}


