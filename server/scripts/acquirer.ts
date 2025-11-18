import acquirer from '../src/acquirer.ts';
import { config } from '../src/config.ts';
import { CARD_NUMBERS } from '../src/enums/cardNumbers.ts';
import { closeIssuerConnection } from '../src/tcpConnectionManager.ts';

const cardNumbers = {
  '3907': CARD_NUMBERS.PIX,
  '5162': CARD_NUMBERS.MASTERCARD,
  '4026': CARD_NUMBERS.VISA
}

const transaction = {
  amount: '000000005200',                  // Value to response code
  transactionId: '000123',                 // Transaction ID (6 dígitos)
  acquirerInstitution: '01020000000',      // Code acquirer (LLVAR)
  merchantId: 'WOOVIMERCHANT001',          // ID do merchant (hex) - ajustado para length par
  currency: '764',                         // Currency (hex) - 764 = BRL
  cardNumber: cardNumbers[config.PREFIX],  // Card number with brand pix (PAN)
  // cardNumber: CARD_NUMBERS.PIX,         // Card number with brand credit card (PAN)
  // cardNumber: CARD_NUMBERS.MASTERCARD,  // Card number with brand credit card (PAN)
  // cardNumber: CARD_NUMBERS.VISA,        // Card number with brand creadit card (PAN)
};

// Execute test request success sale
(async function() {
  await acquirer(transaction);
  closeIssuerConnection()
})()
