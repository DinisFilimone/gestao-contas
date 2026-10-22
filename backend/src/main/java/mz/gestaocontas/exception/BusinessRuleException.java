package mz.gestaocontas.exception;

/**
 * Violação de uma regra de negócio, por exemplo saldo insuficiente (HTTP 422).
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}