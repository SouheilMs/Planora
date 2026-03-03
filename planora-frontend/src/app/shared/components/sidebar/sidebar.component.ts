import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed">
      <div class="nav-section">
        <ng-container *ngFor="let item of navItems">
          <a *ngIf="!item.roles || hasRole(item.roles)"
             class="nav-item"
             [routerLink]="item.route"
             routerLinkActive="active"
             [matTooltip]="collapsed ? item.label : ''"
             matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
          </a>
        </ng-container>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 64px;
      left: 0;
      bottom: 0;
      width: 240px;
      background: #fff;
      border-right: 1px solid #e5e7eb;
      z-index: 100;
      display: flex;
      flex-direction: column;
      transition: width .2s ease;
      overflow: hidden;
    }
    .sidebar.collapsed { width: 64px; }

    .nav-section { padding: 12px 8px; flex: 1; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 2px;
      transition: background .15s, color .15s;
      white-space: nowrap;

      &:hover {
        background: #f5f3ff;
        color: #4f46e5;
        .nav-icon { color: #4f46e5; }
      }

      &.active {
        background: #ede9fe;
        color: #4f46e5;
        .nav-icon { color: #4f46e5; }
      }
    }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: inherit;
    }

    .nav-label { overflow: hidden; }

    @media (max-width: 768px) {
      .sidebar { width: 64px; }
      .sidebar.collapsed { width: 0; border: none; }
      .nav-label { display: none; }
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  @Input() collapsed = false;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Projects',  icon: 'folder_open', route: '/projects' },
    { label: 'Users',     icon: 'people', route: '/users', roles: ['Admin'] }
  ];

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
