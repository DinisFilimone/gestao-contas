import { FormControl } from '@angular/forms';
import { fieldError, maxTwoDecimals } from './form.util';

describe('maxTwoDecimals', () => {
  it('aceita valores com até 2 casas decimais', () => {
    expect(maxTwoDecimals(new FormControl(10))).toBeNull();
    expect(maxTwoDecimals(new FormControl(10.5))).toBeNull();
    expect(maxTwoDecimals(new FormControl(0.07))).toBeNull();
    expect(maxTwoDecimals(new FormControl(1234.56))).toBeNull();
  });

  it('recusa valores com mais de 2 casas decimais', () => {
    expect(maxTwoDecimals(new FormControl(10.005))).toEqual({ decimals: true });
    expect(maxTwoDecimals(new FormControl(0.001))).toEqual({ decimals: true });
  });

  it('ignora valores vazios (o required trata deles)', () => {
    expect(maxTwoDecimals(new FormControl(null))).toBeNull();
    expect(maxTwoDecimals(new FormControl(''))).toBeNull();
  });
});

describe('fieldError', () => {
  const messages = { required: 'Obrigatório.' };

  it('não mostra erro antes de o campo ser tocado', () => {
    const control = new FormControl('', { validators: (c) => (c.value ? null : { required: true }) });
    expect(fieldError(control, messages)).toBeNull();
  });

  it('mostra a mensagem depois de tocado', () => {
    const control = new FormControl('', { validators: (c) => (c.value ? null : { required: true }) });
    control.markAsTouched();
    expect(fieldError(control, messages)).toBe('Obrigatório.');
  });
});
