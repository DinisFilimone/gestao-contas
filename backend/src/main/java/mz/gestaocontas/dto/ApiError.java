package mz.gestaocontas.dto;

import java.time.OffsetDateTime;
import org.springframework.http.HttpStatus;

/** Formato unico de erro devolvido pela API. */
public record ApiError(OffsetDateTime timestamp, int status, String error, String message) {

    public static ApiError of(HttpStatus status, String message) {
        return new ApiError(OffsetDateTime.now(), status.value(), status.getReasonPhrase(), message);
    }
}
