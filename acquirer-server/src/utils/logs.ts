import { amountToCurrency } from '../../../lib/iso8583/utils.ts';
import type { Transaction } from '../modules/card/cardTransaction.ts';
import { type TransactionStage } from '../enums/stage.ts';

export type LogMessageParams = {
  stage: TransactionStage;
  transaction: Transaction;
  brandName: string;
  connectorName: string;
  buffer: Buffer;
};

export const logMessage = ({
  stage,
  transaction,
  brandName,
  connectorName,
  buffer
}: LogMessageParams): void => {
  console.log('='.repeat(60));
  console.log(`💳 CREATING ${stage.toUpperCase()} MESSAGE`);
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
};
