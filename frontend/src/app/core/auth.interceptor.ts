import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from './config';

/** Junta o JWT a todos os pedidos à API e trata a expiração da sessão (401). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(API_URL);
  const isLogin = req.url === `${API_URL}/auth/login`;

  const token = isApi && !isLogin ? auth.token() : null;
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error) => {
      if (isApi && !isLogin && error?.status === 401) {
        auth.logout(true);
      }
      return throwError(() => error);
    }),
  );
};
