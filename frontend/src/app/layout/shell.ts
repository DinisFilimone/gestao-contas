import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ROLE_LABEL } from '../core/models';

/** Estrutura comum às páginas autenticadas: barra de topo + conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" routerLink="/">Gestão de Contas</a>

        <nav aria-label="Navegação principal">
          @if (auth.isAdmin()) {
            <a routerLink="/contas" routerLinkActive="active">Contas</a>
            <a routerLink="/nova-conta" routerLinkActive="active">Nova conta</a>
          } @else {
            <a routerLink="/minha-conta" routerLinkActive="active">A minha conta</a>
            <a routerLink="/extracto" routerLinkActive="active">Extracto</a>
          }
          <a routerLink="/transferir" routerLinkActive="active">Transferir</a>
        </nav>

        <div class="user">
          <span class="user-name">{{ auth.username() }}</span>
          <span class="badge">{{ roleLabel() }}</span>
          <button type="button" class="btn btn-ghost" (click)="auth.logout()">Sair</button>
        </div>
      </div>
    </header>

    <main class="container">
      <router-outlet />
    </main>
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);

  protected roleLabel(): string {
    const role = this.auth.role();
    return role ? ROLE_LABEL[role] : '';
  }
}
