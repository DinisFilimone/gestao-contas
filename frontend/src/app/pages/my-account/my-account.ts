import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/error.util';
import { ACCOUNT_TYPE_LABEL, Account, Balance, MOVEMENT_LABEL, Movement } from '../../core/models';

/** Cliente: cartão com o saldo, últimos movimentos e dados da conta. */
@Component({
  selector: 'app-my-account',
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>A minha conta</h1>
        <p class="muted">Saldo, últimos movimentos e dados da conta.</p>
      </div>
      <div class="header-actions">
        <a class="btn btn-primary" routerLink="/transferir">Nova transferência</a>
      </div>
    </div>

    @if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
    }

    @if (loading()) {
      <div class="skeleton skeleton-card" aria-hidden="true"></div>
      <div class="skeleton" aria-hidden="true"></div>
      <div class="skeleton" aria-hidden="true"></div>
      <span class="sr-only">A carregar…</span>
    } @else if (account(); as acc) {
      <section class="bank-card" aria-label="Resumo da conta">
        <div class="bank-card-top">
          <span class="bank-card-chip" aria-hidden="true"></span>
          <span class="bank-card-type">Conta {{ typeLabel[acc.accountType] }}</span>
        </div>
        <p class="bank-card-label">Saldo disponível</p>
        <p class="bank-card-balance">
          {{ (balance()?.balance ?? acc.balance) | number: '1.2-2' }} <small>MZN</small>
        </p>
        <div class="bank-card-bottom">
          <div>
            <span>Titular</span>
            <strong>{{ acc.customerName }}</strong>
          </div>
          <div>
            <span>Nº da conta</span>
            <strong class="mono">{{ acc.accountNumber }}</strong>
          </div>
        </div>
      </section>

      <div class="balance-meta balance-line no-print">
        @if (balance(); as b) {
          <span class="muted">Consultado em {{ b.consultedAt | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
        } @else {
          <span class="muted">A consultar o saldo…</span>
        }
        <button
          type="button"
          class="btn btn-ghost"
          (click)="refresh(acc.accountNumber)"
          [disabled]="refreshing()"
        >
          {{ refreshing() ? 'A actualizar…' : 'Actualizar saldo' }}
        </button>
      </div>

      <div class="two-col">
        <section class="card">
          <h2>Últimos movimentos</h2>
          @if (recent().length === 0) {
            <p class="empty">Ainda não tem movimentos.</p>
          } @else {
            <ul class="tx-list">
              @for (m of recent(); track $index) {
                <li>
                  <span
                    class="tx-icon"
                    [class.tx-out]="isDebit(m)"
                    [class.tx-in]="!isDebit(m)"
                    aria-hidden="true"
                    >{{ isDebit(m) ? '↑' : '↓' }}</span
                  >
                  <div class="tx-main">
                    <strong>{{ m.description }}</strong>
                    <small class="muted">
                      {{ movementLabel[m.type] }} · {{ m.dateTime | date: 'dd/MM/yyyy HH:mm' }}
                    </small>
                  </div>
                  <span
                    class="tx-amount"
                    [class.amount-out]="isDebit(m)"
                    [class.amount-in]="!isDebit(m)"
                  >
                    {{ isDebit(m) ? '−' : '+' }} {{ m.amount | number: '1.2-2' }}
                  </span>
                </li>
              }
            </ul>
            <div class="form-actions">
              <a class="btn" routerLink="/extracto">Ver extracto completo</a>
            </div>
          }
        </section>

        <section class="card">
          <h2>Dados da conta</h2>
          <dl class="details details-stack">
            <div>
              <dt>Titular</dt>
              <dd>{{ acc.customerName }}</dd>
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
        </section>
      </div>
    }
  `,
})
export class MyAccount implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly typeLabel = ACCOUNT_TYPE_LABEL;
  protected readonly movementLabel = MOVEMENT_LABEL;
  protected readonly account = signal<Account | null>(null);
  protected readonly balance = signal<Balance | null>(null);
  protected readonly recent = signal<Movement[]>([]);
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

  protected isDebit(m: Movement): boolean {
    return m.type === 'TRANSFERENCIA_ENVIADA';
  }

  /** Volta a consultar o saldo e os 5 movimentos mais recentes. */
  protected refresh(accountNumber: string): void {
    this.refreshing.set(true);
    this.error.set(null);
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
    this.api.getStatement(accountNumber, 0, 5).subscribe({
      next: (page) => this.recent.set(page.content),
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }
}
