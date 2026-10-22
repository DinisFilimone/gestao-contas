package mz.gestaocontas.exception;

/** Conflito com o estado actual, por exemplo valor duplicado (HTTP 409). */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
