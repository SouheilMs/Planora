import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs/operators';
// CORRECTION: 3 niveaux vers le haut (features/projects/sidebar -> src/app)
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './project-sidebar.component.html',
  styleUrls: ['./project-sidebar.component.scss']
})
export class ProjectSidebarComponent implements OnInit {
  authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  currentProject: any = null;
  userName = '';
  userEmail = '';
  userInitials = '';

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
      const projectId = this.extractProjectId(this.router.url);
      if (projectId) {
        this.loadProject(projectId);
      }
    });
  }

  private extractProjectId(url: string): string | null {
    const match = url.match(/\/projects\/([^\/]+)/);
    const projectId = match ? match[1] : null;
    if (!projectId || projectId === 'null' || projectId === 'undefined') {
      return null;
    }

    return projectId;
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
