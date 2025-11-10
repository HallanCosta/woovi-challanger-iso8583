/**
 * ISO8583 Message Creators
 */

import type { Transaction } from '../../types.ts';
import { strToBCD } from './utils.ts';

// export interface MessageOptions {
//   processingCode: string;
//   amount: string;
//   transactionId: number;
//   acquirerInstitution: string;
//   merchantId: string;
//   currency: string;
//   originalTransactionId?: string;
// }

// Build de message default ISO8583
function buildIso8583Message(options: Transaction, customFields: any = {}): Buffer {
  const now = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const tpdu = Buffer.from('6000000001', 'hex');
  const mti = strToBCD('0200', 2);
  const bitmap = Buffer.from('3238000101c08080', 'hex');
  // const bitmap = Buffer.from('7238000101c08080', 'hex');

  // Campos BCD
  const de03 = strToBCD(options.processingCode, 3);
  // const de02 = strToBCD('3907', 5);

  const de04 = strToBCD(options.amount, 6);
  const de07 = strToBCD(`${month}${day}${hours}${minutes}${seconds}`, 5);
  const de11 = strToBCD(String(options.transactionId).padStart(6, '0'), 3);
  const de12 = strToBCD(`${hours}${minutes}${seconds}`, 3);
  const de13 = strToBCD(`${month}${day}`, 2);

  const de32 = strToBCD(options.acquirerInstitution, 7);

  const de40 = Buffer.from('002', 'hex');
  const de41 = strToBCD('98765432', 4);
  const de42 = Buffer.from(options.merchantId.padEnd(15, ' '), 'ascii');
  const de49 = Buffer.from(options.currency, 'hex');
  const de57Prefix = Buffer.from('12', 'hex');
  const de57Data = Buffer.from('858f780ac38e1ac6d446fa103191326ce8316041dbb6f0f18b58eef445fad222c91ec8b6e9e343fea1dcc843a6c899bd9da3cc15eea019b6c30a027243fb640c', 'hex');

  const payload = Buffer.concat([
    tpdu, mti, bitmap,
    // de02,
    de03, de04, de07, de11, de12, de13, de32,
    de40, de41, de42, de49, de57Prefix, de57Data
  ]);

  const lengthBuffer = Buffer.alloc(2);
  lengthBuffer.writeUInt16BE(payload.length, 0);

  return Buffer.concat([lengthBuffer, payload]);
}


// Create message sale on format simulator
function createPurchaseMessage(options: Transaction): Buffer {
  return buildIso8583Message(options, { mti: '0200', processingCode: '000000' });
}

// Create message sale on format simulator
function createAuthMessage(options: Transaction): Buffer {
  return buildIso8583Message(options, { mti: '0100', processingCode: '000000' });
}

// Create message void on format simulator
function createVoidMessage(options: Transaction): Buffer {
  const originalTransactionId = '000001'
  // DE37: Retrieval reference number (12 chars ASCII)
  const de37 = Buffer.from(originalTransactionId.padEnd(12, ' '), 'ascii');

  return buildIso8583Message(options, {
    mti: '0200',
    processingCode: '020000',
    extraBuffers: [de37]
  });
}

// Create message reversal on format simulator
function createReversalMessage(options: Transaction): Buffer {
  const originalTransactionId = '000001'
  // DE37: Retrieval reference number (12 chars ASCII)
  const de37 = Buffer.from(originalTransactionId.padEnd(12, ' '), 'ascii');

  return buildIso8583Message(options, {
    mti: '0400',
    processingCode: '000000',
    extraBuffers: [de37]
  });
}

const messages = {
  createPurchaseMessage,
  createAuthMessage,
  createVoidMessage,
  createReversalMessage
};

export default messages;
