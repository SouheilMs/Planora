import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models';
import { CreateWorkspaceModalComponent } from './modal/create-workspace-modal.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatDialogModule, MatPaginatorModule, LoadingComponent,
    ConfirmDialogComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <div class="header-eyebrow">
            <mat-icon>workspaces</mat-icon>
            <span>Management</span>
          </div>
          <h1>Workspaces</h1>
          <p class="text-secondary">Manage all your workspaces. Create new ones and organize your projects.</p>
          <div class="stats-summary" *ngIf="!loading && totalWorkspaces > 0">
            <span class="stat-badge">
              <mat-icon>folder</mat-icon>
              {{ totalWorkspaces }} total workspaces
            </span>
            <span class="stat-badge">
              <mat-icon>visibility</mat-icon>
              Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ getCurrentPageEnd() }} of {{ totalWorkspaces }}
            </span>
          </div>
        </div>
        @if (isAdmin) {
          <button class="primary-btn" (click)="openCreateWorkspaceModal()">
            <mat-icon>add</mat-icon>
            New Workspace
          </button>
        }
      </div>

      <!-- ── SEARCH BAR ── -->
      <div class="search-bar-wrapper">
        <div class="search-bar">
          <mat-icon class="search-icon">search</mat-icon>
          <input [formControl]="searchCtrl"
                 placeholder="Search workspaces..."
                 class="search-input" />
          @if (searchCtrl.value) {
          <button class="search-clear" (click)="searchCtrl.setValue('')">
            <mat-icon>close</mat-icon>
          </button>
          }
        </div>
        <div class="results-count">
          {{ totalWorkspaces }} workspace{{ totalWorkspaces !== 1 ? 's' : '' }}
        </div>
      </div>

      @if (loading) { <app-loading></app-loading> }

      @if (!loading && workspaces.length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><mat-icon>workspaces</mat-icon></div>
          <h3>No workspaces found</h3>
          <p>{{ searchCtrl.value ? 'Try a different search term' : 'Create your first workspace to start organizing your projects' }}</p>
          @if (isAdmin && !searchCtrl.value) {
            <button class="primary-btn" (click)="openCreateWorkspaceModal()">
              <mat-icon>add</mat-icon> Create Workspace
            </button>
          }
        </div>
      }

      @if (!loading && workspaces.length > 0) {
        <div class="workspaces-grid">
          @for (workspace of workspaces; track workspace.id) {
            <div class="workspace-card" (click)="viewWorkspace(workspace.id)">
              <div class="card-top-bar"></div>
              <div class="card-inner">
                <div class="card-header">
                  <div class="workspace-avatar">{{ workspace.name.charAt(0).toUpperCase() }}</div>
                  <div class="card-header-info">
                    <div class="workspace-name">{{ workspace.name }}</div>
                    <div class="workspace-owner">
                      <mat-icon>person</mat-icon>
                      {{ workspace.ownerName }}
                    </div>
                  </div>
                  <div class="card-menu">
                    @if (isAdmin) {
                      <button class="icon-btn danger" (click)="deleteWorkspace(workspace.id, $event)" title="Delete">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    }
                  </div>
                </div>
                <p class="workspace-description">{{ workspace.description || 'No description provided' }}</p>
                <div class="workspace-stats">
                  <span class="stat-chip">
                    <mat-icon>group</mat-icon>{{ workspace.memberCount }} members
                  </span>
                  <span class="stat-chip">
                    <mat-icon>folder_open</mat-icon>{{ workspace.projectCount }} projects
                  </span>
                </div>
                <div class="card-footer">
                  <button class="view-btn" (click)="$event.stopPropagation(); viewWorkspace(workspace.id)">
                    <span>View Details</span>
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="pagination-container" *ngIf="totalWorkspaces > pageSize">
          <mat-paginator
            [length]="totalWorkspaces"
            [pageSize]="pageSize"
            [pageSizeOptions]="pageSizeOptions"
            [pageIndex]="currentPage - 1"
            (page)="onPageChange($event)"
            aria-label="Select page of workspaces">
          </mat-paginator>
          <div class="quick-jump" *ngIf="totalPages > 5">
            <span class="jump-label">Jump to page:</span>
            <div class="page-numbers">
              <button *ngFor="let page of getVisiblePages()"
                class="page-number-btn"
                [class.active]="page === currentPage"
                (click)="goToPage(page)">{{ page }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    :host { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

    .page-container {
      padding: 36px 40px;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 28px;
      animation: fadeSlideDown 0.4s ease-out both;
    }

    .header-eyebrow {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.7;
      margin-bottom: 4px;
    }
    .header-eyebrow mat-icon { font-size: 14px; width: 14px; height: 14px; }

    h1 {
      font-size: 30px;
      font-weight: 800;
      background: linear-gradient(135deg, #1e293b, #334155);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.03em;
      margin: 0 0 6px;
    }

    .text-secondary { color: #64748b; font-size: 14px; margin: 0 0 12px; font-weight: 500; }
    .stats-summary { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }

    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      background: linear-gradient(135deg, rgba(79,70,229,0.08), rgba(6,182,212,0.05));
      border: 1px solid rgba(79,70,229,0.15);
      border-radius: 40px;
      color: #4f46e5;
      font-size: 13px;
      font-weight: 600;
    }
    .stat-badge mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 22px;
      height: 46px;
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      color: white;
      border: none;
      border-radius: 40px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(79,70,229,0.3);
      white-space: nowrap;
    }
    .primary-btn:hover { background: linear-gradient(135deg, #4338ca, #3730a3); box-shadow: 0 6px 20px rgba(79,70,229,0.4); transform: translateY(-2px); }
    .primary-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── SEARCH BAR ── */
    .search-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
      animation: fadeSlideDown 0.4s 0.05s ease-out both;
    }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: white;
      border: 1.5px solid rgba(79, 70, 229, 0.15);
      border-radius: 14px;
      padding: 0 16px;
      height: 48px;
      flex: 1;
      max-width: 460px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-bar:focus-within {
      border-color: #4f46e5;
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
    }
    .search-icon { font-size: 18px; width: 18px; height: 18px; color: #4f46e5; opacity: 0.6; flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; outline: none;
      font-size: 13.5px; font-weight: 500;
      color: #1e293b; background: transparent;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .search-input::placeholder { color: #94a3b8; }
    .search-clear {
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border: none;
      background: #ede9fe; border-radius: 6px; cursor: pointer;
      transition: background 0.15s; flex-shrink: 0;
    }
    .search-clear mat-icon { font-size: 14px; width: 14px; height: 14px; color: #4f46e5; }
    .search-clear:hover { background: #c7d2fe; }
    .results-count { font-size: 13px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

    .workspaces-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
      margin-bottom: 36px;
    }

    .workspace-card {
      background: white;
      border-radius: 20px;
      border: 1px solid rgba(79,70,229,0.1);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      animation: fadeInUp 0.4s ease-out both;
    }
    .workspace-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(79,70,229,0.12), 0 4px 10px rgba(0,0,0,0.04);
      border-color: rgba(79,70,229,0.2);
    }

    .card-top-bar { height: 3px; background: linear-gradient(90deg, #4f46e5, #06b6d4); opacity: 0; transition: opacity 0.3s ease; }
    .workspace-card:hover .card-top-bar { opacity: 1; }
    .card-inner { padding: 20px; }

    .card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }

    .workspace-avatar {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 20px; flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(79,70,229,0.25);
    }

    .card-header-info { flex: 1; min-width: 0; }

    .workspace-name {
      font-size: 16px; font-weight: 700; color: #0f172a;
      letter-spacing: -0.01em; margin-bottom: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .workspace-owner { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #94a3b8; font-weight: 500; }
    .workspace-owner mat-icon { font-size: 13px; width: 13px; height: 13px; }

    .card-menu { flex-shrink: 0; opacity: 0; transition: opacity 0.2s; }
    .workspace-card:hover .card-menu { opacity: 1; }

    .icon-btn {
      width: 30px; height: 30px; border: none; border-radius: 8px;
      background: #f8fafc; cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: all 0.15s;
    }
    .icon-btn mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
    .icon-btn.danger:hover { background: #fee2e2; }
    .icon-btn.danger:hover mat-icon { color: #ef4444; }

    .workspace-description {
      font-size: 13px; color: #64748b; line-height: 1.55;
      margin: 0 0 14px;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }

    .workspace-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }

    .stat-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; background: #f5f3ff; border-radius: 20px;
      font-size: 12px; font-weight: 600; color: #64748b;
    }
    .stat-chip mat-icon { font-size: 13px; width: 13px; height: 13px; color: #4f46e5; opacity: 0.7; }

    .card-footer { border-top: 1px solid rgba(79,70,229,0.07); padding-top: 12px; display: flex; justify-content: flex-end; }

    .view-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 700; color: #4f46e5;
      background: none; border: none; cursor: pointer;
      padding: 6px 12px; border-radius: 8px; transition: all 0.15s;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .view-btn mat-icon { font-size: 16px; width: 16px; height: 16px; transition: transform 0.2s; }
    .view-btn:hover { background: #ede9fe; }
    .view-btn:hover mat-icon { transform: translateX(3px); }

    .empty-state {
      text-align: center; padding: 80px 40px; background: white;
      border-radius: 24px; border: 2px dashed rgba(79,70,229,0.2);
      margin-top: 20px; animation: fadeInUp 0.4s ease-out both;
    }
    .empty-icon {
      width: 80px; height: 80px; border-radius: 24px;
      background: linear-gradient(135deg, #ede9fe, #f5f3ff);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
    }
    .empty-icon mat-icon { font-size: 40px; width: 40px; height: 40px; color: #a5b4fc; }
    .empty-state h3 { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0 0 10px; letter-spacing: -0.02em; }
    .empty-state p { color: #94a3b8; font-size: 14px; margin: 0 0 28px; }

    .pagination-container { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(79,70,229,0.1); }

    .quick-jump { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
    .jump-label { color: #64748b; font-size: 13px; font-weight: 600; }
    .page-numbers { display: flex; gap: 8px; flex-wrap: wrap; }

    .page-number-btn {
      min-width: 36px; height: 36px; padding: 0 8px;
      border: 1px solid rgba(79,70,229,0.15); background: white;
      color: #4f46e5; border-radius: 10px; cursor: pointer;
      transition: all 0.2s ease; font-weight: 600;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .page-number-btn:hover { background: #ede9fe; border-color: #4f46e5; transform: translateY(-1px); }
    .page-number-btn.active { background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; border-color: #4f46e5; }

    @keyframes fadeSlideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .page-container { padding: 20px 16px; }
      h1 { font-size: 24px; }
      .workspaces-grid { grid-template-columns: 1fr; gap: 16px; }
      .page-header { flex-direction: column; align-items: flex-start; }
      .stats-summary { flex-direction: column; gap: 8px; }
      .search-bar { max-width: 100%; }
      .search-bar-wrapper { flex-wrap: wrap; }
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #f5f3ff; border-radius: 10px; }
    ::-webkit-scrollbar-thumb { background: #a5b4fc; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #818cf8; }
  `]
})
export class WorkspacesComponent implements OnInit, OnDestroy {
  private workspaceService = inject(WorkspaceService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private authService = inject(AuthService);

  private destroy$ = new Subject<void>();

  searchCtrl = new FormControl('');

  get isAdmin(): boolean {
    return this.authService.currentUser?.roles.includes('Admin') ?? false;
  }

  workspaces: Workspace[] = [];
  loading = true;
  currentPage = 1;
  pageSize = 9;
  pageSizeOptions = [6, 9, 12, 18, 24];
  totalWorkspaces = 0;
  totalPages = 0;
  private allWorkspaces: Workspace[] = [];

  ngOnInit(): void {
    this.loadWorkspaces();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.filterWorkspaces();
    });

    this.workspaceService.workspaceListChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadWorkspaces());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkspaces(): void {
    this.loading = true;
    this.workspaceService.getWorkspaces().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.allWorkspaces = response.data;
          this.filterWorkspaces();
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load workspaces', 'Close', { duration: 3000 });
      }
    });
  }

  filterWorkspaces(): void {
    const search = (this.searchCtrl.value || '').toLowerCase().trim();
    const filtered = search
      ? this.allWorkspaces.filter(w =>
        w.name.toLowerCase().includes(search) ||
        (w.description || '').toLowerCase().includes(search) ||
        w.ownerName.toLowerCase().includes(search)
      )
      : this.allWorkspaces;

    this.totalWorkspaces = filtered.length;
    this.totalPages = Math.ceil(this.totalWorkspaces / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.workspaces = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.totalPages = Math.ceil(this.totalWorkspaces / this.pageSize);
    this.filterWorkspaces();
    this.scrollToTop();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.filterWorkspaces();
      this.scrollToTop();
    }
  }

  getVisiblePages(): number[] {
    const visiblePages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) visiblePages.push(i);
    return visiblePages;
  }

  deleteWorkspace(workspaceId: string, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Workspace',
        message: 'Are you sure you want to delete this workspace? This action cannot be undone.',
        confirmLabel: 'Delete',
        danger: true
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.workspaceService.deleteWorkspace(workspaceId).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Workspace deleted', 'Close', { duration: 3000 });
              this.loadWorkspaces();
            }
          },
          error: () => this.snackBar.open('Failed to delete workspace', 'Close', { duration: 3000 })
        });
      }
    });
  }

  getCurrentPageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalWorkspaces);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openCreateWorkspaceModal(): void {
    const dialogRef = this.dialog.open(CreateWorkspaceModalComponent, {
      width: '500px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadWorkspaces();
        this.snackBar.open('Workspace created successfully!', 'Close', { duration: 3000 });
      }
    });
  }

  viewWorkspace(workspaceId: string): void {
    this.router.navigate(['/workspaces', workspaceId]);
  }
}
