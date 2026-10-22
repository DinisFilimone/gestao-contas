import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/error.util';
import {
  ACCOUNT_TYPE_LABEL,
  Account,
  MOVEMENT_LABEL,
  Movement,
  Page,
} from '../../core/models';

/**
 * Extracto paginado. ADMIN: /contas/:numero/extracto. CLIENTE: /extracto
 * (a conta vem de /accounts/me).
 */
@Component({
  selector: 'app-statement',
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Extracto</h1>
        <p class="muted">Histórico de movimentos da conta.</p>
      </div>
      <div class="header-actions no-print">
        @if (auth.isAdmin()) {
          <a class="btn" routerLink="/contas">Voltar às contas</a>
        }
        <button type="button" class="btn" (click)="exportCsv()" [disabled]="!data()">
          Exportar CSV
        </button>
        <button type="button" class="btn" (click)="print()" [disabled]="!data()">Imprimir</button>
      </div>
    </div>

    @if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
    }

    @if (account(); as acc) {
      <section class="card">
        <dl class="details">
          <div>
            <dt>Titular</dt>
            <dd>{{ acc.customerName }}</dd>
          </div>
          <div>
            <dt>Conta</dt>
            <dd class="mono">{{ acc.accountNumber }}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{{ typeLabel[acc.accountType] }}</dd>
          </div>
          <div>
            <dt>Saldo actual</dt>
            <dd class="strong">{{ acc.balance | number: '1.2-2' }} MZN</dd>
          </div>
        </dl>
      </section>
    }

    @if (loading()) {
      <div class="skeleton" aria-hidden="true"></div>
      <div class="skeleton" aria-hidden="true"></div>
      <div class="skeleton" aria-hidden="true"></div>
      <span class="sr-only">A carregar movimentos…</span>
    } @else if (data(); as d) {
      <section class="card">
        @if (d.content.length === 0) {
          <p class="empty">Esta conta ainda não tem movimentos.</p>
        } @else {
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Operação</th>
                  <th>Descrição</th>
                  <th>Contraparte</th>
                  <th class="num">Valor (MZN)</th>
                  <th class="num">Saldo resultante (MZN)</th>
                </tr>
              </thead>
              <tbody>
                @for (m of d.content; track $index) {
                  <tr>
                    <td class="nowrap">{{ m.dateTime | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td>
                      <span
                        class="badge"
                        [class.badge-in]="m.type === 'TRANSFERENCIA_RECEBIDA'"
                        [class.badge-out]="m.type === 'TRANSFERENCIA_ENVIADA'"
                        >{{ movementLabel[m.type] }}</span
                      >
                    </td>
                    <td>{{ m.description }}</td>
                    <td class="mono">{{ m.counterpartAccountNumber || '—' }}</td>
                    <td class="num" [class.amount-out]="isDebit(m)" [class.amount-in]="!isDebit(m)">
                      {{ isDebit(m) ? '−' : '+' }} {{ m.amount | number: '1.2-2' }}
                    </td>
                    <td class="num">{{ m.balanceAfter | number: '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="pager no-print">
            <span class="muted">
              {{ firstItem(d) }}–{{ lastItem(d) }} de {{ d.totalElements }} movimentos
            </span>
            <div class="pager-controls">
              <label class="muted" for="size">Por página</label>
              <select id="size" (change)="changeSize($any($event.target).value)">
                @for (s of pageSizes; track s) {
                  <option [value]="s" [selected]="s === size()">{{ s }}</option>
                }
              </select>
              <button type="button" class="btn" (click)="goTo(d.page - 1)" [disabled]="d.page <= 0">
                Anterior
              </button>
              <span>Página {{ d.page + 1 }} de {{ d.totalPages }}</span>
              <button
                type="button"
                class="btn"
                (click)="goTo(d.page + 1)"
                [disabled]="d.page + 1 >= d.totalPages"
              >
                Seguinte
              </button>
            </div>
          </div>
        }
      </section>
    }
  `,
})
export class Statement {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  /** Parâmetro de rota :numero (só no perfil ADMIN). */
  readonly numero = input<string>();

  protected readonly typeLabel = ACCOUNT_TYPE_LABEL;
  protected readonly movementLabel = MOVEMENT_LABEL;
  protected readonly pageSizes = [10, 20, 50];

  protected readonly account = signal<Account | null>(null);
  protected readonly data = signal<Page<Movement> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly size = signal(20);

  constructor() {
    // Corre ao abrir e sempre que :numero mudar (o componente é reutilizado pelo router).
    effect(() => {
      const numero = this.numero();
      untracked(() => this.init(numero));
    });
  }

  protected isDebit(m: Movement): boolean {
    return m.type === 'TRANSFERENCIA_ENVIADA';
  }

  protected firstItem(d: Page<Movement>): number {
    return d.totalElements === 0 ? 0 : d.page * d.size + 1;
  }

  protected lastItem(d: Page<Movement>): number {
    return d.page * d.size + d.content.length;
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.loadPage();
  }

  protected changeSize(value: string): void {
    this.size.set(Number(value));
    this.page.set(0);
    this.loadPage();
  }

  protected print(): void {
    window.print();
  }

  /** Descarrega os movimentos da página actual em CSV (separador ';', abre bem no Excel PT). */
  protected exportCsv(): void {
    const d = this.data();
    const acc = this.account();
    if (!d || !acc) {
      return;
    }
    const header = [
      'Data e hora',
      'Operação',
      'Descrição',
      'Contraparte',
      'Valor (MZN)',
      'Saldo resultante (MZN)',
    ];
    const rows = d.content.map((m) => [
      formatDate(m.dateTime, 'dd/MM/yyyy HH:mm:ss', 'pt-PT'),
      MOVEMENT_LABEL[m.type],
      this.safeCell(m.description),
      m.counterpartAccountNumber ?? '',
      `${this.isDebit(m) ? '-' : ''}${m.amount.toFixed(2).replace('.', ',')}`,
      m.balanceAfter.toFixed(2).replace('.', ','),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    // "\ufeff" (BOM) faz o Excel reconhecer os acentos (UTF-8).
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracto-${acc.accountNumber}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Evita "injecção de fórmulas": o Excel executa células que comecem por = + - @. */
  private safeCell(value: string | null): string {
    const text = value ?? '';
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  }

  private init(numero: string | undefined): void {
    this.account.set(null);
    this.data.set(null);
    this.error.set(null);
    this.page.set(0);
    this.loading.set(true);

    const account$ = numero ? this.api.getAccount(numero) : this.api.getMyAccount();
    account$.subscribe({
      next: (acc) => {
        this.account.set(acc);
        this.loadPage();
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private loadPage(): void {
    const acc = this.account();
    if (!acc) {
      return;
    }
    this.loading.set(true);
    this.api.getStatement(acc.accountNumber, this.page(), this.size()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.error.set(errorMessage(err));
    this.loading.set(false);
  }
}
