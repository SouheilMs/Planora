import { Component, inject, signal } from '@angular/core';

import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
],
    template: `
    <div class="auth-card">
      <div class="auth-card-header">
        <h2>Create your account</h2>
        <p>Join Planora and start managing projects</p>
      </div>
    
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="field-row">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" autocomplete="given-name">
            @if (registerForm.get('firstName')?.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" autocomplete="family-name">
            @if (registerForm.get('lastName')?.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        </div>
    
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email address</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email">
          <mat-icon matPrefix class="field-icon">mail_outline</mat-icon>
          @if (registerForm.get('email')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
          @if (registerForm.get('email')?.hasError('email')) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>
    
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput formControlName="userName" autocomplete="username">
          <mat-icon matPrefix class="field-icon">alternate_email</mat-icon>
          @if (registerForm.get('userName')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
    
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password">
          <mat-icon matPrefix class="field-icon">lock_outline</mat-icon>
          <button type="button" mat-icon-button matSuffix (click)="showPassword.set(!showPassword())" tabindex="-1">
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (registerForm.get('password')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
          @if (registerForm.get('password')?.hasError('minlength')) {
            <mat-error>Minimum 8 characters</mat-error>
          }
        </mat-form-field>
    
        <button mat-raised-button class="submit-btn" type="submit"
          [disabled]="registerForm.invalid || loading">
          @if (loading) {
            <mat-spinner diameter="18"></mat-spinner>
          }
          @if (!loading) {
            <span>Create Account</span>
          }
        </button>
      </form>
    
      <p class="auth-footer">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
    </div>
    `,
    styles: [`
    .auth-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px 36px;
      box-shadow: 0 20px 40px rgba(0,0,0,.15);
    }

    .auth-card-header {
      text-align: center;
      margin-bottom: 28px;

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 4px;
      }
      p { color: #6b7280; font-size: 0.9375rem; }
    }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }

    .field-row { display: flex; gap: 12px; mat-form-field { flex: 1; } }

    .full-width { width: 100%; }

    .field-icon { color: #9ca3af; margin-right: 4px; font-size: 18px; width: 18px; height: 18px; }

    .submit-btn {
      width: 100%;
      height: 44px;
      margin-top: 8px;
      background: #4f46e5 !important;
      color: #fff !important;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: 8px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      color: #6b7280;
      font-size: 0.875rem;

      a { color: #4f46e5; font-weight: 600; text-decoration: none; }
      a:hover { text-decoration: underline; }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = false;
  showPassword = signal(false);

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    userName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.loading = true;
    const value = this.registerForm.value;
    this.authService.register({
      firstName: value.firstName!,
      lastName: value.lastName!,
      email: value.email!,
      userName: value.userName!,
      password: value.password!
    }).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.snackBar.open(response.message || 'Registration failed', 'Close', { duration: 4000 });
        }
      },
      error: err => {
        this.loading = false;
        const msg = err?.error?.message || 'Registration failed. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }
}
