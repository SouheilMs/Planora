import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon" [class.danger]="data.danger">
        <mat-icon>{{ data.danger ? 'warning' : 'help_outline' }}</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <p class="confirm-message">{{ data.message }}</p>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>{{ data.cancelLabel || 'Cancel' }}</button>
        <button mat-raised-button [class.danger-btn]="data.danger" (click)="confirm()">
          {{ data.confirmLabel || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding: 8px 4px; text-align: center; }
    .confirm-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: #eff6ff; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 16px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #3b82f6; }
      &.danger { background: #fff1f2; mat-icon { color: #ef4444; } }
    }
    h2[mat-dialog-title] { font-size: 1.125rem; font-weight: 700; margin-bottom: 8px; }
    .confirm-message { color: #6b7280; font-size: 0.9375rem; margin-bottom: 8px; }
    .danger-btn { background: #ef4444 !important; color: #fff !important; }
    mat-dialog-actions { justify-content: center !important; gap: 12px; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    private dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }
}
