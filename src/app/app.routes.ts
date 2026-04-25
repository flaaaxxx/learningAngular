import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/users/users-view').then(m => m.default)
  },
  {
    path: 'map',
    loadComponent: () => import('./map/map').then(m => m.default)
  },
];
