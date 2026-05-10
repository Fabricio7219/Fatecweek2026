# FatecWeek — API Backend

API REST do sistema de gerenciamento de eventos da FatecWeek Osasco.  
Desenvolvida com **ASP.NET Core 8**, **Entity Framework Core 8** e **SQL Server**.

---

## Visão geral

A API gerencia eventos, alunos, check-ins de presença e pontuação automática.  
O fluxo principal é:

1. Aluno chega ao evento → mesário registra **entrada** (`POST /api/checkins/entrada`)
2. Aluno sai → mesário registra **saída** (`PATCH /api/checkins/{id}/saida`)
3. O sistema calcula automaticamente o tempo de permanência e concede pontos se o mínimo exigido foi cumprido

---

## Pré-requisitos

- .NET 8 SDK
- SQL Server (local ou remoto) — instância completa ou Express
- (Opcional) SQL Server Management Studio ou Azure Data Studio

---

## Configuração

Edite `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FatecWeekDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "TROQUE_ESTA_CHAVE_POR_UMA_SEGURA_COM_32_CHARS_MINIMO",
    "Issuer": "FatecWeekAPI",
    "Audience": "FatecWeekFrontend",
    "ExpiresInHours": 12
  },
  "AdminEmail": "admin@fatecweek.local",
  "AdminSenha": "Admin@2026"
}
```

> **Atenção:** Troque `Jwt:Key` por uma string aleatória com no mínimo 32 caracteres antes de ir para produção.

Se o SQL Server usar instância nomeada (ex: SQLEXPRESS):

```
Server=localhost\SQLEXPRESS;Database=FatecWeekDB;Trusted_Connection=True;TrustServerCertificate=True;
```

---

## Banco de dados

Execute o script `banco.sql` no SQL Server Management Studio para criar todas as tabelas:

```
Arquivo: banco.sql
```

Alternativamente, o `EnsureCreated()` no `Program.cs` cria as tabelas automaticamente na primeira execução, mas o script SQL é recomendado para ambientes de produção.

---

## Executar

```bash
dotnet run
```

A API sobe em: **http://localhost:5000**  
Swagger UI disponível em: **http://localhost:5000/swagger**

Na primeira execução, o admin padrão é criado automaticamente:

| Campo | Valor |
|-------|-------|
| Email | `admin@fatecweek.local` |
| Senha | `Admin@2026` |

---

## Estrutura de pastas

```
FatecWeek-API/
├── Controllers/
│   ├── AuthController.cs        # POST /api/auth/login
│   ├── UsuariosController.cs    # CRUD de usuários (admin/mesário)
│   ├── EventosController.cs     # CRUD de eventos
│   ├── EstandesController.cs    # CRUD de estandes
│   ├── AlunosController.cs      # CRUD de alunos + busca por RA
│   ├── CheckinsController.cs    # Check-in de entrada/saída + pontuação automática
│   └── PontuacoesController.cs  # Consulta de pontos e ranking
├── Data/
│   └── AppDbContext.cs          # DbContext com todos os DbSets e constraints
├── Models/
│   ├── Usuario.cs
│   ├── Aluno.cs
│   ├── Evento.cs
│   ├── Estande.cs
│   ├── AlunoEstande.cs
│   ├── Checkin.cs
│   └── Pontuacao.cs
├── Services/
│   └── JwtService.cs            # Geração de token JWT com claims de permissão
├── Program.cs                   # Pipeline, DI, CORS, seed do admin
├── appsettings.json
└── banco.sql                    # Script SQL para criar o banco
```

---

## Endpoints da API

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/login` | Login — retorna JWT | ❌ |

**Body:**
```json
{ "email": "admin@fatecweek.local", "password": "Admin@2026" }
```

**Resposta:**
```json
{ "accessToken": "...", "role": "admin", "nome": "Administrador" }
```

---

### Usuários (mesários)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/usuarios?role=mesario` | Lista usuários (filtro por role) |
| `POST` | `/api/usuarios` | Cria mesário ou admin |
| `DELETE` | `/api/usuarios/{id}` | Remove usuário (não permite remover admin) |

**Body POST:**
```json
{
  "nome": "João Silva",
  "email": "joao@fatec.sp.gov.br",
  "userName": "joaosilva",
  "password": "Senha@123",
  "cpf": "000.000.000-00",
  "role": "mesario"
}
```

---

### Eventos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/eventos` | Lista todos os eventos |
| `GET` | `/api/eventos/{id}` | Obtém evento por ID |
| `POST` | `/api/eventos` | Cria evento |
| `PUT` | `/api/eventos/{id}` | Atualiza evento |
| `DELETE` | `/api/eventos/{id}` | Remove evento |

**Body POST/PUT:**
```json
{
  "nomeEvento": "Palestra de IA",
  "tipo": "palestra",
  "data": "2026-05-20",
  "horaInicio": "09:00",
  "horaFim": "11:00",
  "pontuacao": 2.0,
  "tempoMinimoMinutos": 60
}
```

