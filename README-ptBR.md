# 🏦 Woovi Challenger - ISO8583

[🇺🇸 Read this README in English](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/README.md)

---

## ☁️ Live demo
- **Produção (WEB):** https://iso8583.hallancosta.com (ON) 🟢
- **Produção (API ACQUIRER):** https://iso8583-acquirer-server.hallancosta.com (ON) 🟢
- **Produção (API ISSUER):** https://iso8583-issuer-server.hallancosta.com (ON) 🟢

## 📸 Pré-visualização
<img src="https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/web/screenshots/screen.png?raw=true">

Simulador de transações ISO 8583 com um Acquirer conectado a um Issuer.

Processando fluxos Pix e Cartão via ISO8583:<br>
- Prefixo 3907 → código de processamento `900000` (fluxo Pix)<br>
- Prefixo 5162 → código de processamento `000000` (fluxo Cartão)<br>
- Prefixo 4026 → código de processamento `000000` (fluxo Cartão)<br>

### Por que 000000 e 900000?
`000000` continua como código padrão de compra para bandeiras regulares; `900000` sinaliza Pix. Essa separação permite rotear cartão vs. Pix sem inventar MTIs ou alterar o mapeamento ISO.

## 🪢 Fluxo de Autorização + Captura (Acquirer ↔ Brand ↔ Issuer)
*Exemplos de bandeira: Mastercard, Visa, Elo — roteados pelo prefixo do PAN para o issuer/simulador correto.*
```
Card Authorization
┌───────────┐        ┌────────────┐        ┌───────────┐
│ Acquirer  │ -----> │   Brand    │ -----> │  Issuer   │
│           │ 0100   │ (Visa/Mc)  │ 0100   │           │
└───────────┘        └────────────┘        └───────────┘
       ▲                      │                     │
       │                      │                     └──(0110 Auth Response)
       │                      │                             Approved / Declined
       │                      ▼
       │               (0110 Auth Response)
       │
       └────────────── Authorization Result ──────────────┘


     (Minutos, segundos ou até dias depois — depende da operação)


Card Transaction
┌───────────┐        ┌────────────┐        ┌───────────┐
│ Acquirer  │ -----> │   Brand    │ -----> │  Issuer   │
│           │ 0200   │ (Visa/Mc)  │ 0200   │           │
└───────────┘        └────────────┘        └───────────┘
       ▲                      │                     │
       │                      │                     │
       │                      │        ┌──────────────────────────┐
       │                      │        │   TigerBeetle Ledger      │
       │                      │        │  (Débito / Crédito)       │
       │                      │        └──────────────────────────┘
       │                      │                     │
       │                      │                     └──(0220 Financial Response)
       │                      │                             Approved / Error
       │                      ▼
       │               (0220 Financial Response)
       │
       └────────── Clearing & Settlement (Brand) ──────────┘
```

## 🛠️ Tecnologias

### Frontend
- **React 19** - UI componentizada
- **Vite** - build rápido
- **TypeScript 5.9** - tipagem estática
- **React Hook Form** - formulários performáticos
- **Zod v4** - validação de schemas
- **Tailwind CSS v4** - utilitários de estilo
- **Shadcn UI / Radix UI** - componentes acessíveis
- **Lucide React** - ícones

### Server
- **Node.js**
- **Koa.js** - servidor HTTP
- **TigerBeetle** - ledger de alta performance

### Simulador ISO 8583
- **Python**

## Teste no Postman
- [Baixar coleção Postman v2.0](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/docs/api.postman_collection.json)

## 🚀 Como rodar

### Pré-requisitos
- **Node.js** (recomendado 22, mínimo 18)
  ```sh
  https://nodejs.org/en/download/
  ```

- **PNPM**
  ```sh
  npm install pnpm -g
  ```

- **Docker** (opcional, simulador)
  ```sh
  https://docs.docker.com/get-docker/
  ```

### Instalar e subir

- **Clonar o projeto**
  ```sh
  git clone https://github.com/HallanCosta/woovi-challanger-iso8583.git
  cd woovi-challanger-iso8583
  ```

- **Iniciar Docker (simulador + TB)**
  ```sh
  docker compose -f docker-compose.yml up
  ```

- **Iniciar Simulator - Deprecated**
  ```sh
  cd ISO8583-Simulator
  # Com docker
  docker compose -f docker-compose.yml up
  # Com python
  python3 start.py
  # TCP
  http://0.0.0.0:9218
  ```

- **Iniciar Acquirer Server**
  ```sh
  cd acquirer-server
  pnpm install
  pnpm dev

  # TCP
  http://localhost:9200
  # HTTP
  http://localhost:9100

  # Presets opcionais
  pnpm card:pix
  pnpm card:mastercard
  pnpm card:visa
  ```

- **Iniciar Brands Server**
  ```sh
  cd brands-server
  pnpm install
  pnpm dev

  # TCP
  http://localhost:9201
  # HTTP (health)
  http://localhost:9101
  ```

- **Iniciar Issuer Server**
  ```sh
  cd issuer-server
  pnpm install
  pnpm compose:up
  pnpm create:accounts
  pnpm dev

  # TCP
  http://localhost:9202
  # HTTP
  http://localhost:9102
  ```

- **Iniciar Web (frontend tester)**
  ```sh
  cd web
  pnpm install
  pnpm dev

  # Acesso
  http://localhost:4174
  ```

### Comandos úteis (issuer)
- `pnpm compose:up` — sobe o TigerBeetle (compose do issuer) em background.
- `pnpm compose:down` — derruba o TigerBeetle.
- `pnpm compose:restart` — reinicia o TigerBeetle.
- `pnpm create:accounts` — cria contas básicas se faltarem (não altera saldo).
- `pnpm seed:balances` — deixa saldos dos clientes em 10.000,00 (via clearing).
- `pnpm wipe` — para o TB, ajusta permissões, remove `issuer-server/tb-data/`, sobe TB e reaplica seeds.

## 😅 Desafios

- Tamanhos de campo binário vs. ASCII (BCD vs. ASCII)
- Bitmap precisa refletir exatamente os campos enviados
- Campos variáveis (LLVAR/LLLVAR) com length em ASCII ou BCD
- Prefixo de tamanho da mensagem (2 bytes, 4 bytes ou nenhum)
- Adaptar fluxos ISO para cenários modernos (ex.: Pix)

## 📂 Estrutura do Projeto

```sh
woovi-challanger-iso8583/
├── ISO8583-Simulator/
│   ├── start.py
│   └── ...
├── docs/                      # Coleções Postman (acquirer/issuer HTTP)
├── acquirer-server/
│   ├── src/
│   ├── package.json
│   └── ...
├── brands-server/
│   ├── src/
│   ├── package.json
│   └── ...
├── issuer-server/
│   ├── src/
│   ├── scripts/
│   ├── docker-compose.yml
│   ├── package.json
│   └── ...
│
├── web/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── package.json
├── README.md
└── pnpm-workspace.yaml
```

## 👨‍💻 Contribuidores

[<img width="115" height="115" src="https://github.com/HallanCosta.png"  /><br><sub>@HallanCosta</sub>](https://github.com/HallanCosta)

⭐ Se este projeto foi útil para você, considere deixar uma estrela no repositório!
