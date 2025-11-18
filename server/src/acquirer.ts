/**
 * Handling PIX and Card Processing using ISO8583
 * Cards with prefix (3907) are cards that issue the processing code (900000) for the transaction to be processed via PIX.
 * Cards with prefix (5162) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 * Cards with prefix (4026) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 */

import { once } from 'node:events';
import { Socket } from 'node:net';

import ISO from './lib/iso8583/index.ts';
import { BRAND_PREFIX, BRAND_NAMES } from './enums/brands.ts';
import { PROCESSING_CODE } from './enums/processingCode.ts';
import { getIssuerConnection } from './tcpConnectionManager.ts';

import type { Transaction } from './types.ts';

const DEBUG = process.env.DEBUG === 'true';
const TRANSACTION_TYPE = 'sale';
const RESPONSE_CODE_APPROVED = '00';
// const { CONNECTION_TIMEOUT_MS } = tcpConfig;

let lastTask: Promise<unknown> = Promise.resolve();

const awaitResponse = async (socket: Socket, buffer: Buffer): Promise<Buffer> => {
  const abortController = new AbortController();
  const { signal } = abortController;

  const dataPromise = once(socket, 'data', { signal }).then(([data]) => data);

  const errorPromise = once(socket, 'error', { signal }).then(([error]) => {
    throw new Error(`Connection error: ${error.message}`);
  });

  const timeoutPromise = once(socket, 'timeout', { signal }).then(() => {
    socket.destroy();
    throw new Error('Connection timeout');
  });

  socket.write(buffer);

  try {
    return await Promise.race([dataPromise, errorPromise, timeoutPromise]);
  } finally {
    abortController.abort();
    dataPromise.catch(() => {});
    errorPromise.catch(() => {});
    timeoutPromise.catch(() => {});
  }
};

const processTransaction = async (transaction: Transaction): Promise<any> => {
  //
  // BRAND → Processing Code
  //
  if (transaction.cardNumber.startsWith(BRAND_PREFIX.PIX)) {
    transaction.processingCode = PROCESSING_CODE.PIX;
  } 
  else if (
    transaction.cardNumber.startsWith(BRAND_PREFIX.MASTERCARD) || 
    transaction.cardNumber.startsWith(BRAND_PREFIX.VISA)
  ) {
    transaction.processingCode = PROCESSING_CODE.CARD;
  }

  const processingCodeName =
    transaction.processingCode === PROCESSING_CODE.PIX ? "Pix" : "Card";

  const prefix = transaction.cardNumber.slice(0, 4) as keyof typeof BRAND_NAMES;
  const brandName = BRAND_NAMES[prefix] ?? 'Unknown';

  if (!transaction.processingCode) {
    return { 
      success: false,
      message: 'Brand not supported',
      responseCode: '99',
      processingCodeName,
      brandName
    };
  }

  const client = await getIssuerConnection();

  //
  // Transaction Builders from module ISO.Messages
  //
  const transactionHandlers: Record<string, (opts: Transaction) => Buffer> = {
    sale: ISO.Messages.createPurchaseMessage,
    // auth: ISO.Messages.createAuthMessage,
    // void: (opts) => ISO.Messages.createVoidMessage({...}),
    // reversal: ...
  };

  const transactionHandler = transactionHandlers[TRANSACTION_TYPE];

  if (!transactionHandler) {
    return { 
      success: false,
      message: 'Invalid transaction type',
      processingCodeName,
      brandName
    };
  }

  //
  // BUILD ISO8583 BUFFER
  //
  const buffer = transactionHandler(transaction);

  if (DEBUG) {
    console.log('='.repeat(60));
    console.log(`💳 CREATING MESSAGE OF ${TRANSACTION_TYPE.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log('\n📋 Customized transaction:');
    console.log(`   Value: R$ ${ISO.Utils.amountToCurrency(transaction.amount)}`);
    console.log(`   Transaction ID: ${transaction.transactionId}`);
    console.log(`   Acquirer: ${transaction.acquirerInstitution}`);
    console.log(`   Currency: BRL (${transaction.currency})`);
    console.log(`   Card Number: ${transaction.cardNumber}`);
    console.log(`   Processing Code: ${transaction.processingCode}`);
    console.log(`   Brand Name: ${brandName}`);
    
    console.log(`\n📦 Buffer (${buffer.length} bytes)`);
    console.log(`Hex: ${buffer.toString('hex')}\n`);
    console.log('📤 Sending to simulator...\n');
  }
  
  // client.setTimeout(CONNECTION_TIMEOUT_MS);
  
  const data = await awaitResponse(client, buffer);

  if (DEBUG) {
    console.log(`📦 Response received (${data.length} bytes)`);
    console.log(`Hex: ${data.toString('hex')}\n`);
  }

  // Remove header (MLI + TPDU)
  const isoPayload = data.subarray(7);

  //
  // Parse using namespace ISO.Parser
  //
  const parsed = ISO.Parser.parseIsoFromBuffer(isoPayload);
  const responseCode: string = parsed['39'];

  const isApproved = responseCode === RESPONSE_CODE_APPROVED;

  const saleResponseCode = ISO.Enums.SALES_RESPONSE_CODES
    .find(sale => sale.req === responseCode);

  const description = saleResponseCode?.desc ?? 'Invalid processing code';

  if (!isApproved) {
    if (DEBUG) {
      console.log(`❌ ${description}:`, responseCode)
    }

    return { 
      success: false, 
      responseCode, 
      amount: transaction.amount,
      message: description,
      type: processingCodeName,
      brandName
    };
  }

  if (DEBUG) {
    console.log(`✅ Approved:`, responseCode);
  }

  return { 
    success: true, 
    responseCode, 
    amount: transaction.amount,
    message: description, 
    type: processingCodeName,
    brandName 
  };
};

async function acquirer(transaction: Transaction): Promise<any> {
  const run = lastTask.then(() => processTransaction(transaction));
  lastTask = run.catch(() => {});
  return run;
}

export default acquirer;
