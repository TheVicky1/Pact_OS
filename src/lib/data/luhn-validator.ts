export function calculateLuhnCheckDigit(numericPayload: string): number {
  const digits = numericPayload.replace(/\D/g, '');
  if (!digits) {
    throw new Error('Payload contains no numeric digits');
  }

  let sum = 0;
  for (let i = digits.length - 1, double = true; i >= 0; i--, double = !double) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit >= 10) digit -= 9;
    }
    sum += digit;
  }

  return (10 - (sum % 10)) % 10;
}

export function validateLuhnString(fullCode: string): boolean {
  const digits = fullCode.replace(/\D/g, '');
  if (!digits) {
    return false;
  }

  let sum = 0;
  for (let i = digits.length - 1, double = false; i >= 0; i--, double = !double) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit >= 10) digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

export function generateLuhnBondCode(prefix: string, payloadDigits: string): string {
  const cleanPayload = payloadDigits.replace(/\D/g, '');
  const checkDigit = calculateLuhnCheckDigit(`${prefix}${cleanPayload}`);
  return `${prefix}-${cleanPayload}${checkDigit}`;
}
