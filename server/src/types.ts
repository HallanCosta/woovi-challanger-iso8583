export interface Transaction {
  amount: string;              // Value to response code
  transactionId: string;       // Transaction ID (6 dígitos)
  acquirerInstitution: string; // Code acquirer (LLVAR)
  merchantId: string;          // ID do merchant (hex) - ajustado para length par
  currency: string;            // Currency (hex) - 764 = BRL
  cardNumber: string;          // Card number with brand pix (PAN)
  processingCode?: string;     // Processing code
}
