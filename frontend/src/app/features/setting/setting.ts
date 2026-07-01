import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import { TranslationService } from '../../services/translation.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './setting.html',
  styleUrl: './setting.css',
})
export class Setting implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: any;

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  isSavingProfile = false;
  isChangingPassword = false;

  activeSection = 'profilo';
  showPasswordForm = false;
  fotoProfilo: string | null = null;

  metodiPagamento: { tipo: string; numero: string; scadenza: string; intestatario: string; icona: string }[] = [];
  showAggiungiCarta = false;
  nuovaCarta = { numero: '', scadenza: '', intestatario: '', cvv: '' };
  nuovaCartaErrors: Record<string, string> = {};
  cartaSelezionataIndex: number | null = null;

  preferenze = {
    lingua: 'Italiano',
    valuta: 'EUR (€)',
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private prefsService: PreferencesService,
    private i18n: TranslationService,
    private http: HttpClient,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
    });

    this.passwordForm = this.fb.group({
      vecchiaPassword: ['', Validators.required],
      nuovaPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.caricaProfilo();
    this.caricaPreferenze();
    this.caricaCarteLocali();
  }

  caricaProfilo(): void {
    this.currentUser = this.normalizzaUtente(this.authService.getLoggedUser());

    if (this.currentUser) {
      this.profileForm.patchValue({
        nome: this.currentUser.nome || '',
        cognome: this.currentUser.cognome || '',
        email: this.currentUser.email || '',
        telefono: this.currentUser.telefono || '',
      });
    }

    this.http.get<any>(`${environment.apiUrl}/utenti/profilo`).subscribe({
      next: (profile) => {
        const user = this.normalizzaUtente(profile);
        this.profileForm.patchValue({
          nome: user?.nome || '',
          cognome: user?.cognome || '',
          email: user?.email || '',
          telefono: user?.telefono || '',
        });
        this.currentUser = user;
        localStorage.setItem('utente', JSON.stringify(user));
      },
      error: (err) => {
        if (err.status === 401) this.gestisciSessioneScaduta();
      },
    });
  }

  caricaPreferenze(): void {
    this.prefsService.load();
    this.preferenze = {
      lingua: this.prefsService.lingua,
      valuta: this.prefsService.valuta,
    };
  }

  aggiornaProfilo(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.mostraAlert(this.i18n.translate('settings.msg.compila-campi'), 'warning');
      return;
    }

    const oldEmail = this.currentUser?.email;
    const newEmail = this.profileForm.value.email?.trim();

    const payload = {
      nome: this.profileForm.value.nome?.trim(),
      cognome: this.profileForm.value.cognome?.trim(),
      email: newEmail,
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

        this.mostraAlert(this.i18n.translate('settings.msg.profilo-ok'), 'success');
        this.isSavingProfile = false;
      },
      error: (err) => {
        if (err.status === 401) { this.isSavingProfile = false; this.gestisciSessioneScaduta(); return; }
        this.mostraAlert(this.estraiMessaggioErrore(err, this.i18n.translate('settings.msg.profilo-err')), 'error');
        this.isSavingProfile = false;
      },
    });
  }

  annullaProfilo(): void {
    this.profileForm.patchValue({
      nome: this.currentUser?.nome || '',
      cognome: this.currentUser?.cognome || '',
      email: this.currentUser?.email || '',
      telefono: this.currentUser?.telefono || '',
    });
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
  }

  cambiaPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.mostraAlert(this.i18n.translate('settings.password-rules'), 'warning');
      return;
    }

    const payload = {
      oldPassword: this.passwordForm.value.vecchiaPassword,
      newPassword: this.passwordForm.value.nuovaPassword,
    };

    this.isChangingPassword = true;

    this.http.post(`${environment.apiUrl}/utenti/profilo/cambia-password`, payload, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.mostraAlert(this.i18n.translate('settings.msg.password-ok'), 'success');
          this.passwordForm.reset();
          this.isChangingPassword = false;
          this.showPasswordForm = false;
          setTimeout(() => { this.authService.logout(); this.router.navigate(['/login']); }, 1500);
        },
        error: (err) => {
          if (err.status === 401) { this.isChangingPassword = false; this.gestisciSessioneScaduta(); return; }
          this.mostraAlert(this.estraiMessaggioErrore(err, this.i18n.translate('settings.msg.password-err')), 'error');
          this.isChangingPassword = false;
        },
      });
  }

  salvaPreferenze(): void {
    this.prefsService.save({
      lingua: this.preferenze.lingua,
      valuta: this.preferenze.valuta,
    });
    this.mostraAlert(this.i18n.translate('settings.msg.preferenze-ok'), 'success');
  }

  // ── Misc ─────────────────────────────────────────

  setActiveSection(section: string): void {
    this.activeSection = section;
    const el = document.getElementById('section-' + section);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  vaiAHome(): void {
    this.router.navigate(['/dashboard/home']);
  }

  get profileCompletion(): number {
    const fields = [
      this.profileForm.value.nome,
      this.profileForm.value.cognome,
      this.profileForm.value.email,
      this.profileForm.value.telefono,
      this.currentUser?.ruolo,
    ];
    const filled = fields.filter(v => v && String(v).trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }

  get emailVerificata(): boolean {
    return !!(this.profileForm.value.email || this.currentUser?.email);
  }

  get telefonoImpostato(): boolean {
    return !!(this.profileForm.value.telefono || this.currentUser?.telefono);
  }

  get roleBadge(): string {
    const map: Record<string, string> = { ADMIN: 'Admin', HOST: 'Host', GUEST: 'Guest' };
    return map[this.currentUser?.ruolo] ?? 'Utente';
  }

  get nomeCompleto(): string {
    const nome = this.profileForm.value.nome || this.currentUser?.nome || '';
    const cognome = this.profileForm.value.cognome || this.currentUser?.cognome || '';
    return `${nome} ${cognome}`.trim() || 'Non disponibile';
  }

  get userInitials(): string {
    const n = this.profileForm.value.nome || this.currentUser?.nome || 'U';
    const c = this.profileForm.value.cognome || this.currentUser?.cognome || 'S';
    return (n.charAt(0) + c.charAt(0)).toUpperCase();
  }

  get nuovaPasswordControl() {
    return this.passwordForm.get('nuovaPassword');
  }

  get nuovaPasswordNonValida(): boolean {
    const control = this.nuovaPasswordControl;
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onFotoSelezionata(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.fotoProfilo = reader.result as string; };
    reader.readAsDataURL(file);
  }

  rimuoviFoto(): void {
    this.fotoProfilo = null;
  }

  private isCartaScaduta(mese: number, anno: number): boolean {
    const ora = new Date();
    const annoCorrente = ora.getFullYear() % 100;
    const meseCorrente = ora.getMonth() + 1;
    return anno < annoCorrente || (anno === annoCorrente && mese < meseCorrente);
  }

  apriFormCarta(): void {
    this.nuovaCarta = { numero: '', scadenza: '', intestatario: '', cvv: '' };
    this.nuovaCartaErrors = {};
    this.showAggiungiCarta = true;
  }

  chiudiFormCarta(): void {
    this.showAggiungiCarta = false;
    this.nuovaCartaErrors = {};
  }

  formattaNumeroCarta(event: Event): void {
    const input = event.target as HTMLInputElement;
    const isAmex = input.value.replace(/\D/g, '').startsWith('34') || input.value.replace(/\D/g, '').startsWith('37');
    let val = input.value.replace(/\D/g, '').slice(0, isAmex ? 15 : 16);
    if (isAmex) {
      // formato 4-6-5
      const p1 = val.slice(0, 4);
      const p2 = val.slice(4, 10);
      const p3 = val.slice(10, 15);
      this.nuovaCarta.numero = [p1, p2, p3].filter(p => p).join(' ');
    } else {
      this.nuovaCarta.numero = val.replace(/(.{4})/g, '$1 ').trim();
    }
    input.value = this.nuovaCarta.numero;
  }

  formattaScadenza(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    this.nuovaCarta.scadenza = val;
    input.value = val;
  }

  confermaCarta(): void {
    this.nuovaCartaErrors = {};
    const num = this.nuovaCarta.numero.replace(/\s/g, '');
    const isAmex = num.startsWith('34') || num.startsWith('37');
    const lunghezzaAttesa = isAmex ? 15 : 16;
    if (num.length !== lunghezzaAttesa) this.nuovaCartaErrors['numero'] = `Inserisci un numero di carta valido (${lunghezzaAttesa} cifre)`;
    if (!/^\d{2}\/\d{2}$/.test(this.nuovaCarta.scadenza)) this.nuovaCartaErrors['scadenza'] = 'Formato non valido (MM/AA)';
    if (!this.nuovaCarta.intestatario.trim()) this.nuovaCartaErrors['intestatario'] = 'Inserisci il nome del titolare';
    if (!/^\d{3,4}$/.test(this.nuovaCarta.cvv)) this.nuovaCartaErrors['cvv'] = 'CVV non valido';

    const [mm, aa] = this.nuovaCarta.scadenza.split('/').map(Number);
    if (!this.nuovaCartaErrors['scadenza'] && (mm < 1 || mm > 12)) {
      this.nuovaCartaErrors['scadenza'] = 'Mese non valido';
    }

    if (!this.nuovaCartaErrors['scadenza'] && this.isCartaScaduta(mm, aa)) {
      this.nuovaCartaErrors['scadenza'] = 'La carta risulta scaduta';
    }

    if (Object.keys(this.nuovaCartaErrors).length > 0) return;

    const isVisa   = num.startsWith('4');
    const isMaster = num.startsWith('5');
    const prefix = isVisa ? 'Visa' : isMaster ? 'Mastercard' : isAmex ? 'American Express' : 'Carta';
    const icona  = isVisa ? 'fab fa-cc-visa' : isMaster ? 'fab fa-cc-mastercard' : isAmex ? 'fab fa-cc-amex' : 'fas fa-credit-card';

    this.metodiPagamento.push({
      tipo: prefix,
      numero: num.slice(-4),
      scadenza: this.nuovaCarta.scadenza,
      intestatario: this.nuovaCarta.intestatario.trim().toUpperCase(),
      icona,
    });

    this.salvaCarteLocali();
    this.showAggiungiCarta = false;
    this.mostraAlert('Carta aggiunta con successo.', 'success');
  }

  eliminaCarta(index: number): void {
    this.metodiPagamento.splice(index, 1);
    if (this.cartaSelezionataIndex === index) {
      this.cartaSelezionataIndex = null;
      localStorage.removeItem('ndv_carta_selezionata');
    } else if (this.cartaSelezionataIndex !== null && this.cartaSelezionataIndex > index) {
      this.cartaSelezionataIndex--;
      localStorage.setItem('ndv_carta_selezionata', String(this.cartaSelezionataIndex));
    }
    this.salvaCarteLocali();
  }

  selezionaCarta(index: number): void {
    this.cartaSelezionataIndex = this.cartaSelezionataIndex === index ? null : index;
    localStorage.setItem('ndv_carta_selezionata', String(this.cartaSelezionataIndex));
  }

  private caricaCarteLocali(): void {
    try {
      const raw = localStorage.getItem('ndv_metodi_pagamento');
      if (raw) this.metodiPagamento = JSON.parse(raw);
      const sel = localStorage.getItem('ndv_carta_selezionata');
      if (sel !== null && sel !== 'null') this.cartaSelezionataIndex = Number(sel);
    } catch {}
  }

  private salvaCarteLocali(): void {
    localStorage.setItem('ndv_metodi_pagamento', JSON.stringify(this.metodiPagamento));
  }

  mostraAlert(messaggio: string, tipo: 'success' | 'error' | 'info' | 'warning'): void {
    this.alertMessage = messaggio;
    this.alertType = tipo;
    this.showAlert = true;
  }

  nascondiAlert(): void {
    this.showAlert = false;
  }

  private normalizzaUtente(data: any): any {
    return data?.userDetails ?? data ?? null;
  }

  private estraiMessaggioErrore(err: any, fallback: string): string {
    if (err?.status === 401) return this.i18n.translate('settings.msg.sessione-scaduta');
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    if (err?.message) return err.message;
    return fallback;
  }

  private gestisciSessioneScaduta(): void {
    this.mostraAlert(this.i18n.translate('settings.msg.sessione-scaduta'), 'error');
    setTimeout(() => { this.authService.logout(); this.router.navigate(['/login']); }, 1500);
  }

  private aggiornaEmailNelTokenBasic(oldEmail: string, newEmail: string): void {
    const token = localStorage.getItem('auth_token');
    if (!token?.startsWith('Basic ')) return;
    try {
      const decoded = atob(token.replace('Basic ', ''));
      const sep = decoded.indexOf(':');
      if (sep === -1) return;
      if (decoded.substring(0, sep) !== oldEmail) return;
      localStorage.setItem('auth_token', `Basic ${btoa(`${newEmail}:${decoded.substring(sep + 1)}`)}`);
    } catch {}
  }
}
