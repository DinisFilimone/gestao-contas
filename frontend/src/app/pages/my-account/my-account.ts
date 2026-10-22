import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/error.util';
import { ACCOUNT_TYPE_LABEL, Account, Balance } from '../../core/models';

/** Cliente: dados da sua conta e consulta de saldo. */
@Component({
  selector: 'app-my-account',
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>A minha conta</h1>
        <p class="muted">Dados da conta e saldo disponível.</p>
      </div>
    </div>

    @if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
    }

    @if (loading()) {
      <p class="muted">A carregar…</p>
    } @else if (account(); as acc) {
      <section class="card balance-card">
        <span class="muted">Saldo disponível</span>
        <p class="balance-big">{{ (balance()?.balance ?? acc.balance) | number: '1.2-2' }} MZN</p>
        <div class="balance-meta">
          @if (balance(); as b) {
            <span class="muted">Consultado em {{ b.consultedAt | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
          }
          <button type="button" class="btn btn-ghost" (click)="refresh(acc.accountNumber)" [disabled]="refreshing()">
            {{ refreshing() ? 'A actualizar…' : 'Actualizar saldo' }}
          </button>
        </div>
      </section>

      <section class="card">
        <h2>Dados da conta</h2>
        <dl class="details">
          <div>
            <dt>Titular</dt>
            <dd>{{ acc.customerName }}</dd>
          </div>
          <div>
            <dt>Número da conta</dt>
            <dd class="mono">{{ acc.accountNumber }}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{{ typeLabel[acc.accountType] }}</dd>
          </div>
          <div>
            <dt>NUIT</dt>
            <dd class="mono">{{ acc.nuit }}</dd>
          </div>
          <div>
            <dt>Aberta em</dt>
            <dd>{{ acc.createdAt | date: 'dd/MM/yyyy' }}</dd>
          </div>
        </dl>

        <div class="form-actions">
          <a class="btn btn-primary" routerLink="/transferir">Nova transferência</a>
          <a class="btn" routerLink="/extracto">Ver extracto</a>
        </div>
      </section>
    }
  `,
})
export class MyAccount implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly typeLabel = ACCOUNT_TYPE_LABEL;
  protected readonly account = signal<Account | null>(null);
  protected readonly balance = signal<Balance | null>(null);
  protected readonly loading = signal(true);
  protected readonly refreshing = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getMyAccount().subscribe({
      next: (acc) => {
        this.account.set(acc);
        this.loading.set(false);
        this.refresh(acc.accountNumber);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected refresh(accountNumber: string): void {
    this.refreshing.set(true);
    this.api.getBalance(accountNumber).subscribe({
      next: (b) => {
        this.balance.set(b);
        this.refreshing.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.refreshing.set(false);
      },
    });
  }
}
