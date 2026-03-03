import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ProjectFormDialogComponent } from './project-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule,
    MatProgressBarModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, LoadingComponent, ConfirmDialogComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Projects</h1>
          <p class="text-secondary">Manage and track your team's projects</p>
        </div>
        <button mat-raised-button class="primary-btn" (click)="openCreate()" *ngIf="canManage">
          <mat-icon>add</mat-icon> New Project
        </button>
      </div>

      <div class="planora-card">
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search projects</mat-label>
            <input matInput [formControl]="searchCtrl" placeholder="Project name...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <app-loading *ngIf="loading"></app-loading>

        <ng-container *ngIf="!loading">
          <div *ngIf="projects.length === 0" class="empty-state">
            <mat-icon>folder_open</mat-icon>
            <h3>No projects found</h3>
            <p>{{ searchCtrl.value ? 'Try a different search term' : 'Create your first project to get started' }}</p>
          </div>

          <table mat-table [dataSource]="projects" class="planora-table" *ngIf="projects.length > 0">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let p">
                <a [routerLink]="['/projects', p.id]" class="planora-link">{{ p.name }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let p" class="text-secondary">
                {{ p.description | slice:0:60 }}{{ (p.description?.length ?? 0) > 60 ? '…' : '' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="manager">
              <th mat-header-cell *matHeaderCellDef>Manager</th>
              <td mat-cell *matCellDef="let p">{{ p.projectManagerName }}</td>
            </ng-container>
            <ng-container matColumnDef="members">
              <th mat-header-cell *matHeaderCellDef>Members</th>
              <td mat-cell *matCellDef="let p">
                <span class="member-count">
                  <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle">people</mat-icon>
                  {{ p.members?.length || 0 }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef>Progress</th>
              <td mat-cell *matCellDef="let p">
                <div class="progress-cell">
                  <mat-progress-bar mode="determinate" [value]="p.progressPercentage"></mat-progress-bar>
                  <span class="pct">{{ p.progressPercentage | number:'1.0-0' }}%</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p" class="actions-cell">
                <button mat-icon-button [routerLink]="['/projects', p.id]" matTooltip="View details">
                  <mat-icon>arrow_forward</mat-icon>
                </button>
                <button mat-icon-button (click)="openEdit(p)" *ngIf="canManage" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="delete-btn" (click)="deleteProject(p)" *ngIf="isAdmin" matTooltip="Delete">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="totalCount"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .primary-btn {
      background: #4f46e5 !important;
      color: #fff !important;
      border-radius: 8px !important;
    }
    .toolbar { margin-bottom: 16px; }
    .search-field { width: 320px; }
    @media (max-width: 600px) { .search-field { width: 100%; } }
    .member-count { display: flex; align-items: center; gap: 4px; color: #6b7280; }
    .actions-cell { text-align: right; white-space: nowrap; }
    .delete-btn mat-icon { color: #ef4444 !important; }
    :host ::ng-deep .mat-mdc-icon-button:hover { background: rgba(79,70,229,.08); }
  `]
})
export class ProjectsListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projects: Project[] = [];
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;
  loading = true;
  searchCtrl = new FormControl('');
  displayedColumns = ['name', 'description', 'manager', 'members', 'progress', 'actions'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['Admin']);
  }

  ngOnInit(): void {
    this.loadProjects();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects(this.currentPage, this.pageSize, this.searchCtrl.value || '').subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.projects = response.data.items;
          this.totalCount = response.data.totalCount;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load projects', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  openCreate(): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  openEdit(project: Project): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '500px', data: project });
    ref.afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  deleteProject(project: Project): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        danger: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.projectService.deleteProject(project.id).subscribe({
        next: response => {
          if (response.success) {
            this.snackBar.open('Project deleted', 'Close', { duration: 3000 });
            this.loadProjects();
          }
        },
        error: () => this.snackBar.open('Failed to delete project', 'Close', { duration: 3000 })
      });
    });
  }
}
