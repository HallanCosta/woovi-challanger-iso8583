/**
 * Handling PIX and Card Processing using ISO8583
 * Cards with prefix (3907) are cards that issue the processing code (900000) for the transaction to be processed via PIX.
 * Cards with prefix (5162) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 * Cards with prefix (4026) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 */
import * as net from 'net';

import iso8583 from './lib/iso8583/index.ts';
import { BRAND_PREFIX } from './enums/brands.ts';
import { PROCESSING_CODE } from './enums/processingCode.ts';

import type { Transaction } from './types.ts';

const PORT = Number(process.env.ISSUER_PORT) || 9218;
const HOST = process.env.HOST || 'localhost';
const DEBUG = process.env.DEBUG === 'true';
const TRANSACTION_TYPE = 'sale'; // Tipo de transação para testar: 'sale', 'auth', 'void', 'reversal', 'refund'
const RESPONSE_CODE_APPROVED = '00'; // Código de resposta esperado (últimos 2 dígitos do valor)

async function acquirer(transaction: Transaction): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
      if (DEBUG) {
        console.log(`Connected to simulator at ${HOST}:${PORT}`);
        
        console.log('='.repeat(60));
        console.log(`💳 CREATING MESSAGE OF ${TRANSACTION_TYPE.toUpperCase()}`);
        console.log('='.repeat(60));
      }

      // Validate and set processing code
      if (transaction.cardNumber.startsWith(BRAND_PREFIX.PIX)) {
        transaction.processingCode = PROCESSING_CODE.PIX;
      } 
      else if (
        transaction.cardNumber.startsWith(BRAND_PREFIX.MASTERCARD) || 
        transaction.cardNumber.startsWith(BRAND_PREFIX.VISA)
      ) {
        transaction.processingCode = PROCESSING_CODE.CARD;
      } 

      if (!transaction.processingCode) {
        client.destroy();
        resolve({ success: false, message: 'Brand not supported' });
        return;
      }

      const transactionHandlers: Record<string, (opts: Transaction) => Buffer> = {
        sale: iso8583.createPurchaseMessage,
        // auth: iso8583.createAuthMessage,
        // reversal: (opts) => iso8583.createReversalMessage({ ...opts, originalTransactionId: '000001' }),
        // void: (opts) => iso8583.createVoidMessage({ ...opts, originalTransactionId: '000001' }),
      };

      const transactionHandler = transactionHandlers[TRANSACTION_TYPE];
      if (!transactionHandler) {
        client.destroy();
        resolve({ success: false, message: 'Invalid transaction type' });
        return;
      }

      const buffer = transactionHandler(transaction);

      if (DEBUG) {
        console.log('\n📋 Customized transaction:');
        console.log(`   Value: R$ ${iso8583.amountToCurrency(transaction.amount)}`);
        console.log(`   Transaction ID: ${transaction.transactionId}`);
        console.log(`   Acquirer Institution: ${transaction.acquirerInstitution}`);
        console.log(`   Currency: BRL (${transaction.currency})`);
        console.log(`   Card Number: ${transaction.cardNumber}`);
        console.log(`   Processing Code: ${transaction.processingCode}`);
        
        console.log(`\n📦 Buffer (${buffer.length} bytes)`);
        console.log(`Hex: ${buffer.toString('hex')}\n`);
        
        console.log('📤 Sending to simulator...\n');
      }
      
      client.write(buffer);
    });

    client.on('data', (data: Buffer) => {
      if (DEBUG) {
        console.log(`📦 Response received (${data.length} bytes)`);
        console.log(`Hex: ${data.toString('hex')}\n`);
      }

      const responseBufferWithoutHeader = data.subarray(7);
      const parsedResponse = iso8583.parseIsoFromBuffer(responseBufferWithoutHeader);
      const responseCode: string = parsedResponse['39'];
      const processingCodeName = transaction.processingCode === PROCESSING_CODE.PIX ? "Pix" : "Card";

      const isApproved = responseCode === RESPONSE_CODE_APPROVED;

      if (!isApproved) {
        const saleResponseCode = iso8583.enums.SALES_RESPONSE_CODES
          .find(sale => sale.req === responseCode);

        const description = saleResponseCode?.desc ?? 'Invalid processing code';
        
        if (DEBUG) {
          console.log(`❌ ${description}:`, responseCode)
          console.log(`❌ Processing Code Name: ${processingCodeName}`)
        }

        resolve({ 
          success: false, 
          responseCode, 
          amount: transaction.amount,
          message: description,
          type: processingCodeName
        });

        return;
      }
      
      client.destroy();

      if (DEBUG) {
        console.log(`✅ Success Transaction:`, responseCode);
        console.log(`✅ Processing Code Name: ${processingCodeName}`);
      }

      resolve({ 
        success: true, 
        responseCode, 
        amount: transaction.amount,
        message: `Success Transaction`, 
        type: processingCodeName 
      });
    });

    client.on('error', (error: Error) => {
      reject(new Error(`Connection error: ${error.message}`));
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error('Connection timeout'));
    });

    client.setTimeout(10000);
  });
}

export default acquirer;
