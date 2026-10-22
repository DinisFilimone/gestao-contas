import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/error.util';
import { fieldError } from '../../core/form.util';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <section class="card auth-card">
        <h1>Gestão de Contas</h1>
        <p class="muted">Inicie sessão para continuar.</p>

        @if (expirada()) {
          <div class="alert alert-warn" role="alert">
            A sua sessão expirou. Inicie sessão novamente.
          </div>
        }
        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="username">Utilizador</label>
            <input id="username" type="text" formControlName="username" autocomplete="username" />
            @if (usernameError(); as msg) {
              <small class="field-error">{{ msg }}</small>
            }
          </div>

          <div class="field">
            <label for="password">Palavra-passe</label>
            <div class="input-group">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="btn btn-ghost"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-pressed]="showPassword()"
              >
                {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
              </button>
            </div>
            @if (passwordError(); as msg) {
              <small class="field-error">{{ msg }}</small>
            }
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
            {{ loading() ? 'A entrar…' : 'Entrar' }}
          </button>
        </form>
      </section>
    </main>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query param ?expirada=1, definido quando o token expira. */
  readonly expirada = input<string>();

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected usernameError() {
    return fieldError(this.form.controls.username, { required: 'Indique o utilizador.' });
  }

  protected passwordError() {
    return fieldError(this.form.controls.password, { required: 'Indique a palavra-passe.' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { username, password } = this.form.getRawValue();
    this.auth.login({ username: username.trim(), password }).subscribe({
      next: () => void this.router.navigateByUrl(this.auth.homePath()),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(
          err instanceof HttpErrorResponse && err.status === 401
            ? 'Utilizador ou palavra-passe incorrectos.'
            : errorMessage(err),
        );
      },
    });
  }
}
