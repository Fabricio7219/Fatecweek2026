# FatecWeek — Frontend

Sistema de gerenciamento de eventos da FatecWeek Osasco.  
Desenvolvido com **React 19 + Vite**, consome a API REST em ASP.NET Core 8.

---

## Visão geral

O sistema possui dois perfis de acesso:

| Perfil | Acesso após login |
|--------|-------------------|
| **Admin** | Painel completo: Eventos, Expositores, Palestras, Estandes, Mesários, Relatório |
| **Mesário** | Somente a tela de Reconhecimento Facial (check-in de alunos) |

O redirecionamento é feito automaticamente com base nas permissões do token JWT.

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- Backend `FatecWeek-API` rodando (ver README da API)

---

## Instalação

```bash
# Na raiz do projeto (FatecWeek/)
npm install
```

---

## Configuração

Crie o arquivo `.env.local` na raiz do projeto:

```env
VITE_API_URL=http://localhost:5000
```

Se a API rodar em outra porta ou host, altere esse valor.  
Se o arquivo não existir, o frontend usa `http://localhost:5000` por padrão.

---

## Executar em desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:5173**

---

## Build para produção

```bash
npm run build
```

Os arquivos estáticos são gerados na pasta `dist/`.  
Use `npm run preview` para testar o build localmente.

---

## Estrutura de pastas

```
src/
├── api.js                  # Instância Axios com interceptor de token
├── App.jsx                 # Configuração de rotas
├── main.jsx                # Ponto de entrada React
├── components/
│   ├── Layout.jsx          # Header (nav adaptativo por perfil) + footer
│   └── ProtectedRoute.jsx  # Proteção de rotas por permissão JWT
├── pages/
│   ├── LoginPage.jsx       # Tela de login
│   ├── EventosPage.jsx     # CRUD de eventos
│   ├── ExpositoresPage.jsx # CRUD de expositores
│   ├── PalestrasPage.jsx   # CRUD de palestras
│   ├── EstandesPage.jsx    # CRUD de estandes
│   ├── MesariosPage.jsx    # CRUD de mesários (admin)
│   ├── FacialPage.jsx      # Check-in com câmera + digitação de RA
│   └── RelatorioPage.jsx   # Relatório de presenças e pontuações
├── services/
│   ├── authService.js      # Login / logout
│   ├── eventService.js     # Eventos
│   ├── exhibitorService.js # Expositores
│   ├── lectureService.js   # Palestras
│   ├── boothService.js     # Estandes
│   ├── facialService.js    # Check-in facial
│   ├── reportService.js    # Relatórios
│   └── userService.js      # Usuários / mesários
├── utils/
│   ├── raUtils.js          # Parsing e validação do RA (13 dígitos)
│   └── imageProcessor.js   # Conversão de imagem para Base64 (mínimo 100×100 px)
└── styles/
    └── style.css
```

---

## Autenticação

- O login envia `POST /api/auth/login` com `{ email, password }`.
- O token JWT retornado é salvo em `localStorage` na chave `@App:token`.
- Todas as requisições subsequentes enviam `Authorization: Bearer <token>` automaticamente via interceptor do Axios.
- O token contém o claim `permission` (array de strings) usado para controlar acesso a rotas e elementos de UI.

### Permissões por perfil

| Permissão | Perfil |
|-----------|--------|
| `Events:Manage` | Admin |
| `Exhibitors:Manage` | Admin |
| `Lectures:Manage` | Admin |
| `Booths:Manage` | Admin |
| `CheckIn:Register` | Mesário |

---

## Rotas do frontend

| Rota | Permissão exigida | Descrição |
|------|-------------------|-----------|
| `/` | — | Redireciona para `/login` |
| `/login` | — | Tela de login |
| `/eventos` | `Events:Manage` | Lista e gerencia eventos |
| `/expositores` | `Events:Manage` | Lista e gerencia expositores |
| `/palestras` | `Events:Manage` | Lista e gerencia palestras |
| `/estandes` | `Events:Manage` | Lista e gerencia estandes |
| `/mesarios` | `Events:Manage` | Cadastra e remove mesários |
| `/relatorio` | `Events:Manage` | Visualiza relatório de presenças |
| `/reconhecimento-facial` | `CheckIn:Register` | Check-in de alunos (mesário) |

---

## Credenciais padrão (admin)

> Criadas automaticamente pelo backend na primeira execução.

| Campo | Valor |
|-------|-------|
| Email | `admin@fatecweek.local` |
| Senha | `Admin@2026` |

Frontend:

```bash
npm install
npm run dev
```

## 3) Rotas que o frontend consome hoje

### Autenticacao

- `POST /connect/token`

### Eventos

- `GET /eventos`
- `GET /eventos/{id}`
- `POST /eventos`
- `PUT /eventos/{id}`
- `DELETE /eventos/{id}`

Obs.: ainda existe fallback legado em alguns services para rotas antigas (`/api/...`) quando necessario.

### Biometria e check-in

- `GET /alunos/ra/{ra}`
- `POST /checkins/entrada`
- `GET /checkins/ativo?alunoId={ra}&eventoId={id}`
- `PATCH /checkins/{id}/saida`

### Relatorio

- `GET /relatorio/academico?evento_id={id}`

### Estandes, expositores e palestras

Os services tentam primeiro endpoints em portugues e, se nao existirem, caem para endpoints legados em ingles.

- Estandes: `/estandes` -> fallback `/booths` -> fallback `/api/booths`
- Expositores: `/expositores` -> fallback `/exhibitors` -> fallback `/api/exhibitors`
- Palestras: `/palestras` -> fallback `/lectures` -> fallback `/api/lectures`

## 4) CORS no backend (obrigatorio em desenvolvimento)

Garanta que o backend aceite o frontend do Vite (exemplo comum):

- `http://localhost:5173`
- `http://localhost:5181` (ou outra porta que o Vite escolher)

No ASP.NET, habilite CORS para esses origins.

## 5) Checklist rapido de validacao

- Login retorna token e salva `@App:token`.
- Lista de eventos carrega.
- Tela facial registra entrada e saida com evento selecionado.
- Relatorio traz dados de `/relatorio/academico`.
- Estandes/palestras/expositores carregam no endpoint principal ou fallback.
