// projects-list.component.ts - RED THEME
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ProjectFormDialogComponent } from './project-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule,
    MatProgressBarModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, LoadingComponent
  ],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  projects: Project[] = [];
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;
  loading = true;
  searchCtrl = new FormControl('');

  get canManage(): boolean {
    return this.authService.isAuthenticated;
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(['Admin']);
  }

  ngOnInit(): void {
    this.loadProjects();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadProjects();
      });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects(this.currentPage, this.pageSize, this.searchCtrl.value || '').subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.projects = response.data.items;
          this.totalCount = response.data.totalCount;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load projects', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  openCreate(): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '520px', data: null });
    ref.afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  openEdit(project: Project): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '520px', data: project });
    ref.afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  deleteProject(project: Project): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        danger: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.projectService.deleteProject(project.id).subscribe({
        next: response => {
          if (response.success) {
            this.snackBar.open('Project deleted', 'Close', { duration: 3000 });
            this.loadProjects();
          }
        },
        error: () => this.snackBar.open('Failed to delete project', 'Close', { duration: 3000 })
      });
    });
  }
}
