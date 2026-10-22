import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { LoginRequest, LoginResponse, Role } from './models';

interface Session {
  token: string;
  username: string;
  role: Role;
  /** Instante (ms desde 1970) em que o token expira. */
  expiresAt: number;
}

const STORAGE_KEY = 'gestao-contas.session';

/**
 * Guarda a sessão (JWT) em sessionStorage: desaparece ao fechar o separador,
 * o que é mais seguro do que localStorage para uma aplicação bancária.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(this.restore());

  readonly username = computed(() => this.session()?.username ?? '');
  readonly role = computed(() => this.session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  login(credentials: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, credentials)
      .pipe(tap((res) => this.start(res)));
  }

  /** Termina a sessão. `expired` mostra o aviso de sessão expirada no login. */
  logout(expired = false): void {
    this.clear();
    void this.router.navigate(['/login'], expired ? { queryParams: { expirada: '1' } } : {});
  }

  /** Verifica (no momento da chamada) se existe uma sessão válida e não expirada. */
  isAuthenticated(): boolean {
    const s = this.session();
    if (!s) {
      return false;
    }
    if (s.expiresAt <= Date.now()) {
      this.clear();
      return false;
    }
    return true;
  }

  token(): string | null {
    return this.isAuthenticated() ? (this.session()?.token ?? null) : null;
  }

  /** Página inicial de cada perfil. */
  homePath(): string {
    return this.isAdmin() ? '/contas' : '/minha-conta';
  }

  private start(res: LoginResponse): void {
    const session: Session = {
      token: res.token,
      username: res.username,
      role: res.role,
      expiresAt: Date.now() + res.expiresInSeconds * 1000,
    };
    this.session.set(session);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* armazenamento indisponível: a sessão fica só em memória */
    }
  }

  private clear(): void {
    this.session.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorar */
    }
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const s = JSON.parse(raw) as Session;
      const valid =
        typeof s.token === 'string' &&
        typeof s.username === 'string' &&
        (s.role === 'ADMIN' || s.role === 'CLIENTE') &&
        typeof s.expiresAt === 'number' &&
        s.expiresAt > Date.now();
      return valid ? s : null;
    } catch {
      return null;
    }
  }
}
