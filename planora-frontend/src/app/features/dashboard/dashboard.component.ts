// dashboard.component.ts - Version corrigée
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../core/models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatProgressBarModule,
    MatTableModule, MatIconModule, MatButtonModule, MatSnackBarModule, LoadingComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="text-secondary">Welcome back! Here's what's happening with your projects.</p>
        </div>
      </div>
    
      @if (loading) {
        <app-loading></app-loading>
      }
    
      @if (!loading && data) {
        <!-- Stats Row -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrap indigo">
              <mat-icon>folder_open</mat-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ data.totalProjects }}</div>
              <div class="stat-label">Total Projects</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap cyan">
              <mat-icon>sprint</mat-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ data.activeSprints }}</div>
              <div class="stat-label">Active Sprints</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap amber">
              <mat-icon>task_alt</mat-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ data.totalTasks }}</div>
              <div class="stat-label">Total Tasks</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap green">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ data.completedTasks }}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>
        </div>
        <!-- Progress + Task Breakdown Row -->
        <div class="two-col">
          <div class="planora-card">
            <h3 class="card-title">Overall Progress</h3>
            <div class="big-progress">
              <div class="big-pct">{{ data.overallProgressPercentage | number:'1.0-0' }}%</div>
              <mat-progress-bar mode="determinate" [value]="data.overallProgressPercentage" class="big-bar"></mat-progress-bar>
              <div class="pct-label">of all tasks completed</div>
            </div>
          </div>
          <div class="planora-card">
            <h3 class="card-title">Task Breakdown</h3>
            <div class="breakdown-list">
              <div class="breakdown-item">
                <span class="chip status-todo">To Do</span>
                <div class="breakdown-bar-wrap">
                  <div class="breakdown-bar todo-bar" [style.width.%]="getPercent(data.toDoTasks)"></div>
                </div>
                <span class="breakdown-count">{{ data.toDoTasks }}</span>
              </div>
              <div class="breakdown-item">
                <span class="chip status-inprogress">In Progress</span>
                <div class="breakdown-bar-wrap">
                  <div class="breakdown-bar inprogress-bar" [style.width.%]="getPercent(data.inProgressTasks)"></div>
                </div>
                <span class="breakdown-count">{{ data.inProgressTasks }}</span>
              </div>
              <div class="breakdown-item">
                <span class="chip status-done">Done</span>
                <div class="breakdown-bar-wrap">
                  <div class="breakdown-bar done-bar" [style.width.%]="getPercent(data.completedTasks)"></div>
                </div>
                <span class="breakdown-count">{{ data.completedTasks }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Projects Progress Table -->
        <div class="planora-card">
          <div class="card-header-row">
            <h3 class="card-title">Projects Progress</h3>
            <a routerLink="/projects" class="planora-link" style="font-size:.875rem">View all</a>
          </div>
          @if (data.projectsProgress.length === 0) {
            <div class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
            </div>
          }
          @if (data.projectsProgress.length > 0) {
            <table mat-table [dataSource]="data.projectsProgress" class="planora-table">
              <ng-container matColumnDef="projectName">
                <th mat-header-cell *matHeaderCellDef>Project</th>
                <td mat-cell *matCellDef="let p">
                  <a [routerLink]="['/projects', p.projectId]" class="planora-link">{{ p.projectName }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="workspaceName">
                <th mat-header-cell *matHeaderCellDef>Workspace</th>
                <td mat-cell *matCellDef="let p">{{ p.workspaceName }}</td>
              </ng-container>
              <ng-container matColumnDef="totalTasks">
                <th mat-header-cell *matHeaderCellDef>Tasks</th>
                <td mat-cell *matCellDef="let p">{{ p.totalTasks }}</td>
              </ng-container>
              <ng-container matColumnDef="completedTasks">
                <th mat-header-cell *matHeaderCellDef>Completed</th>
                <td mat-cell *matCellDef="let p">{{ p.completedTasks }}</td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef>Progress</th>
                <td mat-cell *matCellDef="let p">
                  <div class="progress-cell">
                    <mat-progress-bar mode="determinate" [value]="p.progressPercentage"></mat-progress-bar>
                    <span class="pct">{{ p.progressPercentage | number:'1.0-0' }}%</span>
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          }
        </div>
      }
    
      <!-- Empty state when no data -->
      @if (!loading && !data) {
        <div class="empty-state">
          <mat-icon>dashboard</mat-icon>
          <h3>No dashboard data</h3>
          <p>Create projects to see your stats here</p>
        </div>
      }
    </div>
    `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 20px;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-header-row .card-title { margin-bottom: 0; }

    .big-progress { text-align: center; }
    .big-pct { font-size: 3rem; font-weight: 800; color: #4f46e5; line-height: 1; margin-bottom: 12px; }
    .big-bar { height: 8px; border-radius: 4px; margin-bottom: 8px; }
    .pct-label { font-size: 0.875rem; color: #6b7280; }

    .breakdown-list { display: flex; flex-direction: column; gap: 14px; }
    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 12px;

      .chip { min-width: 90px; text-align: center; }
      .breakdown-bar-wrap {
        flex: 1;
        height: 8px;
        background: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
      }
      .breakdown-bar { height: 100%; border-radius: 4px; transition: width .5s; }
      .todo-bar { background: #818cf8; }
      .inprogress-bar { background: #fbbf24; }
      .done-bar { background: #34d399; }
      .breakdown-count { font-size: 0.875rem; font-weight: 600; min-width: 24px; text-align: right; color: #374151; }
    }

    .planora-card { margin-bottom: 24px; }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  data: DashboardData | null = null;
  displayedColumns = ['projectName', 'workspaceName', 'totalTasks', 'completedTasks', 'progress'];

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: response => {
        this.loading = false;
        if (response.success) this.data = response.data;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load dashboard', 'Close', { duration: 3000 });
      }
    });
  }

  getPercent(count: number): number {
    if (!this.data || this.data.totalTasks === 0 || count <= 0) return 0;
    return Math.round((count / this.data.totalTasks) * 100);
  }
}
