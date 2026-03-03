import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./shared/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/list/projects-list.component').then(m => m.ProjectsListComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/detail/project-detail.component').then(m => m.ProjectDetailComponent) },
      { path: 'projects/:projectId/tasks', loadComponent: () => import('./features/tasks/list/tasks-list.component').then(m => m.TasksListComponent) },
      { path: 'projects/:projectId/tasks/:id', loadComponent: () => import('./features/tasks/detail/task-detail.component').then(m => m.TaskDetailComponent) },
      { path: 'projects/:projectId/sprints', loadComponent: () => import('./features/sprints/list/sprints-list.component').then(m => m.SprintsListComponent) },
      { path: 'projects/:projectId/backlog', loadComponent: () => import('./features/backlog/list/backlog-list.component').then(m => m.BacklogListComponent) },
      {
        path: 'users',
        loadComponent: () => import('./features/users/list/users-list.component').then(m => m.UsersListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      }
    ]
  }
];
