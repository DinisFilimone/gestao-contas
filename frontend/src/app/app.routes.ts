import { Routes } from '@angular/router';
import { authGuard, guestGuard, homeGuard, roleGuard } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },

      // --- Administrador ---
      {
        path: 'contas',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./pages/accounts-list/accounts-list').then((m) => m.AccountsList),
      },
      {
        path: 'contas/:numero/extracto',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./pages/statement/statement').then((m) => m.Statement),
      },
      {
        path: 'nova-conta',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./pages/account-create/account-create').then((m) => m.AccountCreate),
      },

      // --- Cliente ---
      {
        path: 'minha-conta',
        canActivate: [roleGuard('CLIENTE')],
        loadComponent: () => import('./pages/my-account/my-account').then((m) => m.MyAccount),
      },
      {
        path: 'extracto',
        canActivate: [roleGuard('CLIENTE')],
        loadComponent: () => import('./pages/statement/statement').then((m) => m.Statement),
      },

      // --- Ambos ---
      {
        path: 'transferir',
        loadComponent: () => import('./pages/transfer/transfer').then((m) => m.Transfer),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
