import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { BacklogService } from '../../../core/services/backlog.service';
import { TaskPriority } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-backlog-create-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatSnackBarModule, MatIconModule
  ],
  templateUrl: './backlog-create-dialog.component.html',
  styleUrls: ['./backlog-create-dialog.component.css']
})
export class BacklogCreateDialogComponent {
  private fb = inject(FormBuilder);
  private backlogService = inject(BacklogService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<BacklogCreateDialogComponent>);

  saving = false;
  users: User[] = [];

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: [TaskPriority.Medium],
    complexity: [2],
    assignedToId: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { projectId: string }) {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers(1, 100).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.users = response.data.items;
        }
      },
      error: () => {
        console.error('Erreur chargement utilisateurs');
      }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const value = this.form.value;

    const request: any = {
      title: value.title!,
      description: value.description || '',
      priority: value.priority as TaskPriority,
      projectId: this.data.projectId
    };

    // Ajouter assignedToId seulement si renseigné
    if (value.assignedToId) {
      request.assignedToId = value.assignedToId;
    }

    // Ajouter complexity si renseigné
    if (value.complexity !== undefined && value.complexity !== null) {
      request.complexity = value.complexity;
    }

    this.backlogService.createBacklogItem(request).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open('✅ Élément ajouté !', 'Fermer', { duration: 2000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response.message || 'Erreur', 'Fermer', { duration: 4000 });
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err?.error?.message || 'Erreur', 'Fermer', { duration: 4000 });
      }
    });
  }
}
