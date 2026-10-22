import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ROLE_LABEL } from '../core/models';

/** Estrutura comum às páginas autenticadas: barra lateral + conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <aside class="sidebar">
        <a class="brand" routerLink="/">
          <span class="brand-logo">GC</span>
          <span>Gestão de Contas</span>
        </a>

        <nav aria-label="Navegação principal">
          @if (auth.isAdmin()) {
            <a routerLink="/contas" routerLinkActive="active">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Contas
            </a>
            <a routerLink="/nova-conta" routerLinkActive="active">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Nova conta
            </a>
          } @else {
            <a routerLink="/minha-conta" routerLinkActive="active">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              A minha conta
            </a>
            <a routerLink="/extracto" routerLinkActive="active">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
              Extracto
            </a>
          }
          <a routerLink="/transferir" routerLinkActive="active">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="m16 21 4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
            Transferir
          </a>
        </nav>

        <div class="sidebar-foot">
          <div class="user-card">
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <div>
              <strong>{{ auth.username() }}</strong>
              <small>{{ roleLabel() }}</small>
            </div>
          </div>
          <button type="button" class="logout" (click)="auth.logout()">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);

  protected readonly initials = computed(() => this.auth.username().slice(0, 2).toUpperCase());

  protected roleLabel(): string {
    const role = this.auth.role();
    return role ? ROLE_LABEL[role] : '';
  }
}
