import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth-service';

export const roleGuard = (allowedRoles: string | string[] | '*'): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.getUserRole(); // decoded from token

    if (!userRole) {
      router.navigate(['/unauthorized']);
      return false;
    }

    // Allow ALL roles if '*' passed
    if (allowedRoles === '*') {
      return true;
    }

    // Convert to array if string
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if userRole exists in allowed roles
    if (rolesArray.includes(userRole)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};

// canActivate: [authGuard, roleGuard('Receptionist')]
// canActivate: [authGuard, roleGuard('Doctor')]
// canActivate: [authGuard, roleGuard(['Doctor', 'Receptionist'])]
