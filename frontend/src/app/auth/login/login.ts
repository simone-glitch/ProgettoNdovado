import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import {Alert} from '../../components/alert/alert';
import { NgIf, NgClass } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, Alert, NgIf, NgClass, SharedModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  showPassword = false;
  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private i18n: TranslationService
  ) {}

  onSubmit() {
    if (this.loginForm.valid) {
      const email = this.loginForm.value.email!;
      const password = this.loginForm.value.password!;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.showAlertMessage(this.i18n.translate('auth.msg.credenziali-errate', 'it'), 'error');
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
