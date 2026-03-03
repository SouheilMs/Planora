import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, MatIconModule],
  template: `
    <div class="auth-layout">
      <div class="auth-branding">
        <div class="auth-logo">
          <mat-icon>rocket_launch</mat-icon>
          <span>Planora</span>
        </div>
        <p class="auth-tagline">Manage your projects with clarity and speed.</p>
      </div>
      <div class="auth-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      padding: 24px;
    }

    .auth-branding {
      text-align: center;
      margin-bottom: 32px;
    }

    .auth-logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #fff;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -.03em;
      margin-bottom: 8px;

      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }

    .auth-tagline {
      color: rgba(255,255,255,.75);
      font-size: 0.9375rem;
    }

    .auth-content { width: 100%; max-width: 440px; }
  `]
})
export class AuthLayoutComponent {}
