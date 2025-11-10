import acquirer from '../src/acquirer.ts';

const cardNumber = process.env.PREFIX === '3907' ? '390700000' : '516200000';

const transaction = {
  amount: '000000005200',             // Value to response code
  transactionId: '000123',            // Transaction ID (6 dígitos)
  acquirerInstitution: '01020000000', // Code acquirer (LLVAR)
  merchantId: 'WOOVIMERCHANT001',     // ID do merchant (hex) - ajustado para length par
  currency: '764',                    // Currency (hex) - 764 = BRL
  cardNumber,                         // Card number with brand pix (PAN)
  // cardNumber: '390700000',            // Card number with brand credit card (PAN)
  // cardNumber: '516200000',            // Card number with brand credit card (PAN)
  // cardNumber: '402600000',            // Card number with brand creadit card (PAN)
  processingCode: '123456',           // Processing code
};

// Execute test request success sale
(async function() {
  await acquirer(transaction);
})()
