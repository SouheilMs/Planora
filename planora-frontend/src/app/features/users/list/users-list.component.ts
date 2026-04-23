// users-list.component.ts - BLUE THEME
import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatTooltipModule,
    LoadingComponent
  ],
  template: `
    <div class="page-container">
      @if (loading) {
        <app-loading></app-loading>
      }

      @if (!loading) {
        <div class="page-header">
          <div class="header-left">
            <h1>Users Management</h1>
            <p class="text-secondary">Manage system users, roles and permissions</p>
          </div>
        </div>

        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search users</mat-label>
            <input matInput [formControl]="searchCtrl" placeholder="Search by name, email...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        @if (users.length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <h3>No users found</h3>
            <p>{{ searchCtrl.value ? 'Try a different search term' : 'No users registered yet' }}</p>
          </div>
        }

        @if (users.length > 0) {
          <div class="users-grid">
            @for (user of users; track user.id) {
              <div class="user-card">
                <div class="user-avatar" [class.inactive-avatar]="!user.isActive">
                  {{ user.fullName?.charAt(0) || user.userName?.charAt(0) || 'U' }}
                </div>
                <div class="user-info">
                  <div class="user-name">
                    {{ user.fullName || user.userName }}
                    <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <div class="user-email">
                    <mat-icon>email</mat-icon>
                    {{ user.email }}
                  </div>
                  <div class="user-username">
                    <mat-icon>account_circle</mat-icon>
                    @{{ user.userName }}
                  </div>
                  <div class="user-roles">
                    @for (role of user.roles; track role) {
                      <span class="role-badge" [class.admin]="role === 'Admin'" [class.pm]="role === 'ProjectManager'" [class.member]="role === 'Member'">
                        {{ role === 'ProjectManager' ? 'PM' : role }}
                      </span>
                    }
                  </div>
                </div>
                <div class="user-actions">
                  <button mat-icon-button (click)="openAssignRole(user)" matTooltip="Assign Role" class="action-btn role-btn">
                    <mat-icon>manage_accounts</mat-icon>
                  </button>
                  <button mat-icon-button (click)="toggleActive(user)"
                    [matTooltip]="user.isActive ? 'Deactivate User' : 'Activate User'"
                    class="action-btn" [class.deactivate-btn]="user.isActive" [class.activate-btn]="!user.isActive">
                    <mat-icon>{{ user.isActive ? 'person_off' : 'person_add' }}</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>

          <mat-paginator
            [length]="totalCount"
            [pageSize]="pageSize"
            [pageSizeOptions]="[6, 12, 24]"
            (page)="onPageChange($event)"
            class="paginator">
          </mat-paginator>
        }
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 32px;
      max-width: 1600px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
    }

    @media (max-width: 768px) {
      .page-container { padding: 16px; }
    }

    .page-header { margin-bottom: 32px; }

    .header-left h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #111827;
    }

    .text-secondary {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }

    .search-section { margin-bottom: 32px; }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    @media (max-width: 768px) {
      .search-field { max-width: 100%; }
    }

    ::ng-deep .search-field .mdc-text-field--outlined {
      background: white;
      border-radius: 12px !important;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .user-card {
      background: white;
      border-radius: 20px;
      border: 1px solid #c7d2fe;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      display: flex;
      padding: 20px;
      gap: 16px;
      align-items: center;
      animation: fadeInUp 0.4s ease-out forwards;
      animation-fill-mode: both;
    }

    .user-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #4f46e5, #06b6d4, #a5b4fc);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 20px 20px 0 0;
    }

    .user-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -12px rgba(79, 70, 229, 0.15);
      border-color: #818cf8;
    }

    .user-card:hover::before { opacity: 1; }

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 28px;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .user-avatar.inactive-avatar {
      background: linear-gradient(135deg, #94a3b8, #cbd5e1);
      opacity: 0.7;
    }

    .user-card:hover .user-avatar { transform: scale(1.05); }

    .user-info { flex: 1; }

    .user-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .status-badge.active { background: #d1fae5; color: #059669; }
    .status-badge.inactive { background: #ede9fe; color: #4338ca; }

    .user-email, .user-username {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .user-email mat-icon, .user-username mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #a5b4fc;
    }

    .user-roles {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .role-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .role-badge.admin { background: #ede9fe; color: #4338ca; }
    .role-badge.pm { background: #fef3c7; color: #d97706; }
    .role-badge.member { background: #f1f5f9; color: #475569; }

    .user-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px !important;
      transition: all 0.2s ease !important;
    }

    .action-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .role-btn {
      background: #4f46e5 !important;
      color: white !important;
    }

    .role-btn:hover {
      background: #4338ca !important;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4) !important;
    }

    .deactivate-btn {
      background: #ef4444 !important;
      color: white !important;
    }

    .deactivate-btn:hover {
      background: #dc2626 !important;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
    }

    .activate-btn {
      background: #10b981 !important;
      color: white !important;
    }

    .activate-btn:hover {
      background: #059669 !important;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
    }

    .paginator {
      background: white;
      border-radius: 16px;
      padding: 8px 0;
      border: 1px solid #c7d2fe;
    }

    .empty-state {
      text-align: center;
      padding: 80px 40px;
      background: white;
      border-radius: 24px;
      border: 2px dashed #c7d2fe;
      margin-top: 20px;
    }

    .empty-state mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #a5b4fc;
      margin-bottom: 20px;
      opacity: 0.7;
    }

    .empty-state h3 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #1e293b;
    }

    .empty-state p {
      color: #64748b;
      margin-bottom: 0;
      font-size: 15px;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .users-grid { grid-template-columns: 1fr; gap: 16px; }
      .user-card { flex-direction: column; text-align: center; }
      .user-avatar { margin: 0 auto; }
      .user-actions { flex-direction: row; justify-content: center; margin-top: 8px; }
      .user-name { justify-content: center; }
      .user-email, .user-username { justify-content: center; }
      .user-roles { justify-content: center; }
    }
  `]
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  users: User[] = [];
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;
  loading = true;
  searchCtrl = new FormControl('');

  ngOnInit(): void {
    this.loadUsers();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers(this.currentPage, this.pageSize, this.searchCtrl.value || '').subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.users = response.data.items;
          this.totalCount = response.data.totalCount;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  toggleActive(user: User): void {
    const obs = user.isActive
      ? this.userService.deactivateUser(user.id)
      : this.userService.activateUser(user.id);
    obs.subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`, 'Close', { duration: 3000 });
          this.loadUsers();
        }
      },
      error: () => this.snackBar.open('Failed to update user', 'Close', { duration: 3000 })
    });
  }

  openAssignRole(user: User): void {
    const ref = this.dialog.open(AssignRoleDialogComponent, {
      width: '400px',
      data: { user }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }
}

// Dialog Component
@Component({
  selector: 'app-assign-role-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Assign Role to {{ data.user.fullName || data.user.userName }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Select Role</mat-label>
        <mat-select [(ngModel)]="selectedRole">
          <mat-option value="Admin">Admin</mat-option>
          <mat-option value="ProjectManager">Project Manager</mat-option>
          <mat-option value="Member">Member</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button class="assign-btn" (click)="assign()" [disabled]="!selectedRole || saving">
        {{ saving ? 'Assigning...' : 'Assign Role' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; min-width: 280px; }
    mat-dialog-content { min-width: 320px; }
    .assign-btn {
      background: linear-gradient(135deg, #4f46e5, #4338ca) !important;
      color: white !important;
      border-radius: 8px !important;
    }
    .assign-btn:disabled {
      background: #a5b4fc !important;
      color: white !important;
    }
  `]
})
export class AssignRoleDialogComponent {
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<AssignRoleDialogComponent>);

  selectedRole = '';
  saving = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: User }) {
    this.selectedRole = data.user.roles?.[0] || '';
  }

  assign(): void {
    if (!this.selectedRole) return;
    this.saving = true;
    this.userService.assignRole({ userId: this.data.user.id, role: this.selectedRole }).subscribe({
      next: response => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open('Role assigned successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        }
      },
      error: err => {
        this.saving = false;
        this.snackBar.open(err?.error?.message || 'Failed to assign role', 'Close', { duration: 4000 });
      }
    });
  }
}
