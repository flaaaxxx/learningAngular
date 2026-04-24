import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/users-view/users-view').then(m => m.UsersView)
  },
];
