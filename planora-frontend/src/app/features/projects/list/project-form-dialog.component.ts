import { Component, Inject, OnInit, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Project, Workspace, WorkspaceMember } from '../../../core/models';

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Create' }} Project</h2>
    <br>
    <mat-dialog-content style="margin-top: -2rem;">
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Workspace</mat-label>
            <mat-select formControlName="workspaceId" (selectionChange)="onWorkspaceChanged()" [disabled]="!!data">
              @for (workspace of ownedWorkspaces; track workspace.id) {
                <mat-option [value]="workspace.id">{{ workspace.name }}</mat-option>
              }
            </mat-select>
            @if (form.get('workspaceId')?.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
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
            @for (u of workspaceMembers; track u.userId) {
              <mat-option [value]="u.userId">{{ u.fullName }}</mat-option>
            }
          </mat-select>
          @if (form.get('projectManagerId')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
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
  private workspaceService = inject(WorkspaceService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);

  workspaces: Workspace[] = [];
  workspaceMembers: WorkspaceMember[] = [];
  saving = false;

  get ownedWorkspaces(): Workspace[] {
    const currentUserId = this.authService.currentUser?.userId;
    if (!currentUserId) return [];
    return this.workspaces.filter(workspace => workspace.ownerId === currentUserId || workspace.projectManagerId === currentUserId);
  }

  form = this.fb.group({
    workspaceId: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    projectManagerId: ['', Validators.required]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: Project | null) { }

  ngOnInit(): void {
    this.workspaceService.getWorkspaces().subscribe(r => {
      if (r.success) {
        this.workspaces = r.data;
        if (!this.data && this.ownedWorkspaces.length === 1) {
          this.form.patchValue({ workspaceId: this.ownedWorkspaces[0].id });
          this.onWorkspaceChanged();
        }
      }
    });

    if (this.data) {
      this.form.patchValue({
        workspaceId: this.data.workspaceId,
        name: this.data.name,
        description: this.data.description,
        startDate: this.data.startDate ? new Date(this.data.startDate) : null,
        endDate: this.data.endDate ? new Date(this.data.endDate) : null,
        projectManagerId: this.data.projectManagerId
      });
      this.onWorkspaceChanged();
    }
  }

  onWorkspaceChanged(): void {
    const workspaceId = this.form.value.workspaceId;
    if (!workspaceId) {
      this.workspaceMembers = [];
      return;
    }

    this.workspaceService.getMembers(workspaceId).subscribe({
      next: response => {
        if (response.success) {
          this.workspaceMembers = response.data;
        }
      },
      error: () => {
        this.workspaceMembers = [];
      }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const value = this.form.value;
    const payload = {
      workspaceId: value.workspaceId!,
      name: value.name!,
      description: value.description || '',
      startDate: value.startDate ? (value.startDate as Date).toISOString() : '',
      endDate: value.endDate ? (value.endDate as Date).toISOString() : '',
      projectManagerId: value.projectManagerId!
    };
    const updatePayload = {
      name: payload.name,
      description: payload.description,
      startDate: payload.startDate,
      endDate: payload.endDate,
      projectManagerId: payload.projectManagerId
    };
    const obs = this.data
      ? this.projectService.updateProject(this.data.id, updatePayload)
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
