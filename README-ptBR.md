# 🏦 Woovi Challanger - ISO8583

[🇺🇸 Leia esse README em Inglês](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/README.md)

<hr>

Simulador de transações ISO 8583 com Acquirer que conecta em um Issuer.

Tratando Processamento de Pix e Cartão usando iso8583:<br>
- Cartões com prefixo 3907 são cartões que emitem o código de processamento (900000) para transação ser feita com o PIX.<br>
- Cartões com prefixo 5162 são cartões que emitem o código de processamento (000000) para transação ser feita com o Cartão.<br>
- Cartões com prefixo 4026 são cartões que emitem o código de processamento (000000) para transação ser feita com o Cartão.<br>

OBS: Frontend só testa transação com prefixo 3907 simulando um bandeira pix, mas é possível testar outras bandeiras ativando a feature flag no frontend

## ☁️ Live demo
- **Produção (Testador web):** https://iso8583.hallancosta.com (temporarily offline)
- **Produção (Servidor):** https://server-iso8583.hallancosta.com (temporarily offline)

## 📸 Pré visualização
<img src="https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/web/screenshots/transaction-approved.png?raw=true">

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

### Simulador ISO 8583
- **Python**

## Test in Postman
**Version 2.0**
- [Download Postman Collection v2.0](https://github.com/HallanCosta/woovi-challanger-iso8583/blob/main/server/docs/api.postman_collection.json)

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

- **Iniciar Simulator**
  ```sh
  # Iniciar com docker
  docker compose -f docker-compose.yml up

  # OR

  # Entrar na pasta do simulador
  cd ISO8583-Simulator

  # Inicia o servidor do simulador
  python3 start.py

  # Host
  http://0.0.0.0:9218
  ```

- **Iniciar Servidor**
  ```sh
  # Entre na pasta do projeto
  cd server

  # Instala as dependências
  pnpm install

  # Inicia o projeto
  pnpm dev

  # Acessar
  http://localhost:4278

  # =======================================
  # (opicional)
  # Rodar acquirer com cartão pix
  pnpm dev:acquirer:pix

  # Rodar acquirer com cartão mastercard
  pnpm dev:acquirer:card:mastercard

  # Rodar acquirer com cartão visa
  pnpm dev:acquirer:card:visa
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

## 👨‍💻 Contribuidores

[<img width="115" height="115" src="https://github.com/HallanCosta.png"  /><br><sub>@HallanCosta</sub>](https://github.com/HallanCosta)

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!