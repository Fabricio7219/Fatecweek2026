-- ============================================================
-- FatecWeekDB — Script de criação do banco
-- Execute no SQL Server Management Studio ou Azure Data Studio
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FatecWeekDB')
    CREATE DATABASE FatecWeekDB;
GO

USE FatecWeekDB;
GO

-- ─── Tabela: usuarios ────────────────────────────────────────
CREATE TABLE usuarios (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    nome       VARCHAR(255) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    user_name  VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(MAX) NOT NULL,
    cpf        VARCHAR(14),
    role       VARCHAR(20)  NOT NULL DEFAULT 'mesario'
                CHECK (role IN ('admin', 'mesario')),
    created_at DATETIME DEFAULT GETDATE()
);

-- ─── Tabela: alunos ──────────────────────────────────────────
CREATE TABLE alunos (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    ra              VARCHAR(20)  NOT NULL UNIQUE,
    nome_completo   VARCHAR(255) NOT NULL,
    curso           VARCHAR(100),
    semestre        VARCHAR(10),
    turno           VARCHAR(20),
    email           VARCHAR(150),
    foto_referencia VARCHAR(MAX),
    created_at      DATETIME DEFAULT GETDATE()
);

-- ─── Tabela: eventos ─────────────────────────────────────────
CREATE TABLE eventos (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    nome_evento         VARCHAR(255)    NOT NULL,
    tipo                VARCHAR(50)     CHECK (tipo IN ('palestra', 'feira')),
    data                DATE            NOT NULL,
    hora_inicio         TIME            NOT NULL,
    hora_fim            TIME            NOT NULL,
    pontuacao           DECIMAL(3,1)   DEFAULT 0,
    -- Tempo mínimo em minutos que o aluno deve permanecer para receber pontuação
    tempo_minimo_minutos INT            DEFAULT 0,
    created_at          DATETIME        DEFAULT GETDATE()
);

-- ─── Tabela: estandes ────────────────────────────────────────
CREATE TABLE estandes (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    nome_estande VARCHAR(150) NOT NULL,
    tema         VARCHAR(255),
    descricao    VARCHAR(MAX),
    localizacao  VARCHAR(100),
    evento_id    INT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    created_at   DATETIME DEFAULT GETDATE()
);

-- ─── Tabela: aluno_estande ───────────────────────────────────
CREATE TABLE aluno_estande (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    aluno_id   INT NOT NULL REFERENCES alunos(id)   ON DELETE CASCADE,
    estande_id INT NOT NULL REFERENCES estandes(id) ON DELETE CASCADE
);

-- ─── Tabela: checkins ────────────────────────────────────────
CREATE TABLE checkins (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    aluno_id          INT NOT NULL REFERENCES alunos(id)  ON DELETE CASCADE,
    evento_id         INT NOT NULL REFERENCES eventos(id) ON DELETE NO ACTION,
    horario_entrada   DATETIME,
    horario_saida     DATETIME,
    latitude          DECIMAL(9,6),
    longitude         DECIMAL(9,6),
    face_validado     BIT DEFAULT 0,
    foto_checkin      VARCHAR(MAX),
    tipo_participacao VARCHAR(20) CHECK (tipo_participacao IN ('visitante', 'expositor')),
    created_at        DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_checkin_aluno_evento UNIQUE (aluno_id, evento_id)
);

-- ─── Tabela: pontuacoes ──────────────────────────────────────
CREATE TABLE pontuacoes (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    aluno_id         INT NOT NULL REFERENCES alunos(id)  ON DELETE CASCADE,
    evento_id        INT NOT NULL REFERENCES eventos(id) ON DELETE NO ACTION,
    pontuacao_obtida DECIMAL(3,1) NOT NULL DEFAULT 0
);
GO
