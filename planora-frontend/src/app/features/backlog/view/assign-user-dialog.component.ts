// src/app/features/backlog/view/assign-user-dialog.component.ts
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { ApiResponse, Project, ProjectMember } from '../../../core/models';

@Component({
  selector: 'app-assign-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title style="display:none">Assign task</h2>

    <div style="padding: 24px 24px 0;">
      <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#ede9fe,#c7d2fe);display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
        <mat-icon style="color:#4f46e5;font-size:20px;width:20px;height:20px;">person_add</mat-icon>
      </div>
      <p style="font-size:17px;font-weight:700;margin:0 0 4px;color:#0f172a;letter-spacing:-0.02em">Assign task</p>
      <p style="font-size:13px;color:#64748b;margin:0 0 20px">Choose a team member to assign this task to.</p>
    </div>

    <mat-divider></mat-divider>

    <mat-dialog-content style="padding: 20px 24px; min-width: 400px;">
      <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:8px;">Assignee</label>
      <mat-form-field appearance="outline" class="full-width">
        <mat-select [formControl]="userControl">
          <mat-option [value]="null">
            <span style="color:#94a3b8;font-style:italic">Unassigned</span>
          </mat-option>
          @for (user of users; track user.userId) {
            <mat-option [value]="user.userId">
              {{ user.fullName }}
            </mat-option>
          }
          @if (users.length === 0 && !loading) {
            <mat-option disabled>No members available</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>

    <mat-divider></mat-divider>

    <mat-dialog-actions align="end" style="padding:16px 24px 20px;gap:10px">
      <button mat-button [mat-dialog-close]="undefined" style="color:#64748b;font-weight:600">Cancel</button>
      <button class="assign-btn" (click)="save()" [disabled]="loading">
        <mat-icon style="font-size:18px;width:18px;height:18px">check</mat-icon>
        Assign
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    :host { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

    .full-width { width: 100%; }

    ::ng-deep .full-width .mdc-text-field--outlined {
      border-radius: 10px !important;
    }

    .assign-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 20px;
      height: 40px;
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    .assign-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #4338ca, #3730a3);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
      transform: translateY(-1px);
    }

    .assign-btn:disabled {
      background: #a5b4fc;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class AssignUserDialogComponent {
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<AssignUserDialogComponent>);

  users: ProjectMember[] = [];
  userControl = new FormControl<string | null>(null);
  loading = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { itemId: string; projectId: string; currentUserId: string | null }) {
    this.userControl.setValue(data.currentUserId);
    this.loadUsers();
  }

  loadUsers(): void {
    this.projectService.getProject(this.data.projectId).subscribe({
      next: (response: ApiResponse<Project>) => {
        this.loading = false;
        if (response.success) this.users = response.data.members ?? [];
      },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    this.dialogRef.close(this.userControl.value);
  }
}
