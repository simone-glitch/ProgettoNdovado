import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './setting.html',
  styleUrl: './setting.css',
})
export class Setting implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: any;

  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  isSavingProfile: boolean = false;
  isChangingPassword: boolean = false;

  readonly passwordRulesMessage = 'La password deve avere almeno 8 caratteri, almeno una lettera maiuscola e almeno un numero.';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      vecchiaPassword: ['', Validators.required],
      nuovaPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
        ]
      ]
    });
  }

  ngOnInit(): void {
    this.caricaProfilo();
  }

  caricaProfilo(): void {
    this.currentUser = this.normalizzaUtente(this.authService.getLoggedUser());

    this.http.get<any>(`${environment.apiUrl}/utenti/profilo`).subscribe({
      next: (profile) => {
        const user = this.normalizzaUtente(profile);

        this.profileForm.patchValue({
          nome: user?.nome || '',
          cognome: user?.cognome || '',
          email: user?.email || ''
        });

        this.currentUser = user;
        localStorage.setItem('utente', JSON.stringify(user));
      },
      error: (err) => {
        console.error('Errore caricamento profilo:', err);

        if (err.status === 401) {
          this.gestisciSessioneScaduta();
          return;
        }

        if (this.currentUser) {
          this.profileForm.patchValue({
            nome: this.currentUser?.nome || '',
            cognome: this.currentUser?.cognome || '',
            email: this.currentUser?.email || ''
          });
        }
      }
    });
  }

  aggiornaProfilo(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.mostraAlert('Compila correttamente tutti i campi del profilo.', 'warning');
      return;
    }

    const oldEmail = this.currentUser?.email;
    const newEmail = this.profileForm.value.email?.trim();

    const payload = {
      nome: this.profileForm.value.nome?.trim(),
      cognome: this.profileForm.value.cognome?.trim(),
      email: newEmail
    };

    this.isSavingProfile = true;

    this.http.put<any>(`${environment.apiUrl}/utenti/profilo`, payload).subscribe({
      next: (response) => {
        const updatedUser = this.normalizzaUtente(response);

        this.currentUser = updatedUser;
        localStorage.setItem('utente', JSON.stringify(updatedUser));

        if (oldEmail && updatedUser?.email && oldEmail !== updatedUser.email) {
          this.aggiornaEmailNelTokenBasic(oldEmail, updatedUser.email);
        }

        this.mostraAlert('Profilo aggiornato con successo!', 'success');
        this.isSavingProfile = false;
      },
      error: (err) => {
        console.error('Errore aggiornamento profilo:', err);

        if (err.status === 401) {
          this.isSavingProfile = false;
          this.gestisciSessioneScaduta();
          return;
        }

        const message = this.estraiMessaggioErrore(
          err,
          'Errore durante l\'aggiornamento del profilo.'
        );

        this.mostraAlert(message, 'error');
        this.isSavingProfile = false;
      }
    });
  }

  cambiaPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.mostraAlert(this.passwordRulesMessage, 'warning');
      return;
    }

    const payload = {
      oldPassword: this.passwordForm.value.vecchiaPassword,
      newPassword: this.passwordForm.value.nuovaPassword
    };

    this.isChangingPassword = true;

    this.http.post(`${environment.apiUrl}/utenti/profilo/cambia-password`, payload, { responseType: 'text' }).subscribe({
      next: () => {
        this.mostraAlert('Password cambiata con successo. Effettua il login con la nuova password.', 'success');
        this.passwordForm.reset();
        this.isChangingPassword = false;

        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        console.error('Errore cambio password:', err);

        if (err.status === 401) {
          this.isChangingPassword = false;
          this.gestisciSessioneScaduta();
          return;
        }

        const message = this.estraiMessaggioErrore(
          err,
          'Errore. Controlla la vecchia password e riprova.'
        );

        this.mostraAlert(message, 'error');
        this.isChangingPassword = false;
      }
    });
  }

  private normalizzaUtente(data: any): any {
    return data?.userDetails ?? data ?? null;
  }

  private estraiMessaggioErrore(err: any, fallback: string): string {
    if (err?.status === 401) {
      return 'Sessione scaduta o credenziali non valide. Effettua nuovamente il login.';
    }

    if (typeof err?.error === 'string') {
      return err.error;
    }

    if (err?.error?.message) {
      return err.error.message;
    }

    if (err?.message) {
      return err.message;
    }

    return fallback;
  }

  private gestisciSessioneScaduta(): void {
    this.mostraAlert('Sessione scaduta o credenziali non valide. Effettua nuovamente il login.', 'error');

    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    }, 1500);
  }

  private aggiornaEmailNelTokenBasic(oldEmail: string, newEmail: string): void {
    const token = localStorage.getItem('auth_token');

    if (!token || !token.startsWith('Basic ')) {
      return;
    }

    try {
      const encodedCredentials = token.replace('Basic ', '');
      const decodedCredentials = atob(encodedCredentials);
      const separatorIndex = decodedCredentials.indexOf(':');

      if (separatorIndex === -1) {
        return;
      }

      const currentEmail = decodedCredentials.substring(0, separatorIndex);
      const currentPassword = decodedCredentials.substring(separatorIndex + 1);

      if (currentEmail !== oldEmail) {
        return;
      }

      const newCredentials = btoa(`${newEmail}:${currentPassword}`);
      localStorage.setItem('auth_token', `Basic ${newCredentials}`);
    } catch (error) {
      console.error('Errore aggiornamento token Basic:', error);
    }
  }

  get nuovaPasswordControl() {
    return this.passwordForm.get('nuovaPassword');
  }

  get nuovaPasswordNonValida(): boolean {
    const control = this.nuovaPasswordControl;
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get userInitials(): string {
    const n = this.profileForm.value.nome || 'U';
    const c = this.profileForm.value.cognome || 'S';
    return (n.charAt(0) + c.charAt(0)).toUpperCase();
  }

  mostraAlert(messaggio: string, tipo: 'success' | 'error' | 'info' | 'warning'): void {
    this.alertMessage = messaggio;
    this.alertType = tipo;
    this.showAlert = true;
  }

  nascondiAlert(): void {
    this.showAlert = false;
  }
}
