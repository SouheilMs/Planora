// src/app/features/backlog/view/assign-user-dialog.component.ts
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Assigner la tâche</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Choisir un utilisateur</mat-label>
        <mat-select [formControl]="userControl">
          <mat-option [value]="null">Non assigné</mat-option>
          <mat-option *ngFor="let user of users" [value]="user.userId">
            {{ user.fullName }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Annuler</button>
      <button mat-raised-button color="primary" (click)="save()">Assigner</button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; }']
})
export class AssignUserDialogComponent {
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<AssignUserDialogComponent>);

  users: ProjectMember[] = [];
  userControl = new FormControl<string | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { itemId: string; projectId: string; currentUserId: string | null }) {
    this.userControl.setValue(data.currentUserId);
    this.loadUsers();
  }

  loadUsers(): void {
    this.projectService.getProject(this.data.projectId).subscribe({
      next: (response: ApiResponse<Project>) => {
        if (response.success) this.users = response.data.members ?? [];
      }
    });
  }

  save(): void {
    this.dialogRef.close(this.userControl.value);
  }

}
