import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-project-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
      margin-left: 260px;
      background: linear-gradient(160deg, #fafbff 0%, #f5f3ff 60%, #ede9fe 100%);
      min-height: 100vh;
    }
    @media (max-width: 768px) {
      .main-content { margin-left: 0; }
    }
  `]
})
export class ProjectLayoutComponent { }