> `tipo`: `"palestra"` ou `"feira"`  
> `tempoMinimoMinutos`: tempo mínimo de permanência para pontuar (0 = sem mínimo)

---

### Estandes

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/estandes?eventoId=1` | Lista estandes (filtro por evento) |
| `GET` | `/api/estandes/{id}` | Obtém estande por ID |
| `POST` | `/api/estandes` | Cria estande |
| `PUT` | `/api/estandes/{id}` | Atualiza estande |
| `DELETE` | `/api/estandes/{id}` | Remove estande |

---

### Alunos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/alunos?ra=001001001001` | Lista alunos (filtro por RA) |
| `GET` | `/api/alunos/{id}` | Obtém aluno por ID |
| `GET` | `/api/alunos/por-ra/{ra}` | Busca aluno pelo RA (usado pelo mesário) |
| `POST` | `/api/alunos` | Cadastra aluno |
| `PUT` | `/api/alunos/{id}` | Atualiza aluno |

**Body POST/PUT:**
```json
{
  "ra": "0010010010001",
  "nomeCompleto": "Maria Souza",
  "curso": "Análise e Desenvolvimento de Sistemas",
  "email": "maria@fatec.sp.gov.br",
  "fotoReferencia": "<base64>"
}
```

---

### Check-ins

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/checkins?eventoId=1&alunoId=2` | Lista check-ins |
| `POST` | `/api/checkins/entrada` | Registra entrada do aluno |
| `PATCH` | `/api/checkins/{id}/saida` | Registra saída + calcula pontuação |
| `GET` | `/api/checkins/relatorio/{eventoId}` | Relatório de presença de um evento |

**Body POST entrada:**
```json
{
  "alunoId": 1,
  "eventoId": 2,
  "tipoParticipacao": "visitante",
  "latitude": -23.5337,
  "longitude": -46.6545,
  "faceValidado": false,
  "fotoCheckin": "<base64 opcional>"
}
```

> `tipoParticipacao`: `"visitante"` ou `"expositor"`

**Resposta PATCH saída (com pontuação automática):**
```json
{
  "pontuou": true,
  "pontuacaoObtida": 2.0,
  "tempoPermancecidoMinutos": 75,
  "tempoMinimoExigido": 60,
  "mensagem": "Pontuação concedida! Aluno permaneceu 75 minutos (mínimo: 60)."
}
```

---

### Pontuações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/pontuacoes/aluno/{ra}` | Pontos acumulados de um aluno por RA |
| `GET` | `/api/pontuacoes/ranking?eventoId=1` | Ranking geral ou por evento |
| `GET` | `/api/pontuacoes/evento/{eventoId}` | Alunos que pontuaram em um evento |

**Resposta GET aluno/{ra}:**
```json
{
  "ra": "0010010010001",
  "nome": "Maria Souza",
  "curso": "ADS",
  "totalPontos": 5.5,
  "eventos": [
    { "eventoId": 1, "nomeEvento": "Palestra de IA", "tipo": "palestra", "data": "2026-05-20", "pontuacaoObtida": 2.0 }
  ]
}
```

---

## Lógica de pontuação automática

Ao registrar a saída (`PATCH /api/checkins/{id}/saida`):

1. Calcula `tempoMinutos = horarioSaida - horarioEntrada`
2. Compara com `evento.TempoMinimoMinutos`
3. Se `tempoMinutos >= tempoMinimoMinutos` → cria/atualiza registro em `pontuacoes` com o valor definido no evento
4. Se `tempoMinimoMinutos = 0` → pontuação sempre concedida

---

## Autenticação e autorização

Todos os endpoints (exceto `/api/auth/login`) exigem `Authorization: Bearer <token>`.

O JWT contém o claim `permission` (array) com os valores:

| Role | Permissões no token |
|------|---------------------|
| `admin` | `Events:Manage`, `Exhibitors:Manage`, `Lectures:Manage`, `Booths:Manage` |
| `mesario` | `CheckIn:Register` |

---

## CORS

A API aceita requisições dos seguintes origens:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`

Para produção, adicione a URL do frontend em `Program.cs` no `WithOrigins(...)`.

---

## Banco de dados — Modelo

```
usuarios        → id, nome, email, user_name, senha_hash, cpf, role, created_at
alunos          → id, ra (único), nome_completo, curso, email, foto_referencia, created_at
eventos         → id, nome_evento, tipo, data, hora_inicio, hora_fim, pontuacao, tempo_minimo_minutos, created_at
estandes        → id, nome_estande, tema, descricao, localizacao, evento_id, created_at
checkins        → id, aluno_id, evento_id, horario_entrada, horario_saida, latitude, longitude,
                  face_validado, foto_checkin, tipo_participacao, created_at
                  (UNIQUE: aluno_id + evento_id)
pontuacoes      → id, aluno_id, evento_id, pontuacao_obtida
                  (UNIQUE: aluno_id + evento_id)
alunos_estandes → aluno_id, estande_id (tabela de junção)
```
