import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Alert } from '../../components/alert/alert';
import { NgIf, NgClass } from '@angular/common';

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('password')?.value;
  const conf = group.get('conferma')?.value;
  return pw && conf && pw !== conf ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, Alert, NgIf, NgClass],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  token = '';
  tokenValido = true;
  done = false;
  loading = false;
  showPassword = false;
  showConferma = false;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  resetForm = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    conferma: new FormControl('', [Validators.required]),
  }, { validators: passwordMatch });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.tokenValido = false;
    }
  }

  get pwControl()   { return this.resetForm.get('password')!; }
  get confControl() { return this.resetForm.get('conferma')!; }

  onSubmit() {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    this.loading = true;
    this.showAlert = false;
    const nuovaPassword = this.pwControl.value!;
    this.authService.resetPassword(this.token, nuovaPassword).subscribe({
      next: () => { this.loading = false; this.done = true; },
      error: (err) => {
        this.loading = false;
        const msg = typeof err.error === 'string'
          ? err.error
          : 'Il link è scaduto o non valido. Richiedine uno nuovo.';
        this.showAlertMessage(msg, 'error');
        if (err.status === 410) this.tokenValido = false;
      }
    });
  }

  showAlertMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.alertMessage = msg; this.alertType = type; this.showAlert = true;
  }
  onAlertDismiss() { this.showAlert = false; }
}
