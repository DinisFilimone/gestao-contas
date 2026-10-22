import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './error.util';

describe('errorMessage', () => {
  it('usa a mensagem enviada pela API', () => {
    const err = new HttpErrorResponse({
      status: 422,
      error: { status: 422, message: 'Saldo insuficiente na conta de origem' },
    });
    expect(errorMessage(err)).toBe('Saldo insuficiente na conta de origem');
  });

  it('explica quando a API está inacessível (status 0)', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('contactar o servidor');
  });

  it('traduz 403 sem corpo', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 403 }))).toContain('permissão');
  });

  it('trata erros que não são HTTP', () => {
    expect(errorMessage(new Error('x'))).toBe('Ocorreu um erro inesperado.');
  });
});
