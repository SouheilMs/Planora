import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <app-navbar (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())"></app-navbar>
    <app-sidebar [collapsed]="sidebarCollapsed()"></app-sidebar>
    <main class="main-content" [class.collapsed]="sidebarCollapsed()">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-content {
      margin-top: 64px;
      margin-left: 240px;
      min-height: calc(100vh - 64px);
      background: #f9fafb;
      transition: margin-left .2s ease;
    }
    .main-content.collapsed {
      margin-left: 64px;
    }
    @media (max-width: 768px) {
      .main-content { margin-left: 64px; }
      .main-content.collapsed { margin-left: 0; }
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
}
