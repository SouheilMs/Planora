import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { Project, User } from '../../../core/models';

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Create' }} Project</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Manager</mat-label>
          <mat-select formControlName="projectManagerId">
            <mat-option *ngFor="let u of users" [value]="u.id">{{ u.fullName }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('projectManagerId')?.hasError('required')">Required</mat-error>
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
export class ProjectFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);

  users: User[] = [];
  saving = false;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    projectManagerId: ['', Validators.required]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: Project | null) {}

  ngOnInit(): void {
    this.userService.getUsers(1, 100).subscribe(r => {
      if (r.success) this.users = r.data.items;
    });
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        description: this.data.description,
        startDate: this.data.startDate ? new Date(this.data.startDate) : null,
        endDate: this.data.endDate ? new Date(this.data.endDate) : null,
        projectManagerId: this.data.projectManagerId
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const value = this.form.value;
    const payload = {
      name: value.name!,
      description: value.description || '',
      startDate: value.startDate ? (value.startDate as Date).toISOString() : '',
      endDate: value.endDate ? (value.endDate as Date).toISOString() : '',
      projectManagerId: value.projectManagerId!
    };
    const obs = this.data
      ? this.projectService.updateProject(this.data.id, payload)
      : this.projectService.createProject(payload);
    obs.subscribe({
      next: response => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open(`Project ${this.data ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
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
