/**
 * Handling PIX and Card Processing using ISO8583
 * Cards with prefix (3907) are cards that issue the processing code (900000) for the transaction to be processed via PIX.
 * Cards with prefix (5162) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 * Cards with prefix (4026) are cards that issue the processing code (000000) for the transaction to be processed via Card.
 */

import { once } from 'node:events';
import { Socket } from 'node:net';

import { createPurchaseMessage, createAuthMessage } from './handlers/messageHandler.ts';
import { amountToCurrency } from '../../lib/iso8583/utils.ts';
import { parseIsoFromBuffer } from '../../lib/iso8583/parser.ts';
import { ISO8583_RESPONSE_CODES } from '../../lib/iso8583/responseCodes.ts';
import { BRANDS_PREFIX, BRAND_NAMES } from './enums/brands.ts';
import { PROCESSING_CODE } from './enums/processingCode.ts';
import { routeTransaction } from './connectorService.ts';

import type { ConnectorResult, ActiveConnectorResult, NoopConnectorResult } from './connectors/types.ts';
import type { Transaction } from './types.ts';

const DEBUG = process.env.DEBUG === 'true';
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

const matchesPrefix = (cardNumber: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => cardNumber.startsWith(prefix));

const findBrandName = (cardNumber: string): string => {
  const match = Object.keys(BRAND_NAMES).find((prefix) => cardNumber.startsWith(prefix));
  return match ? BRAND_NAMES[match as keyof typeof BRAND_NAMES] : 'Unknown';
};

