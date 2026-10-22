import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Devolve a mensagem do primeiro erro do campo, mas só depois de o utilizador
 * o ter tocado (evita mostrar erros num formulário ainda vazio).
 */
export function fieldError(
  control: AbstractControl | null,
  messages: Record<string, string>,
): string | null {
  if (!control || !control.invalid || !(control.touched || control.dirty)) {
    return null;
  }
  const key = Object.keys(control.errors ?? {}).find((k) => k in messages);
  return key ? messages[key] : 'Valor inválido.';
}

/** Valida no máximo 2 casas decimais (a API recusa mais do que isso). */
export function maxTwoDecimals(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const cents = Number(value) * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6 ? null : { decimals: true };
}
