// workspaces/modal/create-workspace-modal.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { ApiResponse, Workspace } from '../../../core/models';

@Component({
  selector: 'app-create-workspace-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Create Workspace</h2>
    
    <mat-dialog-content>
      <form [formGroup]="workspaceForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Workspace name">
          <mat-error *ngIf="workspaceForm.get('name')?.hasError('required')">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button 
        class="btn-red" 
        mat-raised-button 
        [disabled]="workspaceForm.invalid" 
        (click)="onSubmit()">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
    mat-dialog-content { min-width: 400px; }
    .btn-red {
      background: linear-gradient(135deg, #4f46e5, #4338ca) !important;
      color: white !important;
      border-radius: 8px !important;
    }
    .btn-red:hover { background: #3730a3 !important; }
    .btn-red:disabled { background: #a5b4fc !important; color: white !important; }
    @media (max-width: 640px) {
      mat-dialog-content { min-width: auto; }
    }
  `]
})
export class CreateWorkspaceModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateWorkspaceModalComponent>);
  private workspaceService = inject(WorkspaceService);
  private snackBar = inject(MatSnackBar);

  workspaceForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.workspaceForm.invalid) return;

    this.workspaceService.createWorkspace({
      name: this.workspaceForm.value.name!,
      description: this.workspaceForm.value.description || ''
    }).subscribe({
      next: (response: ApiResponse<Workspace>) => {
        if (response.success) {
          this.snackBar.open('Workspace created', 'Close', { duration: 3000 });
          this.dialogRef.close(response.data);
        }
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to create workspace', 'Close', { duration: 4000 });
      }
    });
  }
}
