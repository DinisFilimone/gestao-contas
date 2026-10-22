export type Role = 'ADMIN' | 'CLIENTE';
export type AccountType = 'ORDEM' | 'POUPANCA';
export type MovementType = 'ABERTURA' | 'TRANSFERENCIA_ENVIADA' | 'TRANSFERENCIA_RECEBIDA';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  username: string;
  role: Role;
}

export interface Account {
  id: number;
  accountNumber: string;
  customerName: string;
  nuit: string;
  accountType: AccountType;
  balance: number;
  createdAt: string;
}

export interface Balance {
  accountNumber: string;
  balance: number;
  consultedAt: string;
}

export interface Movement {
  dateTime: string;
  type: MovementType;
  amount: number;
  balanceAfter: number;
  description: string;
  counterpartAccountNumber: string | null;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateAccountRequest {
  customerName: string;
  nuit: string;
  accountNumber: string;
  accountType: AccountType;
  initialBalance: number;
  username: string;
  password: string;
}

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  description?: string;
}

export interface TransferResponse {
  reference: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  description: string;
  dateTime: string;
  sourceBalanceAfter: number;
}

/** Formato único de erro devolvido pela API. */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  CLIENTE: 'Cliente',
};

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  ORDEM: 'Ordem',
  POUPANCA: 'Poupança',
};

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  ABERTURA: 'Abertura de conta',
  TRANSFERENCIA_ENVIADA: 'Transferência enviada',
  TRANSFERENCIA_RECEBIDA: 'Transferência recebida',
};
