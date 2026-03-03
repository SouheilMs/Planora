import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
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
import { Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatChipsModule, MatSnackBarModule, MatDialogModule,
    MatSelectModule, MatTooltipModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Users</h1>
      </div>
      <mat-card>
        <mat-card-content>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search users</mat-label>
            <input matInput [formControl]="searchCtrl" placeholder="Search...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <app-loading *ngIf="loading"></app-loading>
          <table mat-table [dataSource]="users" class="full-width-table" *ngIf="!loading">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let u">{{ u.fullName }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Username</th>
              <td mat-cell *matCellDef="let u">{{ u.userName }}</td>
            </ng-container>
            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let u">
                <span class="role-chip" *ngFor="let r of u.roles">{{ r }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let u">
                <span class="chip" [ngClass]="u.isActive ? 'active' : 'inactive'">
                  {{ u.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button (click)="openAssignRole(u)" matTooltip="Assign Role" color="primary">
                  <mat-icon>manage_accounts</mat-icon>
                </button>
                <button mat-icon-button color="accent" (click)="toggleActive(u)"
                        [matTooltip]="u.isActive ? 'Deactivate' : 'Activate'">
                  <mat-icon>{{ u.isActive ? 'person_off' : 'person' }}</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="displayedColumns.length" style="text-align:center;padding:24px">No users found.</td>
            </tr>
          </table>
          <mat-paginator
            [length]="totalCount"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { margin: 0; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .full-width-table { width: 100%; }
    .chip { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
    .active { background: #e8f5e9; color: #388e3c; }
    .inactive { background: #ffebee; color: #c62828; }
    .role-chip { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; margin-right: 4px; }
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
  displayedColumns = ['name', 'email', 'username', 'roles', 'status', 'actions'];

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
          this.snackBar.open(`User ${user.isActive ? 'deactivated' : 'activated'}`, 'Close', { duration: 3000 });
          this.loadUsers();
        }
      },
      error: () => this.snackBar.open('Failed to update user', 'Close', { duration: 3000 })
    });
  }

  openAssignRole(user: User): void {
    const ref = this.dialog.open(AssignRoleDialogComponent, {
      width: '350px', data: { user }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }
}

@Component({
  selector: 'app-assign-role-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Assign Role to {{ data.user.fullName }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Role</mat-label>
        <mat-select [(ngModel)]="selectedRole">
          <mat-option value="Admin">Admin</mat-option>
          <mat-option value="ProjectManager">Project Manager</mat-option>
          <mat-option value="Member">Member</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="assign()" [disabled]="!selectedRole || saving">
        {{ saving ? 'Saving...' : 'Assign' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; min-width: 250px; }`]
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
          this.snackBar.open('Role assigned', 'Close', { duration: 3000 });
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
