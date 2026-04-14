import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace, WorkspaceInvitation, WorkspaceInviteableUser, WorkspaceMember } from '../../core/models';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
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

      <div class="steps-card">
        <div class="step"><span class="step-dot">1</span> Create a workspace</div>
        <div class="step"><span class="step-dot">2</span> Select your workspace</div>
        <div class="step"><span class="step-dot">3</span> Invite members & choose manager</div>
      </div>

      <div class="grid top-grid">
        <mat-card class="planora-card">
          <mat-card-title>Step 1: Create Workspace</mat-card-title>
          <mat-card-content>
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
          </mat-card-content>
        </mat-card>

        <mat-card class="planora-card">
          <mat-card-title>Step 2: Select Workspace</mat-card-title>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Workspace</mat-label>
              <mat-select [value]="selectedWorkspaceId" (selectionChange)="selectWorkspace($event.value)">
                @for (workspace of workspaces; track workspace.id) {
                  <mat-option [value]="workspace.id">{{ workspace.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (selectedWorkspace) {
              <div class="workspace-meta">
                <div class="workspace-name">{{ selectedWorkspace.name }}</div>
                <div class="workspace-stats">
                  <span class="stat"><mat-icon>group</mat-icon> {{ selectedWorkspace.memberCount }} members</span>
                  <span class="stat"><mat-icon>folder_open</mat-icon> {{ selectedWorkspace.projectCount }} projects</span>
                </div>
                <div class="workspace-manager">
                  <span class="label">Manager:</span>
                  <span class="manager-name">{{ selectedWorkspace.projectManagerName || 'Not assigned' }}</span>
                </div>
              </div>
              <a mat-raised-button color="primary" routerLink="/projects" class="cta-button">
                <mat-icon>arrow_forward</mat-icon>
                Continue to Projects
              </a>
            } @else {
              <p class="text-secondary empty-message">Create and select a workspace to unlock member invites and manager selection.</p>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <div class="grid">
        <mat-card class="planora-card" [class.disabled-card]="!selectedWorkspaceId">
          <mat-card-title>Step 3A: Invite Members</mat-card-title>
          <mat-card-content>
            <form [formGroup]="inviteForm" (ngSubmit)="inviteMember()" class="form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>User</mat-label>
                <mat-select formControlName="userId" [disabled]="!selectedWorkspaceId">
                  @for (user of inviteableUsers; track user.userId || user.email || $index) {
                    <mat-option [value]="user.userId">{{ user.fullName }} ({{ user.email }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" [disabled]="!canSendInvitation">Send Invitation</button>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card class="planora-card" [class.disabled-card]="!selectedWorkspaceId">
          <mat-card-title>Step 3B: Select Workspace Manager</mat-card-title>
          <mat-card-content>
            <form [formGroup]="managerForm" (ngSubmit)="setProjectManager()" class="form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Workspace member</mat-label>
                <mat-select formControlName="userId" [disabled]="!selectedWorkspaceId">
                  @for (member of managerMembers; track member.userId) {
                    <mat-option [value]="member.userId">{{ member.fullName }} ({{ member.email }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" [disabled]="!canSetProjectManager">Save Project Manager</button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="grid">
        <mat-card class="planora-card" [class.disabled-card]="!selectedWorkspaceId">
          <mat-card-title>Workspace Members</mat-card-title>
          <mat-card-content>
            @if (!selectedWorkspaceId) {
              <p class="text-secondary">Select a workspace first.</p>
            }
            @if (selectedWorkspaceId && members.length === 0) {
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
          </mat-card-content>
        </mat-card>

        <mat-card class="planora-card">
          <mat-card-title>Pending Invitations</mat-card-title>
          <mat-card-content>
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
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .steps-card {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #374151;
      font-weight: 500;
    }
    .step-dot {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: #4f46e5;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .top-grid { align-items: start; }
    .form { display: flex; flex-direction: column; gap: 10px; }
    .full-width { width: 100%; }
    
    .workspace-meta {
      background: linear-gradient(135deg, #f5f3ff 0%, #f9f5ff 100%);
      border: 1px solid #e9e5ff;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .workspace-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      display: flex;
      align-items: center;
    }
    .workspace-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      color: #374151;
      font-weight: 500;
    }
    .stat mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4f46e5;
    }
    .workspace-manager {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid #e9e5ff;
    }
    .workspace-manager .label {
      color: #6b7280;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .workspace-manager .manager-name {
      color: #111827;
      font-weight: 500;
    }
    
    .cta-button {
      width: 100%;
      mat-icon {
        margin-right: 8px;
      }
    }
    
    .empty-message {
      padding: 16px;
      background: #f3f4f6;
      border-radius: 8px;
      border-left: 4px solid #4f46e5;
      margin: 12px 0;
    }
    
    .disabled-card { opacity: 0.7; }
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
  selectedWorkspaceId = '';

  get selectedWorkspace(): Workspace | null {
    return this.workspaces.find(w => w.id === this.selectedWorkspaceId) ?? null;
  }

  createForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  inviteForm = this.fb.nonNullable.group({ userId: ['', Validators.required] });

  managerForm = this.fb.nonNullable.group({ userId: ['', Validators.required] });

  get canSendInvitation(): boolean {
    const { userId } = this.inviteForm.getRawValue();
    return !!this.selectedWorkspaceId && !!userId;
  }

  get canSetProjectManager(): boolean {
    const { userId } = this.managerForm.getRawValue();
    return !!this.selectedWorkspaceId && !!userId;
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
          if (!this.selectedWorkspaceId && this.workspaces.length > 0) {
            this.selectWorkspace(this.workspaces[0].id);
          }
          if (this.selectedWorkspaceId && !this.workspaces.some(w => w.id === this.selectedWorkspaceId)) {
            this.selectWorkspace(this.workspaces[0]?.id ?? '');
          }
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
          const createdWorkspaceId = response.data.id;
          this.createForm.reset();
          this.loadWorkspaces();
          this.selectWorkspace(createdWorkspaceId);
        }
      },
      error: err => this.snackBar.open(err?.error?.message || 'Failed to create workspace', 'Close', { duration: 4000 })
    });
  }

  selectWorkspace(workspaceId: string): void {
    this.selectedWorkspaceId = workspaceId;

    if (!workspaceId) {
      this.members = [];
      this.inviteableUsers = [];
      this.inviteForm.patchValue({ userId: '' });
      this.managerMembers = [];
      this.managerForm.patchValue({ userId: '' });
      return;
    }

    this.inviteForm.patchValue({ userId: '' });
    this.managerForm.patchValue({ userId: '' });

    this.workspaceService.getMembers(workspaceId).subscribe({
      next: response => {
        if (response.success) {
          this.members = response.data;
          this.managerMembers = response.data;
          const managerId = this.selectedWorkspace?.projectManagerId;
          const defaultManager = managerId && this.managerMembers.some(m => m.userId === managerId)
            ? managerId
            : (this.managerMembers[0]?.userId ?? '');
          this.managerForm.patchValue({ userId: defaultManager });
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

  setProjectManager(): void {
    if (this.managerForm.invalid || !this.selectedWorkspaceId) return;

    this.workspaceService.setProjectManager(this.selectedWorkspaceId, {
      userId: this.managerForm.value.userId!
    }).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Project manager updated', 'Close', { duration: 3000 });
          this.loadWorkspaces();
          this.selectWorkspace(this.selectedWorkspaceId);
        }
      },
      error: err => this.snackBar.open(err?.error?.message || 'Failed to update project manager', 'Close', { duration: 4000 })
    });
  }

  inviteMember(): void {
    if (this.inviteForm.invalid || !this.selectedWorkspaceId) return;

    this.workspaceService.inviteUser(this.selectedWorkspaceId, {
      userId: this.inviteForm.value.userId!
    }).subscribe({
      next: response => {
        if (response.success) {
          this.snackBar.open('Invitation sent', 'Close', { duration: 3000 });
          this.inviteForm.patchValue({ userId: '' });
          this.loadPendingInvitations();
          this.selectWorkspace(this.selectedWorkspaceId);
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
