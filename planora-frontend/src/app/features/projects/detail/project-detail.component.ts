import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressBarModule,
    MatSnackBarModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <app-loading *ngIf="loading"></app-loading>

      <ng-container *ngIf="!loading && project">
        <div class="page-header">
          <div>
            <button mat-button [routerLink]="['/projects']" class="back-btn">
              <mat-icon>arrow_back</mat-icon> Projects
            </button>
            <h1>{{ project.name }}</h1>
            <p class="text-secondary">{{ project.description }}</p>
          </div>
        </div>

        <div class="detail-grid">
          <!-- Info Card -->
          <div class="planora-card info-card">
            <h3 class="section-title">Project Info</h3>
            <div class="info-list">
              <div class="info-item">
                <mat-icon>person</mat-icon>
                <div>
                  <div class="info-label">Manager</div>
                  <div class="info-value">{{ project.projectManagerName }}</div>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>calendar_today</mat-icon>
                <div>
                  <div class="info-label">Start Date</div>
                  <div class="info-value">{{ project.startDate | date:'mediumDate' }}</div>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>event</mat-icon>
                <div>
                  <div class="info-label">End Date</div>
                  <div class="info-value">{{ project.endDate | date:'mediumDate' }}</div>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>task_alt</mat-icon>
                <div>
                  <div class="info-label">Tasks</div>
                  <div class="info-value">{{ project.completedTasks }} / {{ project.totalTasks }} completed</div>
                </div>
              </div>
            </div>
            <div class="progress-section">
              <div class="progress-header">
                <span class="info-label">Progress</span>
                <span class="progress-pct">{{ project.progressPercentage | number:'1.0-0' }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="project.progressPercentage" class="project-bar"></mat-progress-bar>
            </div>
          </div>

          <!-- Team Card -->
          <div class="planora-card">
            <h3 class="section-title">Team Members</h3>
            <div *ngIf="project.members?.length" class="members-list">
              <div class="member-item" *ngFor="let m of project.members">
                <div class="member-avatar">{{ m.fullName?.[0] || '?' }}</div>
                <div>
                  <div class="member-name">{{ m.fullName }}</div>
                  <div class="member-email">{{ m.email }}</div>
                </div>
              </div>
            </div>
            <div *ngIf="!project.members?.length" class="empty-state" style="padding: 32px 0">
              <mat-icon>people_outline</mat-icon>
              <h3>No members</h3>
              <p>No team members assigned yet</p>
            </div>
          </div>
        </div>

        <!-- Navigation Cards -->
        <div class="nav-grid">
          <a class="nav-card" [routerLink]="['/projects', project.id, 'tasks']">
            <div class="nav-card-icon tasks">
              <mat-icon>task_alt</mat-icon>
            </div>
            <div class="nav-card-body">
              <div class="nav-card-title">Tasks</div>
              <div class="nav-card-subtitle">Manage project tasks</div>
            </div>
            <mat-icon class="nav-card-arrow">arrow_forward</mat-icon>
          </a>
          <a class="nav-card" [routerLink]="['/projects', project.id, 'sprints']">
            <div class="nav-card-icon sprints">
              <mat-icon>sprint</mat-icon>
            </div>
            <div class="nav-card-body">
              <div class="nav-card-title">Sprints</div>
              <div class="nav-card-subtitle">Plan and track sprints</div>
            </div>
            <mat-icon class="nav-card-arrow">arrow_forward</mat-icon>
          </a>
          <a class="nav-card" [routerLink]="['/projects', project.id, 'backlog']">
            <div class="nav-card-icon backlog">
              <mat-icon>list_alt</mat-icon>
            </div>
            <div class="nav-card-body">
              <div class="nav-card-title">Backlog</div>
              <div class="nav-card-subtitle">View and organize backlog</div>
            </div>
            <mat-icon class="nav-card-arrow">arrow_forward</mat-icon>
          </a>
        </div>
      </ng-container>

      <div *ngIf="!loading && !project" class="empty-state" style="padding: 64px">
        <mat-icon>folder_off</mat-icon>
        <h3>Project not found</h3>
      </div>
    </div>
  `,
  styles: [`
    .back-btn { color: #6b7280; margin-bottom: 4px; }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }

    .section-title { font-size: 0.9375rem; font-weight: 600; color: #374151; margin-bottom: 20px; }

    .info-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
    .info-item {
      display: flex; align-items: flex-start; gap: 12px;
      mat-icon { color: #9ca3af; font-size: 18px; width: 18px; height: 18px; margin-top: 2px; }
    }
    .info-label { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: .04em; }
    .info-value { font-size: 0.9375rem; color: #111827; font-weight: 500; margin-top: 2px; }

    .progress-section { margin-top: 8px; }
    .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .progress-pct { font-size: 0.875rem; font-weight: 600; color: #4f46e5; }
    .project-bar { height: 8px; border-radius: 4px; }

    .members-list { display: flex; flex-direction: column; gap: 12px; }
    .member-item { display: flex; align-items: center; gap: 12px; }
    .member-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: #fff; font-size: 0.9rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .member-name { font-size: 0.9375rem; font-weight: 500; color: #111827; }
    .member-email { font-size: 0.8125rem; color: #6b7280; }

    .nav-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 768px) { .nav-grid { grid-template-columns: 1fr; } }

    .nav-card {
      display: flex; align-items: center; gap: 16px;
      background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
      padding: 20px; text-decoration: none; cursor: pointer;
      transition: box-shadow .15s, border-color .15s;
      &:hover {
        box-shadow: 0 4px 6px rgba(0,0,0,.08);
        border-color: #c7d2fe;
      }
    }
    .nav-card-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
      &.tasks   { background: #ede9fe; mat-icon { color: #7c3aed; } }
      &.sprints { background: #d1fae5; mat-icon { color: #059669; } }
      &.backlog { background: #fef3c7; mat-icon { color: #d97706; } }
    }
    .nav-card-body { flex: 1; }
    .nav-card-title { font-size: 0.9375rem; font-weight: 600; color: #111827; }
    .nav-card-subtitle { font-size: 0.8125rem; color: #6b7280; margin-top: 2px; }
    .nav-card-arrow { color: #9ca3af; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  project: Project | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getProject(id).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) this.project = response.data;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
      }
    });
  }
}
