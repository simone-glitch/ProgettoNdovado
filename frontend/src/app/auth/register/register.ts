import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { Alert } from '../../components/alert/alert';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, Alert, SharedModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  showPassword = false;
  showAlert    = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  registerForm = new FormGroup({
    nome:     new FormControl('', [Validators.required]),
    cognome:  new FormControl('', [Validators.required]),
    email:    new FormControl('', [Validators.required, Validators.email]),
    telefono: new FormControl(''),
    ruolo:    new FormControl('GUEST', [Validators.required]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('^(?=.*[A-Z])(?=.*\\d).{8,}$')
    ])
  });

  constructor(private authService: AuthService, private router: Router, private i18n: TranslationService) {}

  onSubmit(): void {
    if (!this.registerForm.valid) { this.registerForm.markAllAsTouched(); return; }

    const v = this.registerForm.value;
    this.authService.register({
      nome:     v.nome!,
      cognome:  v.cognome!,
      email:    v.email!,
      password: v.password!,
      ruolo:    v.ruolo!,
      telefono: v.telefono || undefined
    }).subscribe({
      next: () => {
        this.showAlertMessage(this.i18n.translate('auth.msg.registrazione-ok', 'it'), 'success');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        let msg = this.i18n.translate('auth.msg.registrazione-err', 'it');
        if (err.status === 0)                  msg = this.i18n.translate('auth.msg.server-non-raggiungibile', 'it');
        else if (typeof err.error === 'string') msg = err.error;
        else if (err.error?.message)            msg = err.error.message;
        this.showAlertMessage(msg, 'error');
      }
    });
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.alertMessage = message;
    this.alertType    = type;
    this.showAlert    = true;
  }

  onAlertDismiss(): void { this.showAlert = false; }
}
