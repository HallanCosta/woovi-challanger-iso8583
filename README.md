# 🏦 Woovi Challanger - ISO8583

[🇧🇷 Leia esse README em Português](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/README-ptBR.md)

<hr>

ISO 8583 transaction simulator with Acquirer that connects to an Issuer.

Processing Pix and Card transactions using ISO8583:<br>
- Cards with prefix 3907 are cards that emit the processing code (900000) for the transaction to be done with PIX.<br>
- Cards with prefix 5162 are cards that emit the processing code (000000) for the transaction to be done with Card.<br>
- Cards with prefix 4026 are cards that emit the processing code (000000) for the transaction to be done with Card.<br>

NOTE: Frontend only tests transactions with prefix 3907 simulating a PIX flag, but it's possible to test other flags by activating the feature flag in the frontend

## 🪢 Authorization + Capture flow (Acquirer ↔ Issuer)
```
┌───────────┐                                 ┌───────────┐
│ Acquirer  │ --(0100 Authorization Request)-> │  Issuer   │
└───────────┘                                 └───────────┘
                    ↑                      │
                    │                      └--(0210 Authorization Response)──┐
                    │                                                         │
                    └─────────────────────────────── Approved ───────────────┘


        (Minutes, seconds, or even days later — depends on the operation)


┌───────────┐                                 ┌───────────┐
│ Acquirer  │ --(0200 Financial/Capture Req)->│  Issuer   │
└───────────┘                                 └───────────┘
                    ↑                      │
                    │                      └─(0210/0220/0230 Financial Resp)─┐
                    │                                                         │
                    └────────────────────────── Settlement/Clearing ──────────┘
```

## ☁️ Live Demo
- **Production (Web Tester):** https://iso8583.hallancosta.com (ON) 🟢
- **Production (Server):** https://server-iso8583.hallancosta.com (ON) 🟢

## 📸 Preview
<img src="https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/web/screenshots/transaction-approved.png?raw=true">

## 🛠️ Technologies Used

### Frontend
- **React 19** - Framework for building componentized interfaces
- **Vite** - Modern and extremely fast build tool for development
- **TypeScript 5.9** - JavaScript superset with static typing
- **React Hook Form** - Performant form state management
- **Zod v4** - Schema validation for data validation (CPF, RG, etc)
- **@hookform/resolvers** - Integration between React Hook Form and Zod
- **Tailwind CSS v4** - Utility-first CSS framework for rapid styling
- **Shadcn UI / Radix UI** - Accessible and customizable components (Avatar, Select, Toast)
- **Lucide React** - Set of consistent and lightweight icons

### Server
- **Node.js**
- **Koa.js** - HTTP server
- **TigerBeetle** - Ledger de alta performance para contas/transfers

### ISO 8583 Simulator
- **Python**

## Test in Postman
**Version 2.0**
- [Download Postman Collection v2.0](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/server/docs/api.postman_collection.json)

## 🚀 How to Run the Project

### Prerequisites
- **Node.js** (version 22 recommended, minimum 18)
  ```sh
  https://nodejs.org/en/download/
  ```

- **PNPM** (package manager)
  ```sh
  npm install pnpm -g
  ```

- **Docker** (optional, for simulator)
  ```sh
  https://docs.docker.com/get-docker/
  ```

### Installation and Setup

- **Clone the project**
  ```sh
  # Clone the repository
  git clone https://github.com/HallanCosta/woovi-challanger-iso8583.git

  # Enter the project folder
  cd woovi-challanger-iso8583
  ```

- **Start Simulator**
  ```sh
  # Start with docker
  docker compose -f docker-compose.yml up

  # OR

  # Enter the simulator folder
  cd ISO8583-Simulator

  # Start the simulator server
  python3 start.py

  # Host
  http://0.0.0.0:9218
  ```

- **Start Server**
  ```sh
  # Enter the project folder
  cd server

  # Install dependencies
  pnpm install

  # Start the project
  pnpm dev

  # Access at
  http://localhost:4278

  # =======================================
  # (optional)
  # Run acquirer with PIX card
  pnpm dev:acquirer:pix

  # Run acquirer with Mastercard
  pnpm dev:acquirer:card:mastercard

  # Run acquirer with Visa
  pnpm dev:acquirer:card:visa
  ```

- **Start Web (Frontend Tester)**
  ```sh
  # Enter the project folder
  cd web

  # Install dependencies
  pnpm install

  # Start the project
  pnpm dev

  # Access at
  http://localhost:4174
  ```

## 😅 Challenges Found

Fields sent in different byte sizes (ASCII and BCD).  
The **bitmap** must be compatible with the sequence of fields sent to the simulator.

| Representation | Bytes used for "1234"          | Format                                                       |
|--------------|-----------------------------------|-------------------------------------------------------------|
| **BCD**      | 2 bytes → `0x12 0x34`             | Each pair of digits is packed into 1 byte                  |
| **ASCII**    | 4 bytes → `0x31 0x32 0x33 0x34`   | Each digit is sent as its ASCII code (1 byte per digit) |

- Difference in field representation (BCD vs ASCII)
- Precise bitmap adjustment according to the fields sent
- Handling of variable fields (LLVAR/LLLVAR) with length in ASCII or BCD
- Variation in message size prefix (2 bytes, 4 bytes or none)
- Adaptation of the protocol to modern scenarios (ex: PIX) outside the original ISO

## 📂 Project Structure

```sh
woovi-challanger-iso8583/
├── ISO8583-Simulator/
│   ├── start.py
│   └── ...
├── server/
│   ├── src/
│   │   ├── enums/
│   │   ├── lib/
│   │   └── acquirer.ts        
│   │   └── config.ts         
│   │   └── routes.ts         
│   │   └── server.ts        
│   │   └── types.ts       
│   ├── docs/
│   ├── scripts/
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
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

## 👨‍💻 Contributors

[<img width="115" height="115" src="https://github.com/HallanCosta.png"  /><br><sub>@HallanCosta</sub>](https://github.com/HallanCosta)

⭐ If this project was useful to you, consider giving it a star in the repository!
