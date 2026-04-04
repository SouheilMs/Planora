import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
// CORRECTION: chemins depuis shared/components/sidebar -> src/app
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;

  authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  currentProject: any = null;
  showProjectNav = false;
  userName = '';
  userEmail = '';
  userInitials = '';
  backlogCount = 0;

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.userName = user.fullName || 'Utilisateur';
      this.userEmail = user.email || '';
      this.userInitials = this.userName.charAt(0).toUpperCase();
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const url = this.router.url;
      this.showProjectNav = url.includes('/projects/') &&
        !url.includes('/projects/list') &&
        !url.match(/\/projects\/?$/);

      if (this.showProjectNav) {
        const projectId = this.extractProjectId(url);
        if (projectId) {
          this.loadProject(projectId);
        }
      } else {
        this.currentProject = null;
      }
    });
  }

  private extractProjectId(url: string): string | null {
    const match = url.match(/\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private loadProject(projectId: string): void {
    this.projectService.getProject(projectId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.currentProject = response.data;
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement projet', err);
      }
    });
  }

  getProjectColor(): string {
    return this.currentProject?.color || '#4f46e5';
  }
  // dashboard.component.ts
  goToAllTasks(): void {
    this.router.navigate(['/tasks/all']);
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
