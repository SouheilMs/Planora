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
import { Project, WorkspaceMember } from '../../../core/models';
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
    return currentUserId === this.project.projectManagerId || currentUserId === this.project.workspaceOwnerId;
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

    this.projectService.getProject(projectId).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.project = response.data;
          this.loadWorkspaceMembers();
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
      }
    });
  }

  trackByUserId(_: number, item: { userId: string }): string {
    return item.userId;
  }

  loadWorkspaceMembers(): void {
    if (!this.project) return;

    this.workspaceService.getMembers(this.project.workspaceId).subscribe({
      next: response => {
        if (response.success) {
          this.workspaceMembers = response.data;
          if (!this.memberForm.value.userId && this.availableWorkspaceMembers.length > 0) {
            this.memberForm.patchValue({ userId: this.availableWorkspaceMembers[0].userId });
          }
        }
      },
      error: () => this.snackBar.open('Failed to load workspace members', 'Close', { duration: 3000 })
    });
  }

  addMember(): void {
    if (!this.project || this.memberForm.invalid) return;

    this.addingMember = true;
    this.projectService.addMember(this.project.id, this.memberForm.value.userId!).subscribe({
      next: response => {
        this.addingMember = false;
        if (response.success) {
          this.snackBar.open('Member added to project', 'Close', { duration: 3000 });
          this.projectService.getProject(this.project!.id).subscribe({
            next: refreshed => {
              if (refreshed.success) {
                this.project = refreshed.data;
                this.loadWorkspaceMembers();
              }
            }
          });
        }
      },
      error: err => {
        this.addingMember = false;
        this.snackBar.open(err?.error?.message || 'Failed to add member', 'Close', { duration: 4000 });
      }
    });
  }
}
