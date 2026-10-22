-- Utilizadores (login JWT) com perfil ADMIN ou CLIENTE
CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN', 'CLIENTE')),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contas bancarias: numero unico, saldo nunca negativo, 1 conta por cliente
CREATE TABLE accounts (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_number VARCHAR(20)  NOT NULL UNIQUE,
    customer_name  VARCHAR(120) NOT NULL,
    nuit           VARCHAR(9)   NOT NULL,
    account_type   VARCHAR(20)  NOT NULL CHECK (account_type IN ('ORDEM', 'POUPANCA')),
    balance        NUMERIC(19, 2) NOT NULL CHECK (balance >= 0),
    owner_id       BIGINT       NOT NULL UNIQUE REFERENCES users (id),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Movimentos (extracto): cada operacao fica registada com data/hora e saldo resultante
CREATE TABLE movements (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id                  BIGINT       NOT NULL REFERENCES accounts (id),
    type                        VARCHAR(30)  NOT NULL
        CHECK (type IN ('ABERTURA', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECEBIDA')),
    amount                      NUMERIC(19, 2) NOT NULL CHECK (amount >= 0),
    balance_after               NUMERIC(19, 2) NOT NULL CHECK (balance_after >= 0),
    description                 VARCHAR(255),
    counterpart_account_number  VARCHAR(20),
    transfer_reference          VARCHAR(36),
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movements_account_date ON movements (account_id, created_at DESC);
