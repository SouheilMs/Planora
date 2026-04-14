import { Component, EventEmitter, OnInit, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { WorkspaceInvitation } from '../../../core/models';
import { WorkspaceService } from '../../../core/services/workspace.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatBadgeModule],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <button mat-icon-button class="toggle-btn" (click)="toggleSidebar.emit()" matTooltip="Toggle sidebar">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="brand">
          <mat-icon class="brand-icon">rocket_launch</mat-icon>
          Planora
        </span>
      </div>
    
      <div class="navbar-right">
        @if (pendingInvitations.length) {
          <button mat-icon-button [matMenuTriggerFor]="invitationsMenu" matTooltip="Workspace invitations" [matBadge]="pendingInvitations.length" matBadgeColor="warn">
            <mat-icon>notifications</mat-icon>
          </button>
        }
        @if (authService.user$ | async; as user) {
          @if (user.roles.length) {
            <span class="role-chip">{{ user.roles[0] }}</span>
          }
          <div class="user-info">
            <span class="user-name">{{ user.fullName }}</span>
            <span class="user-email">{{ user.email }}</span>
          </div>
          <button mat-icon-button class="avatar-btn" [matMenuTriggerFor]="menu" matTooltip="Account">
            <div class="avatar">{{ getInitials(user.fullName) }}</div>
          </button>
        }

        <mat-menu #invitationsMenu="matMenu" class="user-menu">
          @if (pendingInvitations.length === 0) {
            <button mat-menu-item disabled>
              <span>No pending invitations</span>
            </button>
          }
          @for (invitation of pendingInvitations; track invitation.id) {
            <div class="invite-menu-item" mat-menu-item (click)="$event.stopPropagation()">
              <div class="invite-content">
                <strong>{{ invitation.workspaceName }}</strong>
                <span>{{ invitation.email }}</span>
              </div>
              <div class="invite-actions">
                <button mat-button color="primary" (click)="acceptInvitation(invitation)">Accept</button>
                <button mat-button color="warn" (click)="rejectInvitation(invitation)">Reject</button>
              </div>
            </div>
          }
        </mat-menu>
    
        <mat-menu #menu="matMenu" class="user-menu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      </div>
    </header>
    `,
  styles: [`
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      height: 64px;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px 0 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    .navbar-left { display: flex; align-items: center; gap: 4px; }
    .navbar-right { display: flex; align-items: center; gap: 12px; }

    .toggle-btn { color: #6b7280; }

    .brand {
      display: flex; align-items: center; gap: 6px;
      font-size: 1.125rem; font-weight: 700;
      color: #4f46e5; letter-spacing: -.02em;
    }
    .brand-icon { font-size: 20px; width: 20px; height: 20px; }

    .role-chip {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; padding: 2px 10px; border-radius: 20px;
      background: #ede9fe; color: #7c3aed;
    }

    .user-info {
      display: flex; flex-direction: column; align-items: flex-end;
      @media (max-width: 600px) { display: none; }
    }
    .user-name  { font-size: 0.875rem; font-weight: 600; color: #111827; line-height: 1.2; }
    .user-email { font-size: 0.75rem; color: #6b7280; }

    .avatar-btn { padding: 0; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: #fff; font-size: 0.875rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .invite-menu-item {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 12px 16px;
      min-width: 280px;
      border-bottom: 1px solid #f3f4f6;
    }
    .invite-content { display: flex; flex-direction: column; gap: 2px; }
    .invite-content span { font-size: 0.75rem; color: #6b7280; }
    .invite-actions { display: flex; gap: 8px; }
  `]
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  @Output() toggleSidebar = new EventEmitter<void>();
  pendingInvitations: WorkspaceInvitation[] = [];

  ngOnInit(): void {
    this.loadPendingInvitations();
  }

  loadPendingInvitations(): void {
    this.workspaceService.getPendingInvitations().subscribe({
      next: response => {
        if (response.success) {
          this.pendingInvitations = response.data;
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  acceptInvitation(invitation: WorkspaceInvitation): void {
    this.workspaceService.acceptInvitation(invitation.id).subscribe({
      next: response => {
        if (response.success) {
          this.loadPendingInvitations();
        }
      }
    });
  }

  rejectInvitation(invitation: WorkspaceInvitation): void {
    this.workspaceService.rejectInvitation(invitation.id).subscribe({
      next: response => {
        if (response.success) {
          this.loadPendingInvitations();
        }
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(n => n).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
