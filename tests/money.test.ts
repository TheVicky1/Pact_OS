import assert from 'node:assert';
import { formatCentsToCurrency } from '../src/lib/money';

console.log('Testing money formatting edge cases...');

// Zero and small cent values
assert.strictEqual(formatCentsToCurrency(0, 'USD'), '$0.00');
assert.strictEqual(formatCentsToCurrency(1, 'USD'), '$0.01');
assert.strictEqual(formatCentsToCurrency(9, 'USD'), '$0.09');
assert.strictEqual(formatCentsToCurrency(99, 'USD'), '$0.99');

// Fractional dollar amounts
assert.strictEqual(formatCentsToCurrency(105, 'USD'), '$1.05');
assert.strictEqual(formatCentsToCurrency(1010, 'USD'), '$10.10');
assert.strictEqual(formatCentsToCurrency(1001, 'USD'), '$10.01');

console.log('All money formatting edge-case tests passed.');
