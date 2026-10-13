// Calculates the Luhn check digit for a 5-digit payload.
export function calculateLuhnDigit(payload5Digit: string): number {
  let sum = 0;

  for (let i = 0; i < payload5Digit.length; i++) {
    let digit = parseInt(payload5Digit[i], 10);
    // Double digits at even indexes (0, 2, 4) according to the Luhn algorithm.
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    // Add the processed digit to the running total.
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

// Generates a random 5-digit payload and appends its Luhn check digit.
export function generateLuhnPin(): string {
  const raw5 = Math.floor(10000 + Math.random() * 90000).toString();
  const checkDigit = calculateLuhnDigit(raw5);
  return `${raw5}${checkDigit}`;
}

// Validates whether a PIN is a valid 6-digit Luhn PIN.
export function validateLuhnPin(pin: string): boolean {
  // Reject empty, non-6-digit, or non-numeric PINs.
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) return false;
  const body5 = pin.slice(0, 5);
  const checkDigit = parseInt(pin[5], 10);
  return calculateLuhnDigit(body5) === checkDigit;
}
