import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/error.util';
import { fieldError, maxTwoDecimals } from '../../core/form.util';
import { Account, TransferResponse } from '../../core/models';

function differentAccounts(group: AbstractControl): ValidationErrors | null {
  const from = group.get('fromAccount')?.value;
  const to = group.get('toAccount')?.value;
  return from && to && from === to ? { sameAccount: true } : null;
}

type Step = 'form' | 'review' | 'done';

/**
 * Transferência em 3 passos: preencher, rever e confirmar, comprovativo.
 * Só o CLIENTE transfere, e sempre da sua própria conta (a origem vem de /accounts/me).
 */
@Component({
  selector: 'app-transfer',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Transferência</h1>
        <p class="muted">Transfira dinheiro da sua conta para outra conta de forma segura.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="skeleton skeleton-card" aria-hidden="true"></div>
      <span class="sr-only">A carregar…</span>
    } @else {
      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      <ol class="steps no-print" aria-label="Passos da transferência">
        <li [class.current]="step() === 'form'" [class.done]="step() !== 'form'">
          <span>1</span> Dados
        </li>
        <li [class.current]="step() === 'review'" [class.done]="step() === 'done'">
          <span>2</span> Confirmar
        </li>
        <li [class.current]="step() === 'done'"><span>3</span> Comprovativo</li>
      </ol>

      @switch (step()) {
        @case ('form') {
          <form class="card" [formGroup]="form" (ngSubmit)="goToReview()" novalidate>
            <div class="field">
              <label for="fromAccount">Conta de origem</label>
              <input id="fromAccount" type="text" formControlName="fromAccount" />
              @if (source(); as s) {
                <small class="muted">
                  Saldo disponível: {{ s.balance | number: '1.2-2' }} MZN
                </small>
              }
            </div>

            <div class="field">
              <label for="toAccount">Conta de destino</label>
              <input
                id="toAccount"
                type="text"
                inputmode="numeric"
                maxlength="20"
                placeholder="Número da conta de destino"
                formControlName="toAccount"
              />
              @if (err('toAccount'); as m) {
                <small class="field-error">{{ m }}</small>
              } @else if (form.errors?.['sameAccount'] && form.controls.toAccount.touched) {
                <small class="field-error">
                  A conta de destino deve ser diferente da de origem.
                </small>
              }
            </div>

            <div class="field">
              <label for="amount">Valor (MZN)</label>
              <input id="amount" type="number" step="0.01" min="0.01" formControlName="amount" />
              @if (err('amount'); as m) {
                <small class="field-error">{{ m }}</small>
              } @else if (insufficient()) {
                <small class="field-error">Saldo insuficiente na conta de origem.</small>
              }
            </div>

            <div class="field">
              <label for="description">Descrição (opcional)</label>
              <input id="description" type="text" maxlength="255" formControlName="description" />
              @if (err('description'); as m) {
                <small class="field-error">{{ m }}</small>
              }
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="insufficient()">
                Rever transferência
              </button>
            </div>
          </form>
        }

        @case ('review') {
          <section class="card">
            <h2>Confirme os dados</h2>
            <dl class="details">
              <div>
                <dt>Origem</dt>
                <dd class="mono">{{ values().fromAccount }}</dd>
              </div>
              <div>
                <dt>Destino</dt>
                <dd class="mono">{{ values().toAccount }}</dd>
              </div>
              <div>
                <dt>Valor</dt>
                <dd class="strong">{{ values().amount | number: '1.2-2' }} MZN</dd>
              </div>
              <div>
                <dt>Descrição</dt>
                <dd>{{ values().description || '—' }}</dd>
              </div>
            </dl>
            <p class="muted review-note">
              Confirme o número da conta de destino: a transferência é imediata.
            </p>
            <div class="form-actions">
              <button type="button" class="btn" (click)="back()" [disabled]="submitting()">
                Voltar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="confirm()"
                [disabled]="submitting()"
              >
                {{ submitting() ? 'A processar…' : 'Confirmar transferência' }}
              </button>
            </div>
          </section>
        }

        @case ('done') {
          @if (result(); as r) {
            <section class="card receipt">
              <div class="receipt-head" role="status">
                <span class="receipt-icon" aria-hidden="true">✓</span>
                <h2>Transferência efectuada</h2>
                <p class="receipt-amount">{{ r.amount | number: '1.2-2' }} <small>MZN</small></p>
              </div>
              <dl class="details">
                <div>
                  <dt>Referência</dt>
                  <dd class="mono">{{ r.reference }}</dd>
                </div>
                <div>
                  <dt>Data e hora</dt>
                  <dd>{{ r.dateTime | date: 'dd/MM/yyyy HH:mm:ss' }}</dd>
                </div>
                <div>
                  <dt>Origem</dt>
                  <dd class="mono">{{ r.fromAccount }}</dd>
                </div>
                <div>
                  <dt>Destino</dt>
                  <dd class="mono">{{ r.toAccount }}</dd>
                </div>
                <div>
                  <dt>Descrição</dt>
                  <dd>{{ r.description }}</dd>
                </div>
                <div>
                  <dt>Saldo da conta de origem</dt>
                  <dd>{{ r.sourceBalanceAfter | number: '1.2-2' }} MZN</dd>
                </div>
              </dl>
              <div class="form-actions no-print">
                <button type="button" class="btn" (click)="reset()">Nova transferência</button>
                <button type="button" class="btn" (click)="print()">Imprimir comprovativo</button>
                <a class="btn btn-primary" routerLink="/extracto">Ver extracto</a>
              </div>
            </section>
          }
        }
      }
    }
  `,
})
export class Transfer implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly form = new FormGroup(
    {
      fromAccount: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{6,20}$/)],
      }),
      toAccount: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{6,20}$/)],
      }),
      amount: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0.01),
        maxTwoDecimals,
      ]),
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(255)],
      }),
    },
    { validators: differentAccounts },
  );

  /** A conta do cliente autenticado (origem da transferência). */
  protected readonly source = signal<Account | null>(null);
  protected readonly step = signal<Step>('form');
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<TransferResponse | null>(null);
  protected readonly values = signal({ fromAccount: '', toAccount: '', amount: 0, description: '' });

  private readonly amountValue = toSignal(this.form.controls.amount.valueChanges, {
    initialValue: null,
  });

  /** Aviso antecipado; a API volta a validar o saldo de qualquer forma. */
  protected readonly insufficient = computed(() => {
    const s = this.source();
    const amount = this.amountValue();
    return !!s && amount !== null && amount > s.balance;
  });

  private readonly messages: Record<string, Record<string, string>> = {
    toAccount: {
      required: 'Indique a conta de destino.',
      pattern: 'A conta deve ter entre 6 e 20 dígitos.',
    },
    amount: {
      required: 'Indique o valor.',
      min: 'O valor deve ser positivo (mínimo 0,01).',
      decimals: 'No máximo 2 casas decimais.',
    },
    description: { maxlength: 'No máximo 255 caracteres.' },
  };

  ngOnInit(): void {
    this.api.getMyAccount().subscribe({
      next: (mine) => {
        this.source.set(mine);
        this.form.controls.fromAccount.setValue(mine.accountNumber);
        this.form.controls.fromAccount.disable();
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected err(name: string): string | null {
    return fieldError(this.form.get(name), this.messages[name] ?? {});
  }

  protected goToReview(): void {
    if (this.form.invalid || this.insufficient()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.values.set({
      fromAccount: v.fromAccount,
      toAccount: v.toAccount,
      amount: Number(v.amount),
      description: v.description.trim(),
    });
    this.error.set(null);
    this.step.set('review');
  }

  protected back(): void {
    this.error.set(null);
    this.step.set('form');
  }

  protected confirm(): void {
    const v = this.values();
    this.submitting.set(true);
    this.error.set(null);

    this.api
      .transfer({
        fromAccount: v.fromAccount,
        toAccount: v.toAccount,
        amount: v.amount,
        description: v.description || undefined,
      })
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.source.update((s) => (s ? { ...s, balance: res.sourceBalanceAfter } : s));
          this.submitting.set(false);
          this.step.set('done');
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.submitting.set(false);
        },
      });
  }

  protected reset(): void {
    const from = this.form.getRawValue().fromAccount;
    this.form.reset({ fromAccount: from, toAccount: '', amount: null, description: '' });
    this.result.set(null);
    this.error.set(null);
    this.step.set('form');
  }

  protected print(): void {
    window.print();
  }
}
