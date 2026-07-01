import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { ChatWindow }  from '../../components/chat-window/chat-window';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive, ChatWindow, SharedModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  currentUser: any = {};
  sidebarOpen = false;
  isPrenotazioniRoute = false;
  showLogoutConfirm = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private prefsService: PreferencesService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getLoggedUser() ?? {};
    this.prefsService.load();

    this.isPrenotazioniRoute = this.router.url.includes('/dashboard/prenotazioni');
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.isPrenotazioniRoute = this.router.url.includes('/dashboard/prenotazioni');
    });
  }

  get isAdmin(): boolean { return this.currentUser?.ruolo === 'ADMIN'; }
  get isHost():  boolean { return this.currentUser?.ruolo === 'HOST';  }
  get isGuest(): boolean { return this.currentUser?.ruolo === 'GUEST'; }

  get userInitials(): string {
    const n = this.currentUser?.nome    ?? '';
    const c = this.currentUser?.cognome ?? '';
    return (n.charAt(0) + c.charAt(0)).toUpperCase() || '?';
  }

  get roleBadge(): string {
    const map: Record<string, string> = { ADMIN: 'Admin', HOST: 'Host', GUEST: 'Guest' };
    return map[this.currentUser?.ruolo] ?? '';
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar()  { this.sidebarOpen = false; }

  toggleChat(): void { this.chatService.toggleChat(); }

  goToSettings(): void { this.router.navigate(['/dashboard/settings']); }

  requestLogout(): void { this.showLogoutConfirm = true; }

  onLogoutConfirm(confermato: boolean): void {
    this.showLogoutConfirm = false;
    if (confermato) this.logout();
  }

  private logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
