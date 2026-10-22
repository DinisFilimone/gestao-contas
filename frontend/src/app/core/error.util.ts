import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

/** Converte qualquer erro HTTP numa mensagem legível para o utilizador. */
export function errorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'Ocorreu um erro inesperado.';
  }
  if (err.status === 0) {
    return 'Não foi possível contactar o servidor. Verifique se a API está a correr em http://localhost:8080.';
  }
  const apiMessage = (err.error as Partial<ApiError> | null)?.message;
  if (apiMessage) {
    return apiMessage;
  }
  switch (err.status) {
    case 401:
      return 'A sessão expirou ou não está autenticado.';
    case 403:
      return 'Não tem permissão para esta operação.';
    case 404:
      return 'Recurso não encontrado.';
    default:
      return `Ocorreu um erro inesperado (${err.status}).`;
  }
}
