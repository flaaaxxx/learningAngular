import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/users-view/users-view').then(m => m.default)
  },
  {
    path: 'map',
    loadComponent: () => import('./map/map').then(m => m.default)
  },
  {
    path: 'my-routes',
    loadComponent: () => import('./my-routes/my-routes').then(m => m.default)
  },
  {
    path: 'todo',
    loadComponent: () => import('./todo/todo').then(m => m.default)
  },
];
