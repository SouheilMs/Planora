import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div style="text-align: center; padding: 24px;">
      <div style="background: #fee2e2; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <mat-icon style="color: #dc2626; font-size: 32px; width: 32px; height: 32px;">error</mat-icon>
      </div>
      <h2 mat-dialog-title style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #111827;">Cannot Add Project Manager</h2>
      <mat-dialog-content style="color: #6b7280; margin-bottom: 20px; font-size: 14px;">
        {{ data.message }}
      </mat-dialog-content>
      <mat-dialog-actions align="center" style="justify-content: center; padding: 0;">
        <button mat-raised-button mat-dialog-close
          style="min-width: 120px; border-radius: 40px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white;">
          OK
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class ErrorDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) { }
}
