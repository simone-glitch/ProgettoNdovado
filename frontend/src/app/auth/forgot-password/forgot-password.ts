import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Alert } from '../../components/alert/alert';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, Alert, NgIf],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  sent = false;
  loading = false;
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  emailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (this.emailForm.valid) {
      this.loading = true;
      this.showAlert = false;
      const email = this.emailForm.value.email!;
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.loading = false;
          this.sent = true;
        },
        error: () => {
          this.loading = false;
          this.showAlertMessage('Errore durante l\'invio. Controlla l\'email inserita e riprova.', 'error');
        }
      });
    }
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
  }

  onAlertDismiss(): void {
    this.showAlert = false;
  }
}
