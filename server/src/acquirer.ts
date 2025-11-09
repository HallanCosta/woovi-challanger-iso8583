import * as net from 'net';

import iso8583 from './lib/iso8583/index.ts';
import { SALES_RESPONSE_CODES } from './lib/iso8583/enums/response.ts';

const PORT = 9218
const HOST = 'localhost'

// Tipo de transação para testar: 'sale', 'auth', 'void', 'reversal', 'refund'
const TRANSACTION_TYPE = 'sale';

// Código de resposta esperado (últimos 2 dígitos do valor)
const RESPONSE_CODE_APPROVED = '00';

const client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log(`Conectado ao simulador em ${HOST}:${PORT}\n`);
    
    console.log('='.repeat(60));
    console.log(`💳 CRIANDO MENSAGEM DE ${TRANSACTION_TYPE.toUpperCase()}`);
    console.log('='.repeat(60));
    
    const options = {
      amount: '000000005200',             // Value to response code
      transactionId: '000123',            // Transaction ID (6 dígitos)
      acquirerInstitution: '01020000000', // Code acquirer (LLVAR)
      merchantId: 'WOOVIMERCHANT001',     // ID do merchant (hex) - ajustado para length par
      currency: '764',                    // Currency (hex) - 764 = BRL
      cardNumber: '290700000',            // Card number with brand pix (PAN)
      processingCode: '123456',           // Processing code
    };

    // Validate pan number and set processing code pix
    if (options.cardNumber.startsWith('3907')) {
      options.processingCode = '900000';
    }

    // Validate pan number brand and set processing code card
    if (options.cardNumber.startsWith('4026')) {
      options.processingCode = '000000';
    }

    // Validate pan number brand and set processing code card
    if (options.cardNumber.startsWith('5162')) {
      options.processingCode = '000000';
    }

    const transactionHandlers: Record<string, (opts: any) => Buffer> = {
      sale: iso8583.createPurchaseMessage,
      // auth: iso8583.createAuthMessage,
      // void: (opts) => iso8583.createVoidMessage({ ...opts, originalTransactionId: '000001' }),
      // reversal: (opts) => iso8583.createReversalMessage({ ...opts, originalTransactionId: '000001' }),
    };
    
    const transactionHandler = transactionHandlers[TRANSACTION_TYPE];
    
    if (!transactionHandler) {
      console.log('Invalid transaction type. Use: sale, auth, void, reversal');
      client.destroy();
      return;
    }

    const buffer = transactionHandler(options);

    console.log('\n📋 Transação customizada:');
    console.log(`   Valor: R$ 50,${RESPONSE_CODE_APPROVED}`);
    console.log(`   ID: ${options.transactionId}`);
    console.log(`   Terminal: ${options.acquirerInstitution}`);
    console.log(`   Moeda: BRL (${options.currency})`);
    console.log(`   Cartão: ${options.cardNumber}`);
    console.log(`   Código de resposta esperado: ${RESPONSE_CODE_APPROVED}`);
    
    console.log(`\n📦 Buffer (${buffer.length} bytes)`);
    console.log(`Hex: ${buffer.toString('hex')}\n`);
    
    console.log('📤 Enviando para simulador...\n');
    client.write(buffer);
});

client.on('data', (data: Buffer) => {
    console.log(`\n📦 Resposta recebida (${data.length} bytes)`);
    console.log(`Hex: ${data.toString('hex')}`);

    const responseBufferWithoutHeader = data.subarray(7);
    const parsedResponse = iso8583.parseIsoFromBuffer(responseBufferWithoutHeader);
    const responseCode: string = parsedResponse['39'];
    iso8583.describeFields(parsedResponse);

    if (responseCode !== RESPONSE_CODE_APPROVED) {
      const saleResponseCode = SALES_RESPONSE_CODES.find(s => s.res === responseCode);
      const description = saleResponseCode?.desc ?? 'Invalid processing code';
      console.log(`❌ ${description}:`, responseCode);
    } else {
      console.log('✅ Transação aprovada:', responseCode);
    }

    client.destroy();
});

client.on('error', (error: Error) => {
    console.error(`\n❌ Erro de conexão: ${error.message}`);
    client.destroy();
});

client.on('close', () => {
    console.log('\n🔌 Conexão fechada\n');
});

client.on('timeout', () => {
    console.log('\n⏰ Timeout da conexão');
    client.destroy();
});

client.setTimeout(10000);