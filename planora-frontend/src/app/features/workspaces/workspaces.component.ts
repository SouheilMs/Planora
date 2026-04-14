import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace, WorkspaceInvitation, WorkspaceInviteableUser, WorkspaceMember } from '../../core/models';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Workspaces</h1>
          <p class="text-secondary">Create workspaces, invite members, and manage multi-tenant access.</p>
        </div>
      </div>

      <div class="grid">
        <mat-card class="planora-card">
          <h3>Create Workspace</h3>
          <form [formGroup]="createForm" (ngSubmit)="createWorkspace()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
            <button mat-raised-button color="primary" [disabled]="createForm.invalid">Create Workspace</button>
          </form>
        </mat-card>

        <mat-card class="planora-card">
          <h3>Invite Member</h3>
          <form [formGroup]="inviteForm" (ngSubmit)="inviteMember()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Workspace</mat-label>
              <mat-select formControlName="workspaceId" (selectionChange)="onWorkspaceChanged()">
                @for (workspace of workspaces; track workspace.id) {
                  <mat-option [value]="workspace.id">{{ workspace.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>User</mat-label>
              <mat-select formControlName="userId">
                @for (user of inviteableUsers; track user.userId || user.email || $index) {
                  <mat-option [value]="user.userId">{{ user.fullName }} ({{ user.email }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" [disabled]="!canSendInvitation">Send Invitation</button>
          </form>
        </mat-card>

        <mat-card class="planora-card">
          <h3>Project Manager</h3>
          <form [formGroup]="managerForm" (ngSubmit)="setProjectManager()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Workspace</mat-label>
              <mat-select formControlName="workspaceId" (selectionChange)="onManagerWorkspaceChanged()">
                @for (workspace of workspaces; track workspace.id) {
                  <mat-option [value]="workspace.id">
                    {{ workspace.name }} - {{ workspace.projectManagerName || 'No manager set' }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Workspace member</mat-label>
              <mat-select formControlName="userId">
                @for (member of managerMembers; track member.userId) {
                  <mat-option [value]="member.userId">{{ member.fullName }} ({{ member.email }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" [disabled]="!canSetProjectManager">Save Project Manager</button>
          </form>
        </mat-card>
      </div>

      <div class="grid">
        <mat-card class="planora-card">
          <h3>Workspace Members</h3>
          @if (members.length === 0) {
            <p class="text-secondary">Select a workspace to view members.</p>
          }
          @if (members.length > 0) {
            <mat-list>
              @for (member of members; track member.userId) {
                <mat-list-item>
                  <div>{{ member.fullName }} ({{ member.email }})</div>
                </mat-list-item>
              }
            </mat-list>
          }
        </mat-card>

        <mat-card class="planora-card">
          <h3>Pending Invitations</h3>
          @if (pendingInvitations.length === 0) {
            <p class="text-secondary">No pending invitations.</p>
          }
          @for (invitation of pendingInvitations; track invitation.id) {
            <div class="invitation-row">
              <div>
                <strong>{{ invitation.workspaceName }}</strong>
                <div class="text-secondary">Expires {{ invitation.expiresAt | date:'medium' }}</div>
              </div>
              <div class="actions">
                <button mat-button color="primary" (click)="acceptInvitation(invitation)">Accept</button>
                <button mat-button color="warn" (click)="rejectInvitation(invitation)">Reject</button>
              </div>
            </div>
          }
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .form { display: flex; flex-direction: column; gap: 10px; }
    .full-width { width: 100%; }
    .invitation-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .actions { display: flex; gap: 8px; }
  `]
})
export class WorkspacesComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  workspaces: Workspace[] = [];
  members: WorkspaceMember[] = [];
  managerMembers: WorkspaceMember[] = [];
  pendingInvitations: WorkspaceInvitation[] = [];
  inviteableUsers: WorkspaceInviteableUser[] = [];

  createForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  inviteForm = this.fb.nonNullable.group({
    workspaceId: ['', Validators.required],
    userId: ['', Validators.required]
  });

  managerForm = this.fb.nonNullable.group({
    workspaceId: ['', Validators.required],
    userId: ['', Validators.required]
  });

  get canSendInvitation(): boolean {
    const { workspaceId, userId } = this.inviteForm.getRawValue();
    return !!workspaceId && !!userId;
  }

  get canSetProjectManager(): boolean {
    const { workspaceId, userId } = this.managerForm.getRawValue();
    return !!workspaceId && !!userId;
  }

  private normalizeInviteableUsers(users: WorkspaceInviteableUser[]): WorkspaceInviteableUser[] {
    return (users as Array<WorkspaceInviteableUser & { id?: string }>).map(u => ({
      ...u,
      userId: u.userId || u.id || ''
    })).filter(u => !!u.userId);
  }

  ngOnInit(): void {
    this.loadWorkspaces();
    this.loadPendingInvitations();
  }

  loadWorkspaces(): void {
    this.workspaceService.getWorkspaces().subscribe({
      next: response => {
        if (response.success) {
          this.workspaces = response.data;
        }
      },
      error: () => this.snackBar.open('Failed to load workspaces', 'Close', { duration: 3000 })
    });
  }

  loadPendingInvitations(): void {
    this.workspaceService.getPendingInvitations().subscribe({
      next: response => {
        if (response.success) {
          this.pendingInvitations = response.data;
        }
      },
      error: () => this.snackBar.open('Failed to load invitations', 'Close', { duration: 3000 })
    });
  }

  createWorkspace(): void {
    if (this.createForm.invalid) return;

    this.workspaceService.createWorkspace({
      name: this.createForm.value.name!,
      description: this.createForm.value.description || ''
    }).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Workspace created successfully', 'Close', { duration: 3000 });
          this.createForm.reset();
          this.loadWorkspaces();
        }
      },
      error: err => this.snackBar.open(err?.error?.message || 'Failed to create workspace', 'Close', { duration: 4000 })
    });
  }

  onWorkspaceChanged(): void {
    const workspaceId = this.inviteForm.value.workspaceId;
    if (!workspaceId) {
      this.members = [];
      this.inviteableUsers = [];
      this.inviteForm.patchValue({ userId: '' });
      return;
    }

    this.inviteForm.patchValue({ userId: '' });

    this.workspaceService.getMembers(workspaceId).subscribe({
      next: response => {
        if (response.success) {
          this.members = response.data;
        }
      },
      error: () => this.snackBar.open('Failed to load workspace members', 'Close', { duration: 3000 })
    });

    this.workspaceService.getInviteableUsers(workspaceId).subscribe({
      next: response => {
        if (response.success) {
          this.inviteableUsers = this.normalizeInviteableUsers(response.data);
          if (this.inviteableUsers.length > 0) {
            this.inviteForm.patchValue({ userId: this.inviteableUsers[0].userId });
          } else {
            this.snackBar.open('No inviteable users available for this workspace.', 'Close', { duration: 3000 });
          }
        }
      },
      error: () => this.snackBar.open('Failed to load inviteable users', 'Close', { duration: 3000 })
    });
  }

  onManagerWorkspaceChanged(): void {
    const workspaceId = this.managerForm.value.workspaceId;
    if (!workspaceId) {
      this.managerMembers = [];
      this.managerForm.patchValue({ userId: '' });
      return;
    }

    this.managerForm.patchValue({ userId: '' });

    this.workspaceService.getMembers(workspaceId).subscribe({
      next: response => {
        if (response.success) {
          this.managerMembers = response.data;
          if (this.managerMembers.length > 0) {
            this.managerForm.patchValue({ userId: this.managerMembers[0].userId });
          }
        }
      },
      error: () => this.snackBar.open('Failed to load workspace members', 'Close', { duration: 3000 })
    });
  }

  setProjectManager(): void {
    if (this.managerForm.invalid) return;

    this.workspaceService.setProjectManager(this.managerForm.value.workspaceId!, {
      userId: this.managerForm.value.userId!
    }).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Project manager updated', 'Close', { duration: 3000 });
          this.loadWorkspaces();
        }
      },
      error: err => this.snackBar.open(err?.error?.message || 'Failed to update project manager', 'Close', { duration: 4000 })
    });
  }

  inviteMember(): void {
    if (this.inviteForm.invalid) return;

    this.workspaceService.inviteUser(this.inviteForm.value.workspaceId!, {
      userId: this.inviteForm.value.userId!
    }).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Invitation sent', 'Close', { duration: 3000 });
          this.inviteForm.patchValue({ userId: '' });
          this.loadPendingInvitations();
          this.onWorkspaceChanged();
        }
      },
      error: err => this.snackBar.open(err?.error?.message || 'Failed to invite user', 'Close', { duration: 4000 })
    });
  }

  acceptInvitation(invitation: WorkspaceInvitation): void {
    this.workspaceService.acceptInvitation(invitation.id).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Invitation accepted', 'Close', { duration: 3000 });
          this.loadWorkspaces();
          this.loadPendingInvitations();
        }
      },
      error: err => this.snackBar.open(err?.error?.message || 'Failed to accept invitation', 'Close', { duration: 4000 })
    });
  }

  rejectInvitation(invitation: WorkspaceInvitation): void {
    this.workspaceService.rejectInvitation(invitation.id).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Invitation rejected', 'Close', { duration: 3000 });
          this.loadPendingInvitations();
        }
      },
      error: err => this.snackBar.open(err?.error?.message || 'Failed to reject invitation', 'Close', { duration: 4000 })
    });
  }
}
