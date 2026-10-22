import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/error.util';
import { ACCOUNT_TYPE_LABEL, Account, AccountType } from '../../core/models';

/** Administrador: lista todas as contas, com pesquisa e acesso ao extracto. */
@Component({
  selector: 'app-accounts-list',
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Contas</h1>
        <p class="muted">Todas as contas registadas no sistema.</p>
      </div>
      <a class="btn btn-primary" routerLink="/nova-conta">Nova conta</a>
    </div>

    @if (error()) {
      <div class="alert alert-error" role="alert">
        {{ error() }}
        <button type="button" class="btn btn-ghost" (click)="load()">Tentar de novo</button>
      </div>
    }

    @if (loading()) {
      <div class="skeleton" aria-hidden="true"></div>
      <div class="skeleton" aria-hidden="true"></div>
      <div class="skeleton" aria-hidden="true"></div>
      <span class="sr-only">A carregar contas…</span>
    } @else if (!error()) {
      <div class="stats">
        <div class="card stat">
          <span class="muted">Contas</span>
          <strong>{{ accounts().length }}</strong>
        </div>
        <div class="card stat">
          <span class="muted">Saldo total</span>
          <strong>{{ totalBalance() | number: '1.2-2' }} MZN</strong>
        </div>
        <div class="card stat">
          <span class="muted">Contas à ordem</span>
          <strong>{{ ordemCount() }}</strong>
        </div>
        <div class="card stat">
          <span class="muted">Contas poupança</span>
          <strong>{{ poupancaCount() }}</strong>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="field search">
            <label for="filtro">Pesquisar</label>
            <input
              id="filtro"
              type="search"
              placeholder="Nome, número de conta ou NUIT"
              [value]="filter()"
              (input)="filter.set($any($event.target).value)"
            />
          </div>
          <div class="field">
            <label for="tipo">Tipo de conta</label>
            <select
              id="tipo"
              [value]="typeFilter()"
              (change)="typeFilter.set($any($event.target).value)"
            >
              <option value="">Todos</option>
              <option value="ORDEM">Ordem</option>
              <option value="POUPANCA">Poupança</option>
            </select>
          </div>
        </div>

        @if (filtered().length === 0) {
          <p class="empty">Nenhuma conta encontrada.</p>
        } @else {
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Nº da conta</th>
                  <th>Cliente</th>
                  <th>NUIT</th>
                  <th>Tipo</th>
                  <th class="num">Saldo (MZN)</th>
                  <th>Criada em</th>
                  <th><span class="sr-only">Acções</span></th>
                </tr>
              </thead>
              <tbody>
                @for (a of filtered(); track a.id) {
                  <tr>
                    <td class="mono">{{ a.accountNumber }}</td>
                    <td>{{ a.customerName }}</td>
                    <td class="mono">{{ a.nuit }}</td>
                    <td>
                      <span class="badge">{{ typeLabel[a.accountType] }}</span>
                    </td>
                    <td class="num">{{ a.balance | number: '1.2-2' }}</td>
                    <td>{{ a.createdAt | date: 'dd/MM/yyyy' }}</td>
                    <td class="actions">
                      <a [routerLink]="['/contas', a.accountNumber, 'extracto']">Extracto</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
})
export class AccountsList implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly typeLabel = ACCOUNT_TYPE_LABEL;
  protected readonly accounts = signal<Account[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal('');
  protected readonly typeFilter = signal<'' | AccountType>('');

  protected readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const type = this.typeFilter();
    return this.accounts().filter(
      (a) =>
        (!type || a.accountType === type) &&
        (!q ||
          a.accountNumber.includes(q) ||
          a.nuit.includes(q) ||
          a.customerName.toLowerCase().includes(q)),
    );
  });

  protected readonly ordemCount = computed(
    () => this.accounts().filter((a) => a.accountType === 'ORDEM').length,
  );
  protected readonly poupancaCount = computed(
    () => this.accounts().filter((a) => a.accountType === 'POUPANCA').length,
  );

  protected readonly totalBalance = computed(() =>
    this.accounts().reduce((sum, a) => sum + a.balance, 0),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listAccounts().subscribe({
      next: (list) => {
        this.accounts.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
