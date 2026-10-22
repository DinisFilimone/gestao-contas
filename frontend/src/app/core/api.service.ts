import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';
import {
  Account,
  Balance,
  CreateAccountRequest,
  Movement,
  Page,
  TransferRequest,
  TransferResponse,
} from './models';

/** Acesso à API REST de contas e transferências. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  listAccounts() {
    return this.http.get<Account[]>(`${API_URL}/accounts`);
  }

  createAccount(body: CreateAccountRequest) {
    return this.http.post<Account>(`${API_URL}/accounts`, body);
  }

  getMyAccount() {
    return this.http.get<Account>(`${API_URL}/accounts/me`);
  }

  getAccount(accountNumber: string) {
    return this.http.get<Account>(`${API_URL}/accounts/${encodeURIComponent(accountNumber)}`);
  }

  getBalance(accountNumber: string) {
    return this.http.get<Balance>(
      `${API_URL}/accounts/${encodeURIComponent(accountNumber)}/balance`,
    );
  }

  getStatement(accountNumber: string, page: number, size: number) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Movement>>(
      `${API_URL}/accounts/${encodeURIComponent(accountNumber)}/statement`,
      { params },
    );
  }

  transfer(body: TransferRequest) {
    return this.http.post<TransferResponse>(`${API_URL}/transfers`, body);
  }
}
