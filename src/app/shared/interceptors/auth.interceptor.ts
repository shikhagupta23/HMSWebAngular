import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../modules/auth/services/auth-service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../services/toast-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const toast = inject(ToastService);
  let newReq = req;

  if (token) {
    newReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  }

  return next(newReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
          if (error.status === 401) {
        toast.warning('Your session has expired. Please login again.');
        setTimeout(() => {
          authService.logout();
        }, 1500);
      }
      }

      return throwError(() => error);
    })
  );
};
