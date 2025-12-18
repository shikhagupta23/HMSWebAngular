import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth-service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
console.log("auth guard token",token);
  if (!token) {
    console.log("no token found, redirecting to auth");
    router.navigate(['/auth']);
    return false;
  }
console.log("token found, allowing access");
  return true;
};
