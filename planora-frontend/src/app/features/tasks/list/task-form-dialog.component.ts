import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../../core/services/task.service';
import { SprintService } from '../../../core/services/sprint.service';
import { UserService } from '../../../core/services/user.service';
import { Task, TaskStatus, TaskPriority, Sprint, User } from '../../../core/models';

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.task ? 'Edit' : 'Create' }} Task</h2>
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
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option [value]="0">To Do</mat-option>
              <mat-option [value]="1">In Progress</mat-option>
              <mat-option [value]="2">Done</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option [value]="0">Low</mat-option>
              <mat-option [value]="1">Medium</mat-option>
              <mat-option [value]="2">High</mat-option>
              <mat-option [value]="3">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="dueDate">
            <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Progress %</mat-label>
            <input matInput type="number" formControlName="progressPercentage" min="0" max="100">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Assigned To</mat-label>
          <mat-select formControlName="assignedToId">
            <mat-option value="">Unassigned</mat-option>
            <mat-option *ngFor="let u of users" [value]="u.id">{{ u.fullName }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Sprint (optional)</mat-label>
          <mat-select formControlName="sprintId">
            <mat-option value="">No Sprint</mat-option>
            <mat-option *ngFor="let s of sprints" [value]="s.id">{{ s.name }}</mat-option>
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
  styles: [`
    .form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; }
    .full-width { width: 100%; }
    .half-width { width: calc(50% - 8px); }
    .row { display: flex; gap: 16px; }
  `]
})
export class TaskFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private sprintService = inject(SprintService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TaskFormDialogComponent>);

  sprints: Sprint[] = [];
  users: User[] = [];
  saving = false;

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    status: [0],
    priority: [1],
    progressPercentage: [0],
    dueDate: [null as Date | null],
    assignedToId: [''],
    sprintId: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { task: Task | null; projectId: string }) {}

  ngOnInit(): void {
    this.sprintService.getSprintsByProject(this.data.projectId).subscribe(r => {
      if (r.success) this.sprints = r.data;
    });
    this.userService.getUsers(1, 100).subscribe(r => {
      if (r.success) this.users = r.data.items;
    });
    if (this.data.task) {
      const t = this.data.task;
      this.form.patchValue({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        progressPercentage: t.progressPercentage,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        assignedToId: t.assignedToId || '',
        sprintId: t.sprintId || ''
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const value = this.form.value;
    const payload = {
      title: value.title!,
      description: value.description || '',
      status: value.status as TaskStatus,
      priority: value.priority as TaskPriority,
      progressPercentage: value.progressPercentage ?? 0,
      dueDate: value.dueDate ? (value.dueDate as Date).toISOString() : '',
      projectId: this.data.projectId,
      assignedToId: value.assignedToId || '',
      sprintId: value.sprintId || null
    };
    const obs = this.data.task
      ? this.taskService.updateTask(this.data.task.id, payload)
      : this.taskService.createTask(payload);
    obs.subscribe({
      next: response => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open(`Task ${this.data.task ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response.message, 'Close', { duration: 4000 });
        }
      },
      error: err => {
        this.saving = false;
        this.snackBar.open(err?.error?.message || 'Save failed', 'Close', { duration: 4000 });
      }
    });
  }
}
