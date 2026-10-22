package mz.gestaocontas.controller;

import jakarta.validation.Valid;
import mz.gestaocontas.dto.TransferRequest;
import mz.gestaocontas.dto.TransferResponse;
import mz.gestaocontas.service.TransferService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    /** So o CLIENTE transfere, e apenas da sua propria conta (o ADMIN recebe 403). */
    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    @ResponseStatus(HttpStatus.CREATED)
    public TransferResponse transfer(@Valid @RequestBody TransferRequest request,
            Authentication authentication) {
        return transferService.transfer(request, authentication);
    }
}