const processTransaction = async (transaction: Transaction): Promise<any> => {
  //
  // BRAND → Processing Code
  //
  if (matchesPrefix(transaction.cardNumber, BRANDS_PREFIX.PIX)) {
    transaction.processingCode = PROCESSING_CODE.PIX;
  } else {
    // Default to card; brand server will validate BIN and return RC 15 if needed
    transaction.processingCode = PROCESSING_CODE.CARD;
  }


  const processingCodeName =
    transaction.processingCode === PROCESSING_CODE.PIX
      ? 'Pix'
      : transaction.processingCode === PROCESSING_CODE.CARD
        ? 'Card'
        : 'Unknown';

  const brandName = findBrandName(transaction.cardNumber);

  let connector: ConnectorResult;
  let connectorName = '';

  connector = await routeTransaction(transaction);

  if ((connector as NoopConnectorResult).noop) {
    const message =
      (connector as NoopConnectorResult).message ||
      `Routing PAN ${transaction.cardNumber} to ${(connector as NoopConnectorResult).bank} bank is handled outside the simulator`;

    console.log(`[ROUTING][NO-OP] ${message}`);

    return {
      success: false,
      responseCode: '91',
      amount: transaction.amount,
      message,
      type: processingCodeName,
      brandName,
      routedTo: (connector as NoopConnectorResult).bank,
    };
  }

  const { socket: client, name } = connector as ActiveConnectorResult;
  connectorName = name;

  const transactionHandlers: Record<string, (opts: Transaction) => Buffer> = {
    sale: createPurchaseMessage,
    auth: createAuthMessage,
    // void: (opts) => createVoidMessage({...}),
    // reversal: ...
  };

  const sendAndParse = async (kind: 'sale' | 'auth') => {
    const handler = transactionHandlers[kind];
    if (!handler) throw new Error(`Invalid transaction type: ${kind}`);

    const buffer = handler(transaction);

    if (DEBUG) {
      console.log('='.repeat(60));
      console.log(`💳 CREATING MESSAGE OF ${kind.toUpperCase()}`);
      console.log('='.repeat(60));
      console.log('\n📋 Customized transaction:');
      console.log(`   Value: R$ ${amountToCurrency(transaction.amount)}`);
      console.log(`   Transaction ID: ${transaction.transactionId}`);
      console.log(`   Acquirer: ${transaction.acquirerInstitution}`);
      console.log(`   Currency: BRL (${transaction.currency})`);
      console.log(`   Card Number: ${transaction.cardNumber}`);
      console.log(`   Processing Code: ${transaction.processingCode}`);
      console.log(`   Brand Name: ${brandName}`);
      console.log(`   Connector: ${connectorName}`);

      console.log(`\n📦 Buffer (${buffer.length} bytes)`);
      console.log(`Hex: ${buffer.toString('hex')}\n`);
      console.log('📤 Sending to simulator...\n');
    }

    const data = await awaitResponse(client, buffer);

    if (DEBUG) {
      console.log(`📦 Response received (${data.length} bytes)`);
      console.log(`Hex: ${data.toString('hex')}\n`);
    }

    const isoPayload = data.subarray(7);
    const parsed = parseIsoFromBuffer(isoPayload);
    const responseCode: string = parsed['39'];
    const isApproved = responseCode === RESPONSE_CODE_APPROVED;
    const saleResponseCode = ISO8583_RESPONSE_CODES.find((sale) => sale.req === responseCode);
    const description = saleResponseCode?.desc ?? 'Invalid processing code';

    const holdRaw = parsed['48'] ?? parsed['62'];
    const holdStr = Buffer.isBuffer(holdRaw)
      ? holdRaw.toString('ascii')
      : holdRaw != null
        ? String(holdRaw)
        : '';
    let holdHex = holdStr.replace(/[^a-fA-F0-9]/g, '');
    if (holdHex.length > 32) {
      holdHex = holdHex.slice(-32);
    }

    if (DEBUG && holdHex) {
      console.log(`[ACQUIRER] Captured holdId from response (hex): ${holdHex}`);
    }

    const holdId = holdHex || undefined;

    return { responseCode, isApproved, description, holdId };
  };

  // Cards: AUTH (0100) then FINANCIAL (0200). Pix: only FINANCIAL (0200).
  if (transaction.processingCode === PROCESSING_CODE.CARD) {
    const auth = await sendAndParse('auth');

    if (!auth.isApproved) {
      if (DEBUG) console.log(`❌ AUTH FAILED: ${auth.description} (${auth.responseCode})`);
      return {
        success: false,
        responseCode: auth.responseCode,
        amount: transaction.amount,
        message: auth.description,
        type: processingCodeName,
        brandName,
        stage: 'authorization',
      };
    }

    if (auth.holdId) {
      transaction.holdId = auth.holdId;
    }

    // Simula liquidação posterior: espera 5s antes da captura (0200).
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const sale = await sendAndParse('sale');

    if (!sale.isApproved) {
      if (DEBUG) console.log(`❌ SALE FAILED: ${sale.description} (${sale.responseCode})`);
      return {
        success: false,
        responseCode: sale.responseCode,
        amount: transaction.amount,
        message: sale.description,
        type: processingCodeName,
        brandName,
        stage: 'financial',
      };
    }

    if (DEBUG) {
      console.log(`✅ Approved:`, sale.responseCode);
    }

    return {
      success: true,
      responseCode: sale.responseCode,
      amount: transaction.amount,
      message: sale.description,
      type: processingCodeName,
      brandName,
    };
  }

  // PIX or other direct financial requests
  const sale = await sendAndParse('sale');

  if (!sale.isApproved) {
    if (DEBUG) console.log(`❌ SALE FAILED: ${sale.description} (${sale.responseCode})`);
    return {
      success: false,
      responseCode: sale.responseCode,
      amount: transaction.amount,
      message: sale.description,
      type: processingCodeName,
      brandName,
      stage: 'financial',
    };
  }

  if (DEBUG) {
    console.log(`✅ Approved:`, sale.responseCode);
  }

  return {
    success: true,
    responseCode: sale.responseCode,
    amount: transaction.amount,
    message: sale.description,
    type: processingCodeName,
    brandName,
  };
};

async function acquirer(transaction: Transaction): Promise<any> {
  const run = lastTask.then(() => processTransaction(transaction));
  lastTask = run.catch(() => {});
  return run;
}

export default acquirer;
