import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../../core/services/project.service';

export interface ProjectFormDialogData {
  id?: string;
  name?: string;
  description?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
  projectManagerId?: string;
  workspaceId?: string;
}

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="dialog-header">
      <div class="dialog-icon">
        <mat-icon>{{ isEdit ? 'edit' : 'folder_open' }}</mat-icon>
      </div>
      <h2 class="dialog-title">{{ isEdit ? 'Edit Project' : 'Create Project' }}</h2>
      <p class="dialog-subtitle">{{ isEdit ? 'Update project details and timeline.' : 'Start a new project in your workspace.' }}</p>
    </div>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="projectForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Website Redesign">
          <mat-icon matPrefix class="field-prefix">label_outline</mat-icon>
          <mat-error *ngIf="projectForm.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput rows="3" formControlName="description" placeholder="Describe the project goals..."></textarea>
          <mat-icon matPrefix class="field-prefix">notes</mat-icon>
        </mat-form-field>
        <div class="date-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Start Date</mat-label>
            <input matInput type="date" formControlName="startDate">
            <mat-icon matPrefix class="field-prefix">calendar_today</mat-icon>
            <mat-error *ngIf="projectForm.get('startDate')?.hasError('required')">Required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>End Date</mat-label>
            <input matInput type="date" formControlName="endDate">
            <mat-icon matPrefix class="field-prefix">event</mat-icon>
            <mat-error *ngIf="projectForm.get('endDate')?.hasError('required')">Required</mat-error>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button class="cancel-btn" type="button" (click)="onCancel()">Cancel</button>
      <button class="submit-btn" mat-raised-button type="button" [disabled]="projectForm.invalid || submitting" (click)="onSubmit()">
        <mat-icon>{{ submitting ? 'hourglass_empty' : (isEdit ? 'save' : 'add') }}</mat-icon>
        {{ submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Project') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    :host { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

    .dialog-header { padding: 28px 28px 0; text-align: center; }

    .dialog-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
      box-shadow: 0 6px 16px rgba(79,70,229,0.3);
    }
    .dialog-icon mat-icon { color: white; font-size: 24px; width: 24px; height: 24px; }

    .dialog-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px; letter-spacing: -0.02em; }
    .dialog-subtitle { font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }

    .dialog-content { padding: 16px 28px !important; min-width: 440px; }

    .full-width { width: 100%; margin-bottom: 8px; }
    .date-row { display: flex; gap: 12px; }
    .half-width { flex: 1; margin-bottom: 8px; }

    .field-prefix { color: #a5b4fc; font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    .dialog-actions { padding: 12px 28px 24px !important; gap: 10px; }

    .cancel-btn { color: #64748b !important; font-weight: 600 !important; }

    .submit-btn {
      background: linear-gradient(135deg, #4f46e5, #4338ca) !important;
      color: white !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      padding: 0 20px !important;
      box-shadow: 0 4px 12px rgba(79,70,229,0.3) !important;
      transition: all 0.2s ease !important;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #4338ca, #3730a3) !important;
      box-shadow: 0 6px 16px rgba(79,70,229,0.4) !important;
      transform: translateY(-1px);
    }
    .submit-btn:disabled { background: #a5b4fc !important; box-shadow: none !important; color: white !important; }

    @media (max-width: 640px) {
      .dialog-content { min-width: auto; }
      .date-row { flex-direction: column; gap: 0; }
    }
  `]
})
export class ProjectFormDialogComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);

  submitting = false;
  get isEdit(): boolean { return !!this.data?.id; }

  projectForm: FormGroup = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    description: [this.data?.description || ''],
    startDate: [this.data?.startDate ? this.toDateInput(this.data.startDate) : '', Validators.required],
    endDate: [this.data?.endDate ? this.toDateInput(this.data.endDate) : '', Validators.required],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: ProjectFormDialogData | null) { }

  private toDateInput(date: string): string { return date ? date.substring(0, 10) : ''; }
  onCancel(): void { this.dialogRef.close(false); }

  onSubmit(): void {
    if (this.projectForm.invalid) return;
    this.submitting = true;
    const { name, description, startDate, endDate } = this.projectForm.value;

    if (this.isEdit) {
      const updatePayload: any = { name, description, startDate, endDate };
      if (this.data?.color) updatePayload.color = this.data.color;
      this.projectService.updateProject(this.data!.id!, updatePayload).subscribe({
        next: (response) => {
          this.submitting = false;
          if (response.success) { this.snackBar.open('Project updated successfully', 'Close', { duration: 3000 }); this.dialogRef.close(true); }
        },
        error: (err) => { this.submitting = false; this.snackBar.open(err?.error?.message || 'Failed to update project', 'Close', { duration: 3000 }); }
      });
    } else {
      this.projectService.createProject({ name, description: description || '', startDate, endDate, workspaceId: this.data?.workspaceId || '', projectManagerId: this.data?.projectManagerId || '', color: '#4f46e5' })
.subscribe({
        next: (response) => {
          this.submitting = false;
          if (response.success) { this.snackBar.open('Project created successfully', 'Close', { duration: 3000 }); this.dialogRef.close(true); }
        },
        error: (err) => { this.submitting = false; this.snackBar.open(err?.error?.message || 'Failed to create project', 'Close', { duration: 3000 }); }
      });
    }
  }
}
