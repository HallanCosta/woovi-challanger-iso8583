# 🏦 Woovi Challenger - ISO8583

[🇧🇷 Leia este README em Português](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/README-ptBR.md)

---

## ☁️ Live demo
- **Production (WEB):** https://iso8583.hallancosta.com (ON) 🟢
- **Production (API ACQUIRER):** https://iso8583-acquirer-server.hallancosta.com (ON) 🟢
- **Production (API ISSUER):** https://iso8583-issuer-server.hallancosta.com (ON) 🟢

## 📸 Preview
<img src="https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/web/screenshots/screen.png?raw=true">

ISO 8583 transaction simulator with an Acquirer connecting to an Issuer.

Processing Pix and Card flows via ISO8583:<br>
- Prefix 3907 → processing code `900000` (Pix flow)<br>
- Prefix 5162 → processing code `000000` (Card flow)<br>
- Prefix 4026 → processing code `000000` (Card flow)<br>

### Why 000000 and 900000?
`000000` stays as the standard purchase code for regular brands; `900000` flags Pix. This split routes card vs. Pix without inventing MTIs or changing ISO field mappings.

## 🪢 Authorization + Capture Flow (Acquirer ↔ Brand ↔ Issuer)
*Brand examples: Mastercard, Visa, Elo — routed by PAN prefix to the correct issuer/simulator.*
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


     (Minutes, seconds, or even days later — depends on the operation)


Card Transaction
┌───────────┐        ┌────────────┐        ┌───────────┐
│ Acquirer  │ -----> │   Brand    │ -----> │  Issuer   │
│           │ 0200   │ (Visa/Mc)  │ 0200   │           │
└───────────┘        └────────────┘        └───────────┘
       ▲                      │                     │
       │                      │                     │
       │                      │        ┌──────────────────────────┐
       │                      │        │   TigerBeetle Ledger      │
       │                      │        │  (Debit / Credit Commit)  │
       │                      │        └──────────────────────────┘
       │                      │                     │
       │                      │                     └──(0220 Financial Response)
       │                      │                             Approved / Error
       │                      ▼
       │               (0220 Financial Response)
       │
       └────────── Clearing & Settlement (Brand) ──────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - component-driven UI
- **Vite** - fast dev/build tool
- **TypeScript 5.9** - static typing
- **React Hook Form** - performant forms
- **Zod v4** - schema validation
- **Tailwind CSS v4** - utility-first styling
- **Shadcn UI / Radix UI** - accessible UI primitives
- **Lucide React** - icon set

### Server
- **Node.js**
- **Koa.js** - HTTP server
- **TigerBeetle** - high-performance ledger

### ISO 8583 Simulator
- **Python**

## Test in Postman
- [Download Postman Collection v2.0](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/docs/api.postman_collection.json)

## 🚀 Getting Started

### Prerequisites
- **Node.js** (22 recommended, 18+ minimum)
  ```sh
  https://nodejs.org/en/download/
  ```

- **PNPM**
  ```sh
  npm install pnpm -g
  ```

- **Docker** (optional, for simulator)
  ```sh
  https://docs.docker.com/get-docker/
  ```

### Install & Run

- **Clone the project**
  ```sh
  git clone https://github.com/HallanCosta/woovi-challanger-iso8583.git
  cd woovi-challanger-iso8583
  ```

- **Start Simulator - Deprecated**
  ```sh
  cd ISO8583-Simulator

  # Start with docker
  docker compose -f docker-compose.yml up

  # Start with python
  python3 start.py

  # TCP
  http://0.0.0.0:9218
  ```

- **Start Acquirer Server**
  ```sh
  cd acquirer-server
  pnpm install
  pnpm dev

  # TCP
  http://localhost:9200

  # HTTP
  http://localhost:9100

  # Optional presets
  pnpm card:pix
  pnpm card:mastercard
  pnpm card:visa
  ```

- **Start Brands Server**
  ```sh
  cd brands-server
  pnpm install
  pnpm dev

  # TCP
  http://localhost:9201
  # HTTP (health)
  http://localhost:9101
  ```

- **Start Issuer Server**
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


  ### others commands (issuer)
  pnpm compose:up — start TigerBeetle (issuer compose) in background.
  pnpm compose:down — stop TigerBeetle.
  pnpm compose:restart — restart TigerBeetle.
  pnpm create:accounts — create base accounts if missing (does not touch balances).
  pnpm seed:balances — set customer balances to 10,000.00 (moves via clearing).
  pnpm wipe — stop TB, fix ledger permissions, delete `issuer-server/tb-data/`, start TB, re-seed (full reset).

### Wipe Ledger
Reset all accounts and balances via HTTP.

```bash
curl -X POST http://localhost:9102/wipe -H "Content-Type: application/json" -d '{"password": "hallan123"}'
```
  ```

- **Start Web (tester frontend)**
  ```sh
  cd web
  pnpm install
  pnpm dev

  # Access
  http://localhost:4174
  ```



## 😅 Challenges

- Binary vs ASCII field sizes (BCD vs ASCII)
- Bitmap must match the exact field sequence sent to the simulator
- Variable-length fields (LLVAR/LLLVAR) with ASCII or BCD lengths
- Message length prefixes (2 bytes, 4 bytes, or none)
- Adapting ISO flows to modern cases (e.g., Pix)
- Create custom lib iso8583 to NodeJS

## 📂 Project Structure

```sh
woovi-challanger-iso8583/
├── ISO8583-Simulator/
│   ├── start.py
│   └── ...
├── docs/                      # Postman collections (acquirer/issuer HTTP)
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
├── lib/
│   ├── iso8583/
├── package.json
├── README.md
└── pnpm-workspace.yaml
```

## 👨‍💻 Contributors

[<img width="115" height="115" src="https://github.com/HallanCosta.png"  /><br><sub>@HallanCosta</sub>](https://github.com/HallanCosta)

⭐ If this project helped you, please consider starring the repo!
