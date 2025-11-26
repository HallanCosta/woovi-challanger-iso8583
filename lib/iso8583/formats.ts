// Formats fields ISO8583

export interface ISO8583FieldFormat {
  ContentType: string;
  Label: string;
  LenType: string;
  MaxLen: number;
  MinLen?: number;
  Format: string;
}

const formats: Record<string, ISO8583FieldFormat> = {
  "0": {
    ContentType: "n",
    Label: "Message Type Indicator",
    LenType: "fixed",
    MaxLen: 4,
    Format: "BCD"
  },
  "1": {
    ContentType: "b",
    Label: "Bitmap",
    LenType: "fixed",
    MaxLen: 8,
    Format: "Binary"
  },
  "2": {
    ContentType: "n",
    Label: "Primary account number (PAN)",
    LenType: "llvar",
    MaxLen: 19,
    MinLen: 1,
    Format: "ASCII"
  },
  "3": {
    ContentType: "n",
    Label: "Processing code",
    LenType: "fixed",
    MaxLen: 6,
    Format: "BCD"
  },
  "4": {
    ContentType: "n",
    Label: "Amount, transaction",
    LenType: "fixed",
    MaxLen: 12,
    Format: "BCD"
  },
  "5": {
    ContentType: "n",
    Label: "Amount, settlement",
    LenType: "fixed",
    MaxLen: 12,
    Format: "BCD"
  },
  "6": {
    ContentType: "n",
    Label: "Amount, cardholder billing",
    LenType: "fixed",
    MaxLen: 12,
    Format: "BCD"
  },
  "7": {
    ContentType: "n",
    Label: "Transmission date & time",
    LenType: "fixed",
    MaxLen: 10,
    Format: "BCD"
  },
  "8": {
    ContentType: "n",
    Label: "Amount, cardholder billing fee",
    LenType: "fixed",
    MaxLen: 8,
    Format: "BCD"
  },
  "9": {
    ContentType: "n",
    Label: "Conversion rate, settlement",
    LenType: "fixed",
    MaxLen: 8,
    Format: "BCD"
  },
  "10": {
    ContentType: "n",
    Label: "Conversion rate, cardholder billing",
    LenType: "fixed",
    MaxLen: 8,
    Format: "BCD"
  },
  "11": {
    ContentType: "n",
    Label: "System trace audit number",
    LenType: "fixed",
    MaxLen: 6,
    Format: "BCD"
  },
  "12": {
    ContentType: "n",
    Label: "Time, local transaction (hhmmss)",
    LenType: "fixed",
    MaxLen: 6,
    Format: "BCD"
  },
  "13": {
    ContentType: "n",
    Label: "Date, local transaction (MMDD)",
    LenType: "fixed",
    MaxLen: 4,
    Format: "BCD"
  },
  "14": {
    ContentType: "n",
    Label: "Date, expiration",
    LenType: "fixed",
    MaxLen: 4,
    Format: "BCD"
  },
  "15": {
    ContentType: "n",
    Label: "Date, settlement",
    LenType: "fixed",
    MaxLen: 4,
    Format: "BCD"
  },
  "16": {
    ContentType: "n",
    Label: "Date, conversion",
    LenType: "fixed",
    MaxLen: 4,
    Format: "BCD"
  },
  "17": {
    ContentType: "n",
    Label: "Date, capture",
    LenType: "fixed",
    MaxLen: 4,
    Format: "BCD"
  },
  "18": {
    ContentType: "n",
    Label: "Merchant type",
    LenType: "fixed",
    MaxLen: 4,
    Format: "BCD"
  },
  "19": {
    ContentType: "n",
    Label: "Acquiring institution country code",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "20": {
    ContentType: "n",
    Label: "PAN extended country code",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "21": {
    ContentType: "n",
    Label: "Forwarding institution country code",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "22": {
    ContentType: "n",
    Label: "Point of service entry mode",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "23": {
    ContentType: "n",
    Label: "Card sequence number",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "24": {
    ContentType: "n",
    Label: "Network International identifier",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "25": {
    ContentType: "n",
    Label: "Point of service condition code",
    LenType: "fixed",
    MaxLen: 2,
    Format: "BCD"
  },
  "26": {
    ContentType: "n",
    Label: "Point of service capture code",
    LenType: "fixed",
    MaxLen: 2,
    Format: "BCD"
  },
  "27": {
    ContentType: "n",
    Label: "Authorizing identification response length",
    LenType: "fixed",
    MaxLen: 1,
    Format: "BCD"
  },
  "28": {
    ContentType: "n",
    Label: "Amount, transaction fee",
    LenType: "fixed",
    MaxLen: 8,
    Format: "BCD"
  },
  "29": {
    ContentType: "n",
    Label: "Amount, settlement fee",
    LenType: "fixed",
    MaxLen: 8,
    Format: "BCD"
  },
  "30": {
    ContentType: "n",
    Label: "Amount, transaction processing fee",
    LenType: "fixed",
    MaxLen: 8,
    Format: "BCD"
  },
  "31": {
    ContentType: "ans",
    Label: "Acquirer reference data",
    LenType: "llvar",
    MaxLen: 99,
    MinLen: 1,
    Format: "ASCII"
  },
  "32": {
    ContentType: "n",
    Label: "Acquiring institution identification code",
    LenType: "llvar",
    MaxLen: 11,
    MinLen: 1,
    Format: "BCD"
  },
  "33": {
    ContentType: "n",
    Label: "Forwarding institution identification code",
    LenType: "llvar",
    MaxLen: 11,
    MinLen: 1,
    Format: "BCD"
  },
  "34": {
    ContentType: "ans",
    Label: "Primary account number, extended",
    LenType: "llvar",
    MaxLen: 28,
    MinLen: 1,
    Format: "ASCII"
  },
  "35": {
    ContentType: "z",
    Label: "Track 2 data",
    LenType: "llvar",
    MaxLen: 37,
    MinLen: 1,
    Format: "ASCII"
  },
  "36": {
    ContentType: "ans",
    Label: "Track 3 data",
    LenType: "lllvar",
    MaxLen: 104,
    MinLen: 1,
    Format: "ASCII"
  },
  "37": {
    ContentType: "an",
    Label: "Retrieval reference number",
    LenType: "fixed",
    MaxLen: 12,
    Format: "ASCII"
  },
  "38": {
    ContentType: "an",
    Label: "Authorization identification response",
    LenType: "fixed",
    MaxLen: 6,
    Format: "ASCII"
  },
  "39": {
    ContentType: "n",
    Label: "Response code",
    LenType: "fixed",
    MaxLen: 2,
    Format: "BCD"
  },
  "40": {
    ContentType: "an",
    Label: "Service restriction code",
    LenType: "fixed",
    MaxLen: 3,
    Format: "Binary"
  },
  "41": {
    ContentType: "ans",
    Label: "Card acceptor terminal identification",
    LenType: "fixed",
    MaxLen: 8,
    Format: "Binary"
  },
  "42": {
    ContentType: "ans",
    Label: "Card acceptor identification code",
    LenType: "fixed",
    MaxLen: 15,
    Format: "Binary"
  },
  "43": {
    ContentType: "ans",
    Label: "Card acceptor name/location",
    LenType: "fixed",
    MaxLen: 40,
    Format: "ASCII"
  },
  "44": {
    ContentType: "ans",
    Label: "Additional response data",
    LenType: "llvar",
    MaxLen: 25,
    MinLen: 1,
    Format: "ASCII"
  },
  "45": {
    ContentType: "ans",
    Label: "Track 1 data",
    LenType: "llvar",
    MaxLen: 76,
    MinLen: 1,
    Format: "ASCII"
  },
  "46": {
    ContentType: "ans",
    Label: "Additional data (ISO)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "47": {
    ContentType: "ans",
    Label: "Additional data (national)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "48": {
    ContentType: "ans",
    Label: "Additional data (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "49": {
    ContentType: "an",
    Label: "Currency code, transaction",
    LenType: "fixed",
    MaxLen: 3,
    Format: "Binary"
  },
  "50": {
    ContentType: "an",
    Label: "Currency code, settlement",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "51": {
    ContentType: "an",
    Label: "Currency code, cardholder billing",
    LenType: "fixed",
    MaxLen: 3,
    Format: "BCD"
  },
  "52": {
    ContentType: "b",
    Label: "Personal identification number data",
    LenType: "fixed",
    MaxLen: 16,
    Format: "Binary"
  },
  "53": {
    ContentType: "b",
    Label: "Security related control information",
    LenType: "fixed",
    MaxLen: 16,
    Format: "Binary"
  },
  "54": {
    ContentType: "ans",
    Label: "Additional amounts",
    LenType: "lllvar",
    MaxLen: 120,
    MinLen: 1,
    Format: "ASCII"
  },
  "55": {
    ContentType: "b",
    Label: "Reserved (ISO)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "Binary"
  },
  "56": {
    ContentType: "ans",
    Label: "Reserved (ISO)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "57": {
    ContentType: "ans",
    Label: "Reserved (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "Binary"
  },
  "58": {
    ContentType: "ans",
    Label: "Reserved (national)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "59": {
    ContentType: "ans",
    Label: "Reserved (national)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "60": {
    ContentType: "ans",
    Label: "Reserved (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "61": {
    ContentType: "ans",
    Label: "Reserved (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "62": {
    ContentType: "ans",
    Label: "Reserved (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "63": {
    ContentType: "ans",
    Label: "Reserved (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "64": {
    ContentType: "b",
    Label: "Message authentication code",
    LenType: "fixed",
    MaxLen: 8,
    Format: "Binary"
  },
  "123": {
    ContentType: "ans",
    Label: "Reserved (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  },
  "127": {
    ContentType: "ans",
    Label: "Reserved (private)",
    LenType: "lllvar",
    MaxLen: 999,
    MinLen: 1,
    Format: "ASCII"
  }
};

export default formats;
