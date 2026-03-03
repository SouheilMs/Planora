import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BacklogService } from '../../../core/services/backlog.service';
import { SprintService } from '../../../core/services/sprint.service';
import { AuthService } from '../../../core/services/auth.service';
import { BacklogItem, Sprint, TaskPriority } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-backlog-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatDialogModule, MatTooltipModule,
    LoadingComponent, ConfirmDialogComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button mat-button [routerLink]="['/projects', projectId]" class="back-btn">
            <mat-icon>arrow_back</mat-icon> Back to Project
          </button>
          <h1>Backlog</h1>
        </div>
        <button mat-raised-button class="primary-btn" (click)="openCreate()">
          <mat-icon>add</mat-icon> Add Item
        </button>
      </div>

      <div class="planora-card">
        <app-loading *ngIf="loading"></app-loading>

        <ng-container *ngIf="!loading">
          <div *ngIf="items.length === 0" class="empty-state">
            <mat-icon>list_alt</mat-icon>
            <h3>Backlog is empty</h3>
            <p>Add items to start planning your work</p>
          </div>

          <table mat-table [dataSource]="items" class="planora-table" *ngIf="items.length > 0">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let item">{{ item.title }}</td>
            </ng-container>
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let item">
                <span class="chip" [ngClass]="getPriorityClass(item.priority)">{{ getPriorityLabel(item.priority) }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="sprint">
              <th mat-header-cell *matHeaderCellDef>Sprint</th>
              <td mat-cell *matCellDef="let item">
                <span *ngIf="item.sprintName" class="chip sprint-active">{{ item.sprintName }}</span>
                <span *ngIf="!item.sprintName" class="text-secondary">Not assigned</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let item" class="actions-cell">
                <button mat-icon-button (click)="changePriority(item)" matTooltip="Cycle priority">
                  <mat-icon>swap_vert</mat-icon>
                </button>
                <button mat-icon-button (click)="moveToSprint(item)" *ngIf="canManage && !item.sprintId" matTooltip="Move to Sprint">
                  <mat-icon>arrow_forward</mat-icon>
                </button>
                <button mat-icon-button class="delete-btn" (click)="deleteItem(item)" *ngIf="canManage" matTooltip="Delete">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
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
  `]
})
export class BacklogListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private backlogService = inject(BacklogService);
  private sprintService = inject(SprintService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projectId = '';
  items: BacklogItem[] = [];
  sprints: Sprint[] = [];
  loading = true;
  displayedColumns = ['title', 'priority', 'sprint', 'actions'];

  get canManage(): boolean {
    return this.authService.hasRole(['Admin', 'ProjectManager']);
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.loadItems();
    this.sprintService.getSprintsByProject(this.projectId).subscribe(r => {
      if (r.success) this.sprints = r.data;
    });
  }

  loadItems(): void {
    this.loading = true;
    this.backlogService.getBacklogByProject(this.projectId).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) this.items = response.data;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load backlog', 'Close', { duration: 3000 });
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(BacklogCreateDialogComponent, {
      width: '450px', data: { projectId: this.projectId }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadItems(); });
  }

  changePriority(item: BacklogItem): void {
    const priorities = [
      { value: 0, label: 'Low' }, { value: 1, label: 'Medium' },
      { value: 2, label: 'High' }, { value: 3, label: 'Critical' }
    ];
    const next = (item.priority + 1) % 4 as TaskPriority;
    this.backlogService.updatePriority(item.id, next).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open(`Priority updated to ${priorities[next].label}`, 'Close', { duration: 2000 });
          this.loadItems();
        }
      },
      error: () => this.snackBar.open('Failed to update priority', 'Close', { duration: 3000 })
    });
  }

  moveToSprint(item: BacklogItem): void {
    if (!this.sprints.length) {
      this.snackBar.open('No sprints available', 'Close', { duration: 3000 });
      return;
    }
    const ref = this.dialog.open(MoveToSprintDialogComponent, {
      width: '350px', data: { sprints: this.sprints }
    });
    ref.afterClosed().subscribe((sprintId: string) => {
      if (sprintId) {
        this.backlogService.moveToSprint(item.id, sprintId).subscribe({
          next: response => {
            if (response.success) {
              this.snackBar.open('Moved to sprint', 'Close', { duration: 3000 });
              this.loadItems();
            }
          },
          error: () => this.snackBar.open('Failed to move to sprint', 'Close', { duration: 3000 })
        });
      }
    });
  }

  deleteItem(item: BacklogItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Backlog Item',
        message: `Are you sure you want to delete "${item.title}"?`,
        confirmLabel: 'Delete',
        danger: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.backlogService.deleteBacklogItem(item.id).subscribe({
        next: response => {
          if (response.success) {
            this.snackBar.open('Item deleted', 'Close', { duration: 3000 });
            this.loadItems();
          }
        },
        error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 })
      });
    });
  }

  getPriorityLabel(priority: TaskPriority): string {
    return ['Low', 'Medium', 'High', 'Critical'][priority] ?? priority.toString();
  }

  getPriorityClass(priority: TaskPriority): string {
    return ['priority-low', 'priority-medium', 'priority-high', 'priority-critical'][priority] ?? '';
  }
}

@Component({
  selector: 'app-backlog-create-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Add Backlog Item</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title">
          <mat-error *ngIf="form.get('title')?.hasError('required')">Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option [value]="0">Low</mat-option>
            <mat-option [value]="1">Medium</mat-option>
            <mat-option [value]="2">High</mat-option>
            <mat-option [value]="3">Critical</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form { display: flex; flex-direction: column; gap: 8px; min-width: 300px; } .full-width { width: 100%; }`]
})
export class BacklogCreateDialogComponent {
  private fb = inject(FormBuilder);
  private backlogService = inject(BacklogService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<BacklogCreateDialogComponent>);

  saving = false;
  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: [1]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { projectId: string }) {}

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const value = this.form.value;
    this.backlogService.createBacklogItem({
      title: value.title!,
      description: value.description || '',
      priority: value.priority as TaskPriority,
      projectId: this.data.projectId
    }).subscribe({
      next: response => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open('Item created', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        }
      },
      error: err => {
        this.saving = false;
        this.snackBar.open(err?.error?.message || 'Failed to create item', 'Close', { duration: 4000 });
      }
    });
  }
}

@Component({
  selector: 'app-move-to-sprint-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Move to Sprint</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Select Sprint</mat-label>
        <mat-select [(ngModel)]="selectedSprintId" [ngModelOptions]="{standalone: true}">
          <mat-option *ngFor="let s of data.sprints" [value]="s.id">{{ s.name }}</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="selectedSprintId" [disabled]="!selectedSprintId">Move</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; min-width: 250px; }`]
})
export class MoveToSprintDialogComponent {
  selectedSprintId = '';
  constructor(@Inject(MAT_DIALOG_DATA) public data: { sprints: Sprint[] }) {}
}

