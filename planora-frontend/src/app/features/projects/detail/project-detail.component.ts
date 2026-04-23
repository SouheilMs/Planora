// project-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, WorkspaceMember, ProjectMember } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressBarModule, MatFormFieldModule,
    MatSelectModule, ReactiveFormsModule, MatSnackBarModule, LoadingComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private workspaceService = inject(WorkspaceService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  project: Project | null = null;
  workspaceMembers: WorkspaceMember[] = [];
  addingMember = false;

  memberForm = this.fb.group({
    userId: ['', Validators.required]
  });

  get canManageMembers(): boolean {
    const currentUserId = this.authService.currentUser?.userId;
    if (!this.project || !currentUserId) return false;
    return currentUserId === this.project.projectManagerId ||
      currentUserId === this.project.workspaceOwnerId ||
      this.authService.hasRole(['Admin']);
  }

  get availableWorkspaceMembers(): WorkspaceMember[] {
    const projectMemberIds = new Set((this.project?.members || []).map(member => member.userId));
    return this.workspaceMembers.filter(member => !projectMemberIds.has(member.userId));
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (!projectId || projectId === 'null' || projectId === 'undefined') {
      this.loading = false;
      this.snackBar.open('Invalid project id in URL', 'Close', { duration: 3000 });
      return;
    }

    this.loadProject(projectId);
  }

  loadProject(projectId: string): void {
    this.loading = true;
    this.projectService.getProject(projectId).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.project = response.data;
          console.log('Projet chargé:', this.project);
          console.log('Membres du projet:', this.project.members);
          this.loadWorkspaceMembers();
        } else {
          this.snackBar.open('Project not found', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur chargement projet:', err);
        this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
      }
    });
  }

  loadWorkspaceMembers(): void {
    if (!this.project) return;

    this.workspaceService.getMembers(this.project.workspaceId).subscribe({
      next: response => {
        if (response.success) {
          this.workspaceMembers = response.data;
          console.log('Membres du workspace:', this.workspaceMembers);
          console.log('Membres déjà dans le projet:', this.project?.members);
          console.log('Membres disponibles:', this.availableWorkspaceMembers);

          if (this.availableWorkspaceMembers.length > 0 && !this.memberForm.value.userId) {
            this.memberForm.patchValue({ userId: this.availableWorkspaceMembers[0].userId });
          }
        }
      },
      error: (err) => {
        console.error('Erreur chargement membres workspace:', err);
        this.snackBar.open('Failed to load workspace members', 'Close', { duration: 3000 });
      }
    });
  }

  // ✅ Correction: Utiliser ProjectMember au lieu de WorkspaceMember
  canRemoveMember(member: ProjectMember): boolean {
    const currentUserId = this.authService.currentUser?.userId;
    if (!this.project || !currentUserId) return false;

    if (member.userId === this.project.projectManagerId) return false;

    return currentUserId === this.project.projectManagerId ||
      currentUserId === this.project.workspaceOwnerId ||
      this.authService.hasRole(['Admin']);
  }

  // ✅ Correction: Utiliser ProjectMember au lieu de WorkspaceMember
  removeMember(member: ProjectMember): void {
    if (!this.project) return;

    const confirmRemove = confirm(`Are you sure you want to remove ${member.fullName} from this project?`);
    if (!confirmRemove) return;

    this.projectService.removeMember(this.project.id, member.userId).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Member removed successfully', 'Close', { duration: 3000 });
          this.loadProject(this.project!.id);
        }
      },
      error: err => {
        this.snackBar.open(err?.error?.message || 'Failed to remove member', 'Close', { duration: 4000 });
      }
    });
  }

  addMember(): void {
    if (!this.project || this.memberForm.invalid) {
      this.snackBar.open('Please select a member to add', 'Close', { duration: 3000 });
      return;
    }

    this.addingMember = true;
    const userId = this.memberForm.value.userId!;

    console.log('Ajout du membre:', userId, 'au projet:', this.project.id);

    this.projectService.addMember(this.project.id, userId).subscribe({
      next: response => {
        this.addingMember = false;
        if (response.success) {
          this.snackBar.open('Member added to project successfully!', 'Close', { duration: 3000 });
          this.loadProject(this.project!.id);
          this.memberForm.reset();
          if (this.availableWorkspaceMembers.length > 0) {
            this.memberForm.patchValue({ userId: this.availableWorkspaceMembers[0].userId });
          }
        } else {
          this.snackBar.open(response.message || 'Failed to add member', 'Close', { duration: 4000 });
        }
      },
      error: (err) => {
        this.addingMember = false;
        console.error('Erreur ajout membre:', err);
        const errorMessage = err?.error?.message || err?.message || 'Failed to add member';
        this.snackBar.open(errorMessage, 'Close', { duration: 4000 });
      }
    });
  }

  trackByUserId(_: number, item: { userId: string }): string {
    return item.userId;
  }
}
