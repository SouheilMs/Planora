import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SprintService } from '../../../core/services/sprint.service';
import { AuthService } from '../../../core/services/auth.service';
import { Sprint, SprintStatus } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { SprintFormDialogComponent } from './sprint-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sprints-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule, LoadingComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button mat-button [routerLink]="['/projects', projectId]" class="back-btn">
            <mat-icon>arrow_back</mat-icon> Back to Project
          </button>
          <h1>Sprints</h1>
        </div>
        <button mat-raised-button class="primary-btn" (click)="openCreate()" *ngIf="canManage">
          <mat-icon>add</mat-icon> New Sprint
        </button>
      </div>

      <div class="planora-card">
        <app-loading *ngIf="loading"></app-loading>

        <ng-container *ngIf="!loading">
          <div *ngIf="sprints.length === 0" class="empty-state">
            <mat-icon>sprint</mat-icon>
            <h3>No sprints yet</h3>
            <p>Create your first sprint to start planning</p>
          </div>

          <table mat-table [dataSource]="sprints" class="planora-table" *ngIf="sprints.length > 0">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let s">
                <div class="sprint-name-cell">
                  <span class="active-dot" *ngIf="s.status === 1" matTooltip="Active sprint"></span>
                  <span [class.active-text]="s.status === 1">{{ s.name }}</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="goal">
              <th mat-header-cell *matHeaderCellDef>Goal</th>
              <td mat-cell *matCellDef="let s" class="text-secondary">
                {{ s.goal | slice:0:50 }}{{ (s.goal?.length ?? 0) > 50 ? '…' : '' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Dates</th>
              <td mat-cell *matCellDef="let s" class="text-secondary">
                {{ s.startDate | date:'MMM d' }} – {{ s.endDate | date:'MMM d, y' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                <span class="chip" [ngClass]="getStatusClass(s.status)">{{ getStatusLabel(s.status) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="tasks">
              <th mat-header-cell *matHeaderCellDef>Tasks</th>
              <td mat-cell *matCellDef="let s">
                <span class="tasks-badge">{{ s.completedTasksCount }}/{{ s.tasksCount }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef>Progress</th>
              <td mat-cell *matCellDef="let s">
                <div class="progress-cell">
                  <mat-progress-bar mode="determinate" [value]="s.progressPercentage"></mat-progress-bar>
                  <span class="pct">{{ s.progressPercentage | number:'1.0-0' }}%</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s" class="actions-cell">
                <button mat-icon-button (click)="openEdit(s)" *ngIf="canManage && s.status !== 2" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="closeSprint(s)" *ngIf="canManage && s.status === 1" matTooltip="Close Sprint">
                  <mat-icon>lock_outline</mat-icon>
                </button>
                <button mat-icon-button class="delete-btn" (click)="deleteSprint(s)" *ngIf="canManage" matTooltip="Delete">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.active-row]="row.status === 1"></tr>
          </table>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .back-btn { color: #6b7280; margin-bottom: 4px; }
    .primary-btn { background: #4f46e5 !important; color: #fff !important; border-radius: 8px !important; }
    .actions-cell { text-align: right; white-space: nowrap; }
    .delete-btn mat-icon { color: #ef4444 !important; }
    .sprint-name-cell { display: flex; align-items: center; gap: 8px; }
    .active-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #10b981; flex-shrink: 0; animation: pulse 2s infinite;
    }
    .active-text { font-weight: 600; }
    .active-row td { background: #f0fdf4 !important; }
    .tasks-badge { font-size: 0.8125rem; color: #374151; font-weight: 500; }
    @keyframes pulse {
      0%, 100% { opacity: 1; } 50% { opacity: .5; }
    }
  `]
})
export class SprintsListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sprintService = inject(SprintService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projectId = '';
  sprints: Sprint[] = [];
  loading = true;
  displayedColumns = ['name', 'goal', 'dates', 'status', 'tasks', 'progress', 'actions'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.loadSprints();
  }

  loadSprints(): void {
    this.loading = true;
    this.sprintService.getSprintsByProject(this.projectId).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) this.sprints = response.data;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load sprints', 'Close', { duration: 3000 });
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(SprintFormDialogComponent, {
      width: '500px', data: { sprint: null, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadSprints(); });
  }

  openEdit(sprint: Sprint): void {
    const ref = this.dialog.open(SprintFormDialogComponent, {
      width: '500px', data: { sprint, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadSprints(); });
  }

  closeSprint(sprint: Sprint): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Close Sprint',
        message: `Close sprint "${sprint.name}"? This will mark it as finished.`,
        confirmLabel: 'Close Sprint',
        danger: false
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.sprintService.closeSprint(sprint.id).subscribe({
        next: response => {
          if (response.success) {
            this.snackBar.open('Sprint closed', 'Close', { duration: 3000 });
            this.loadSprints();
          }
        },
        error: () => this.snackBar.open('Failed to close sprint', 'Close', { duration: 3000 })
      });
    });
  }

  deleteSprint(sprint: Sprint): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Sprint',
        message: `Are you sure you want to delete "${sprint.name}"?`,
        confirmLabel: 'Delete',
        danger: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.sprintService.deleteSprint(sprint.id).subscribe({
        next: response => {
          if (response.success) {
            this.snackBar.open('Sprint deleted', 'Close', { duration: 3000 });
            this.loadSprints();
          }
        },
        error: () => this.snackBar.open('Failed to delete sprint', 'Close', { duration: 3000 })
      });
    });
  }

  getStatusLabel(status: SprintStatus): string {
    return ['Planning', 'Active', 'Closed'][status] ?? status.toString();
  }

  getStatusClass(status: SprintStatus): string {
    return ['sprint-planning', 'sprint-active', 'sprint-closed'][status] ?? '';
  }
}
