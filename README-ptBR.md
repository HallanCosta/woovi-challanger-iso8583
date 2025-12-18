# 🏦 Woovi Challanger - ISO8583

[🇺🇸 Leia esse README em Inglês](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/README.md)

<hr>

## ☁️ Live demo
- **Produção (Testador web):** https://iso8583.hallancosta.com (ON) 🟢
- **Produção (Servidor):** https://server-iso8583.hallancosta.com (ON) 🟢

## 📸 Pré visualização
<img src="https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/web/screenshots/transaction-approved.png?raw=true">

Simulador de transações ISO 8583 com Acquirer que conecta em um Issuer.

Tratando Processamento de Pix e Cartão usando iso8583:<br>
- Cartões com prefixo 3907 são cartões que emitem o código de processamento (900000) para transação ser feita com o PIX.<br>
- Cartões com prefixo 5162 são cartões que emitem o código de processamento (000000) para transação ser feita com o Cartão.<br>
- Cartões com prefixo 4026 são cartões que emitem o código de processamento (000000) para transação ser feita com o Cartão.<br>

OBS: Frontend só testa transação com prefixo 3907 simulando um bandeira pix, mas é possível testar outras bandeiras ativando a feature flag no frontend

### Por que 000000 e 900000?
Reaproveitamos o código padrão de compra `000000` para bandeiras normais e reservamos `900000` como flag de PIX. Essa separação permite rotear os fluxos (cartão vs. PIX) sem inventar novos MTIs ou alterar o mapeamento ISO dos campos.

## 🪢 Fluxo de Autorização + Captura (Acquirer ↔ Brand ↔ Issuer)
*Exemplos de bandeira: Mastercard, Visa, Elo — roteando pelo prefixo do PAN para o issuer/simulador correto.*
```
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


     (Minutos, segundos ou até dias depois — depende do tipo de operação)


┌───────────┐        ┌────────────┐        ┌───────────┐
│ Acquirer  │ -----> │   Brand    │ -----> │  Issuer   │
│           │ 0200   │ (Visa/Mc)  │ 0200   │           │
└───────────┘        └────────────┘        └───────────┘
       ▲                      │                     │
       │                      │                     └──(0210/0220 Financial Resp)
       │                      │                             Approved / Error
       │                      ▼
       │               (0210/0220 Financial Resp)
       │
       └────────── Clearing & Settlement (Brand) ──────────┘
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Framework para construção de interfaces componentizadas
- **Vite** - Build tool moderna e extremamente rápida para desenvolvimento
- **TypeScript 5.9** - Superset JavaScript com tipagem estática
- **React Hook Form** - Gerenciamento performático de formulários
- **Zod v4** - Schema validation para validação de dados (CPF, RG, etc)
- **@hookform/resolvers** - Integração entre React Hook Form e Zod
- **Tailwind CSS v4** - Framework CSS utilitário para estilização rápida
- **Shadcn UI / Radix UI** - Componentes acessíveis e customizáveis (Avatar, Select, Toast)
- **Lucide React** - Conjunto de ícones consistentes e leves

### Server
- **Node.js**
- **Koa.js** - Servidor http
- **TigerBeetle** - Ledger de alta performance para contas/transfers

### Simulador ISO 8583
- **Python**

## Test in Postman
**Version 2.0**
- [Download Postman Collection v2.0](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/acquirer-server/docs/api.postman_collection.json)

## 🚀 Como Rodar o Projeto

### Pré-requisitos
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

### Instalação e execução


- **Clonar o projeto**
  ```sh
  # Clone o repositório
  git clone https://github.com/HallanCosta/woovi-challanger-iso8583.git

  # Entre na pasta do projeto
  cd woovi-challanger-iso8583
  ```

- **Iniciar Docker**
  ```sh
  # Iniciar o python e o tigerbeetle
  docker compose -f docker-compose.yml up
  ```

- **Iniciar Simulator - Deprecated**
  ```sh
  # Entrar na pasta do simulador
  cd ISO8583-Simulator

  # Inicia o servidor do simulador
  python3 start.py

  # Host
  http://0.0.0.0:9218
  ```

- **Iniciar Acquirer Server**
  ```sh
  # Entre na pasta do projeto
  cd acquirer-server

  # Instala as dependências
  pnpm install

  # Inicia o projeto
  pnpm dev

  # Acessar
  http://localhost:9000

  # =======================================
  # (opicional)
  # Rodar acquirer com cartão pix
  pnpm card:pix

  # Rodar acquirer com cartão mastercard
  pnpm card:mastercard

  # Rodar acquirer com cartão visa
  pnpm card:visa
  ```

- **Iniciar Brands Server**
  ```sh
  # Entre na pasta do projeto
  cd brands-server

  # Instala as dependências
  pnpm install

  # Inicia o projeto
  pnpm dev

  # Acessar
  http://localhost:9001
  ```

- **Iniciar Issuer Server**
  ```sh
  # Entre na pasta do projeto
  cd issuer-server

  # Instala as dependências
  pnpm install

  # Inicia o projeto
  pnpm dev

  # Acessar
  http://localhost:9002
  ```

- **Iniciar Web (Testador frontend)**
  ```sh
  # Entre na pasta do projeto
  cd web

  # Instala as dependências
  pnpm install

  # Inicia o projeto
  pnpm dev

  # Acessar
  http://localhost:4174
  ```

## 😅 Desafios Encontrados

Campos enviados em tamanhos de bytes diferentes (ASCII e BCD).  
O **bitmap** deve ser compatível com a sequência de campos enviados para o simulador.

| Representação | Bytes usados para "1234"          | Forma                                                       |
|--------------|-----------------------------------|-------------------------------------------------------------|
| **BCD**      | 2 bytes → `0x12 0x34`             | Cada par de dígitos é compactado em 1 byte                  |
| **ASCII**    | 4 bytes → `0x31 0x32 0x33 0x34`   | Cada dígito é enviado como seu código ASCII (1 byte por dígito) |


- Diferença de representação de campos (BCD vs ASCII)
- Ajuste preciso do bitmap conforme os campos enviados
- Tratamento de campos variáveis (LLVAR/LLLVAR) com length em ASCII ou BCD
- Variação no prefixo de tamanho da mensagem (2 bytes, 4 bytes ou nenhum)
- Adaptação do protocolo a cenários modernos (ex: PIX) fora da ISO original


## 📂 Estrutura do Projeto

```sh
woovi-challanger-iso8583/
├── ISO8583-Simulator/
│   ├── start.py
│   └── ...
├── acquirer-server/
│   ├── src/
│   ├── docs/
│   ├── package.json
│   └── ...
├── brands-server/
│   ├── src/
│   ├── package.json
│   └── ...
├── issuer-server/
│   ├── src/
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

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!
