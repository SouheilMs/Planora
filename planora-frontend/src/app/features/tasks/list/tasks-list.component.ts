import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { TaskFormDialogComponent } from './task-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatPaginatorModule,
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
          <h1>Tasks</h1>
        </div>
        <button mat-raised-button class="primary-btn" (click)="openCreate()">
          <mat-icon>add</mat-icon> New Task
        </button>
      </div>

      <div class="planora-card">
        <app-loading *ngIf="loading"></app-loading>

        <ng-container *ngIf="!loading">
          <div *ngIf="tasks.length === 0" class="empty-state">
            <mat-icon>task_alt</mat-icon>
            <h3>No tasks yet</h3>
            <p>Create your first task for this project</p>
          </div>

          <table mat-table [dataSource]="tasks" class="planora-table" *ngIf="tasks.length > 0">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let t">
                <a [routerLink]="['/projects', projectId, 'tasks', t.id]" class="planora-link">{{ t.title }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let t">
                <span class="chip" [ngClass]="getStatusClass(t.status)">{{ getStatusLabel(t.status) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let t">
                <span class="chip" [ngClass]="getPriorityClass(t.priority)">{{ getPriorityLabel(t.priority) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="assignedTo">
              <th mat-header-cell *matHeaderCellDef>Assignee</th>
              <td mat-cell *matCellDef="let t">
                <span *ngIf="t.assignedToName" class="assignee">
                  <span class="assignee-avatar">{{ t.assignedToName[0] }}</span>
                  {{ t.assignedToName }}
                </span>
                <span *ngIf="!t.assignedToName" class="text-secondary">Unassigned</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let t" class="text-secondary">
                {{ t.dueDate ? (t.dueDate | date:'mediumDate') : '—' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let t" class="actions-cell">
                <button mat-icon-button (click)="openEdit(t)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="delete-btn" (click)="deleteTask(t)" *ngIf="canManage" matTooltip="Delete">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [length]="totalCount" [pageSize]="pageSize" [pageSizeOptions]="[5,10,20]" (page)="onPageChange($event)"></mat-paginator>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .back-btn { color: #6b7280; margin-bottom: 4px; }
    .primary-btn { background: #4f46e5 !important; color: #fff !important; border-radius: 8px !important; }
    .actions-cell { text-align: right; white-space: nowrap; }
    .delete-btn mat-icon { color: #ef4444 !important; }
    .assignee { display: flex; align-items: center; gap: 8px; }
    .assignee-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: #fff; font-size: 0.75rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
  `]
})
export class TasksListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projectId = '';
  tasks: Task[] = [];
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;
  loading = true;
  displayedColumns = ['title', 'status', 'priority', 'assignedTo', 'dueDate', 'actions'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasksByProject(this.projectId, this.currentPage, this.pageSize).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.tasks = response.data.items;
          this.totalCount = response.data.totalCount;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load tasks', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadTasks();
  }

  openCreate(): void {
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '500px',
      data: { task: null, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadTasks(); });
  }

  openEdit(task: Task): void {
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '500px',
      data: { task, projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadTasks(); });
  }

  deleteTask(task: Task): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete "${task.title}"?`,
        confirmLabel: 'Delete',
        danger: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.taskService.deleteTask(task.id).subscribe({
        next: response => {
          if (response.success) {
            this.snackBar.open('Task deleted', 'Close', { duration: 3000 });
            this.loadTasks();
          }
        },
        error: () => this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 })
      });
    });
  }

  getStatusLabel(status: TaskStatus): string {
    return ['To Do', 'In Progress', 'Done'][status] ?? status.toString();
  }

  getStatusClass(status: TaskStatus): string {
    return ['status-todo', 'status-inprogress', 'status-done'][status] ?? '';
  }

  getPriorityLabel(priority: TaskPriority): string {
    return ['Low', 'Medium', 'High', 'Critical'][priority] ?? priority.toString();
  }

  getPriorityClass(priority: TaskPriority): string {
    return ['priority-low', 'priority-medium', 'priority-high', 'priority-critical'][priority] ?? '';
  }
}
