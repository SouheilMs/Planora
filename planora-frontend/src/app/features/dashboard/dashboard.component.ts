// dashboard.component.ts - BLUE THEME
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
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatProgressBarModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  templateUrl: './dashboard.component.html',
  styles: [`

    /* ─── ROOT ─── */
    .dash-root {
      padding: 32px 36px;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* ─── HEADER ─── */
    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .dash-header-left { display: flex; align-items: center; gap: 16px; }

    .dash-greeting {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .dash-greeting-icon {
      font-size: 36px;
      line-height: 1;
    }

    .dash-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px;
      letter-spacing: -0.5px;
    }

    .dash-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }

    .dash-date {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      background: #fff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      padding: 6px 14px;
    }

    /* ─── KPI GRID ─── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card {
      border-radius: 16px;
      padding: 22px 24px 18px;
      color: #fff;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 40px -8px rgba(0,0,0,0.2);
    }

    .kpi-card::after {
      content: '';
      position: absolute;
      top: -30px; right: -30px;
      width: 100px; height: 100px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
    }

    .kpi-indigo { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); }
    .kpi-cyan   { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); }
    .kpi-amber  { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); }
    .kpi-green  { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
    .kpi-red    { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); }
    .kpi-orange { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .kpi-label {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .kpi-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }

    .kpi-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }

    .kpi-value {
      font-size: 38px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 14px;
      letter-spacing: -1px;
    }

    .kpi-bar {
      height: 4px;
      background: rgba(255,255,255,0.25);
      border-radius: 4px;
      overflow: hidden;
    }

    .kpi-bar-fill {
      height: 100%;
      background: rgba(255,255,255,0.7);
      border-radius: 4px;
      transition: width 1s ease;
    }

    /* ─── MID ROW ─── */
    .mid-row {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) { .mid-row { grid-template-columns: 1fr; } }

    /* ─── CARD BASE ─── */
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #c7d2fe;
      box-shadow: 0 1px 4px rgba(79, 70, 229, 0.04);
      transition: box-shadow 0.2s;
    }

    .card:hover { box-shadow: 0 6px 24px rgba(79, 70, 229, 0.07); }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-title::before {
      content: '';
      width: 3px; height: 18px;
      background: linear-gradient(180deg, #4f46e5, #06b6d4);
      border-radius: 3px;
    }

    .card-badge {
      background: #ede9fe;
      color: #4f46e5;
      font-size: 13px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
    }

    /* ─── PROGRESS RING ─── */
    .card--progress { text-align: center; }

    .progress-circle-wrap {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto 12px;
    }

    .progress-ring {
      width: 140px;
      height: 140px;
      transform: rotate(-90deg);
    }

    .ring-bg {
      fill: none;
      stroke: #ede9fe;
      stroke-width: 10;
    }

    .ring-fill {
      fill: none;
      stroke: #4f46e5;
      stroke-width: 10;
      stroke-linecap: round;
      stroke-dasharray: 314;
      transition: stroke-dashoffset 1s ease;
    }

    .ring-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .ring-pct {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }

    .ring-sub {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }

    .progress-desc {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }

    /* ─── BREAKDOWN ─── */
    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .bd-item {}

    .bd-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .bd-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot-todo       { background: #4f46e5; }
    .dot-inprogress { background: #f59e0b; }
    .dot-done       { background: #10b981; }

    .bd-name {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      flex: 1;
    }

    .bd-count {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      min-width: 28px;
      text-align: right;
    }

    .bd-pct {
      font-size: 12px;
      color: #94a3b8;
      min-width: 36px;
      text-align: right;
    }

    .bd-track {
      height: 6px;
      background: #f5f3ff;
      border-radius: 6px;
      overflow: hidden;
    }

    .bd-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.8s ease;
    }

    .bd-fill--todo       { background: #4f46e5; }
    .bd-fill--inprogress { background: #f59e0b; }
    .bd-fill--done       { background: #10b981; }

    /* ─── TABLE ─── */
    .card--table { padding: 24px; }

    .view-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #4f46e5;
      text-decoration: none;
      padding: 5px 12px;
      border-radius: 8px;
      background: #ede9fe;
      transition: background 0.15s;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #c7d2fe; }
    }

    .proj-table {
      width: 100%;
    }

    ::ng-deep .proj-table .mat-mdc-header-cell {
      font-size: 11px !important;
      font-weight: 700 !important;
      color: #94a3b8 !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #f5f3ff !important;
      padding: 12px 16px !important;
      background: #fafaff !important;
    }

    ::ng-deep .proj-table .mat-mdc-cell {
      padding: 14px 16px !important;
      border-bottom: 1px solid #f5f3ff !important;
      font-size: 14px;
    }

    ::ng-deep .proj-table .mat-mdc-row:hover .mat-mdc-cell {
      background: #f5f3ff !important;
    }

    .proj-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #0f172a;
      font-weight: 600;
      font-size: 14px;
      transition: color 0.15s;

      &:hover { color: #4f46e5; }
    }

    .proj-avatar {
      width: 30px; height: 30px;
      border-radius: 8px;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .num-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 24px;
      border-radius: 6px;
      background: #f5f3ff;
      color: #334155;
      font-size: 13px;
      font-weight: 700;
      padding: 0 8px;
    }

    .num-badge--green {
      background: #d1fae5;
      color: #059669;
    }

    .prog-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .prog-track {
      flex: 1;
      height: 6px;
      background: #f5f3ff;
      border-radius: 6px;
      overflow: hidden;
      max-width: 160px;
    }

    .prog-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.8s ease;
    }

    .prog-fill--low  { background: #6366f1; }
    .prog-fill--mid  { background: #f59e0b; }
    .prog-fill--high { background: #10b981; }

    .prog-pct {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      min-width: 36px;
    }

    .table-empty {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;

      mat-icon { font-size: 40px; width: 40px; height: 40px; display: block; margin: 0 auto 12px; }
      p { font-size: 14px; margin: 0; }
    }

    .ws-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 16px;
      border-top: 1px solid #f5f3ff;
    }

    .ws-page-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #c7d2fe;
      background: white;
      color: #4f46e5;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .ws-page-btn:hover:not(:disabled) {
      background: #ede9fe;
    }

    .ws-page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .ws-page-info {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }

    /* ─── PAGE EMPTY ─── */
    .page-empty {
      text-align: center;
      padding: 80px 40px;
      color: #94a3b8;

      mat-icon { font-size: 60px; width: 60px; height: 60px; display: block; margin: 0 auto 16px; opacity: 0.5; }
      h3 { font-size: 18px; font-weight: 700; color: #334155; margin: 0 0 8px; }
      p  { font-size: 14px; margin: 0; }
    }

    /* ─── ANIMATIONS ─── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .kpi-card, .card {
      animation: fadeUp 0.35s ease both;
    }

    .kpi-card:nth-child(1) { animation-delay: 0.05s; }
    .kpi-card:nth-child(2) { animation-delay: 0.10s; }
    .kpi-card:nth-child(3) { animation-delay: 0.15s; }
    .kpi-card:nth-child(4) { animation-delay: 0.20s; }
    .card--progress        { animation-delay: 0.25s; }
    .card--breakdown       { animation-delay: 0.30s; }
    .card--table           { animation-delay: 0.35s; }

  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  loading = true;
  data: DashboardData | null = null;
  displayedColumns = ['workspaceName', 'totalProjects', 'totalTasks', 'progress'];
  isAdmin = false;
  today = new Date();

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole(['Admin']);
    this.dashboardService.getDashboard().subscribe({
      next: response => {
        if (response.success) this.data = response.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.loading = false;
      }
    });
  }

  getPercent(count: number): number {
    if (!this.data || this.data.totalTasks === 0 || count <= 0) return 0;
    return Math.round((count / this.data.totalTasks) * 100);
  }

  wsPage = 0;
  wsPageSize = 5;

  get wsTotalPages(): number {
    if (!this.data?.workspacesProgress) return 1;
    return Math.ceil(this.data.workspacesProgress.length / this.wsPageSize);
  }

  get pagedWorkspaces() {
    if (!this.data?.workspacesProgress) return [];
    const start = this.wsPage * this.wsPageSize;
    return this.data.workspacesProgress.slice(start, start + this.wsPageSize);
  }
}
