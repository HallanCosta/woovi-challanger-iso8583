import acquirer from '../src/acquirer.ts';
import { closeBrandConnection } from '../src/brandClient.ts';

const transaction = {
  amount: '000000005214',                  // Value to response code
  transactionId: '000123',                 // Transaction ID (6 dígitos)
  acquirerInstitution: '01020000000',      // Code acquirer (LLVAR)
  merchantId: 'WOOVIMERCHANT001',          // ID do merchant (hex) - ajustado para length par
  currency: '986',                         // Currency (hex) - 764 = BRL
  cardNumber: '5162000000000000',          // Card number with brand pix (PAN)
  // cardNumber: HALLAN_PIX_CARDS[0],
  // cardNumber: HALLAN_MASTERCARD_NUMBERS[0],
  // cardNumber: HALLAN_VISA_CARDS[0],
  // cardNumber: WOOVI_MASTERCARD_CARDS[0],
  // cardNumber: WOOVI_VISA_CARDS[0],
  // cardNumber: WOOVI_PIX_CARDS[0],
};

// Execute test request success sale
(async function() {
  await acquirer(transaction);
  closeBrandConnection()
})()
