import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/error.util';
import { fieldError, maxTwoDecimals } from '../../core/form.util';
import { ACCOUNT_TYPE_LABEL, Account, AccountType } from '../../core/models';

/** Administrador: cria a conta e o utilizador CLIENTE que será o seu dono. */
@Component({
  selector: 'app-account-create',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Nova conta</h1>
        <p class="muted">Cria a conta bancária e o acesso do cliente.</p>
      </div>
    </div>

    @if (created(); as acc) {
      <div class="alert alert-success" role="status">
        Conta <strong class="mono">{{ acc.accountNumber }}</strong> criada para
        {{ acc.customerName }} com saldo inicial de {{ acc.balance | number: '1.2-2' }} MZN.
        <a routerLink="/contas">Ver todas as contas</a>
      </div>
    }
    @if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
    }

    <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <h2>Dados da conta</h2>
      <div class="grid-2">
        <div class="field">
          <label for="customerName">Nome do cliente</label>
          <input id="customerName" type="text" formControlName="customerName" />
          @if (err('customerName'); as m) {
            <small class="field-error">{{ m }}</small>
          }
        </div>

        <div class="field">
          <label for="nuit">NUIT</label>
          <input id="nuit" type="text" inputmode="numeric" maxlength="9" formControlName="nuit" />
          @if (err('nuit'); as m) {
            <small class="field-error">{{ m }}</small>
          }
        </div>

        <div class="field">
          <label for="accountNumber">Número da conta</label>
          <input
            id="accountNumber"
            type="text"
            inputmode="numeric"
            maxlength="20"
            formControlName="accountNumber"
          />
          @if (err('accountNumber'); as m) {
            <small class="field-error">{{ m }}</small>
          }
        </div>

        <div class="field">
          <label for="accountType">Tipo de conta</label>
          <select id="accountType" formControlName="accountType">
            @for (t of accountTypes; track t) {
              <option [value]="t">{{ typeLabel[t] }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="initialBalance">Saldo inicial (MZN)</label>
          <input
            id="initialBalance"
            type="number"
            step="0.01"
            min="0"
            formControlName="initialBalance"
          />
          @if (err('initialBalance'); as m) {
            <small class="field-error">{{ m }}</small>
          }
        </div>
      </div>

      <h2>Acesso do cliente</h2>
      <div class="grid-2">
        <div class="field">
          <label for="username">Utilizador</label>
          <input id="username" type="text" autocomplete="off" formControlName="username" />
          @if (err('username'); as m) {
            <small class="field-error">{{ m }}</small>
          }
        </div>

        <div class="field">
          <label for="password">Palavra-passe</label>
          <input id="password" type="password" autocomplete="new-password" formControlName="password" />
          @if (err('password'); as m) {
            <small class="field-error">{{ m }}</small>
          }
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" [disabled]="submitting()">
          {{ submitting() ? 'A criar…' : 'Criar conta' }}
        </button>
      </div>
    </form>
  `,
})
export class AccountCreate {
  private readonly api = inject(ApiService);

  protected readonly accountTypes: AccountType[] = ['ORDEM', 'POUPANCA'];
  protected readonly typeLabel = ACCOUNT_TYPE_LABEL;

  protected readonly form = new FormGroup({
    customerName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    nuit: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{9}$/)],
    }),
    accountNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6,20}$/)],
    }),
    accountType: new FormControl<AccountType>('ORDEM', { nonNullable: true }),
    initialBalance: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      maxTwoDecimals,
    ]),
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(72)],
    }),
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly created = signal<Account | null>(null);

  private readonly messages: Record<string, Record<string, string>> = {
    customerName: {
      required: 'Indique o nome do cliente.',
      maxlength: 'No máximo 120 caracteres.',
    },
    nuit: { required: 'Indique o NUIT.', pattern: 'O NUIT deve ter 9 dígitos.' },
    accountNumber: {
      required: 'Indique o número da conta.',
      pattern: 'O número da conta deve ter entre 6 e 20 dígitos.',
    },
    initialBalance: {
      required: 'Indique o saldo inicial.',
      min: 'O saldo inicial não pode ser negativo.',
      decimals: 'No máximo 2 casas decimais.',
    },
    username: {
      required: 'Indique o utilizador.',
      minlength: 'No mínimo 3 caracteres.',
      maxlength: 'No máximo 50 caracteres.',
    },
    password: {
      required: 'Indique a palavra-passe.',
      minlength: 'No mínimo 6 caracteres.',
      maxlength: 'No máximo 72 caracteres.',
    },
  };

  protected err(name: string): string | null {
    return fieldError(this.form.get(name), this.messages[name] ?? {});
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.created.set(null);

    const v = this.form.getRawValue();
    this.api
      .createAccount({
        customerName: v.customerName.trim(),
        nuit: v.nuit,
        accountNumber: v.accountNumber,
        accountType: v.accountType,
        initialBalance: Number(v.initialBalance),
        username: v.username.trim(),
        password: v.password,
      })
      .subscribe({
        next: (account) => {
          this.created.set(account);
          this.submitting.set(false);
          this.form.reset({ accountType: 'ORDEM' });
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.submitting.set(false);
        },
      });
  }
}
