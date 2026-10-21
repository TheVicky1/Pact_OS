import assert from "node:assert/strict";
import {
  addFixed,
  subFixed,
  mulFixed,
  divFixed,
  roundFixed,
  formatFixed,
} from "../src/lib/data/fixed-decimal";

assert.equal(addFixed(0.1, 0.2, 2), 0.3);
assert.equal(addFixed("12.345", "0.005", 2), 12.35);
assert.equal(subFixed("1.0", "0.9", 2), 0.1);
assert.equal(subFixed("-1.25", "-2.50", 2), 1.25);

assert.equal(mulFixed("19.99", 3, 2), 59.97);
assert.equal(mulFixed("1.25", "2.5", 3), 3.125);
assert.equal(divFixed(1, 3, 2), 0.33);
assert.equal(divFixed(10, 4, 3), 2.5);
assert.throws(() => divFixed(1, 0), RangeError);

assert.equal(roundFixed("2.5", 0, "half-even"), 2);
assert.equal(roundFixed("3.5", 0, "half-even"), 4);
assert.equal(roundFixed("-2.5", 0, "half-even"), -2);
assert.equal(roundFixed("2.5", 0, "half-up"), 3);
assert.equal(roundFixed("-2.5", 0, "half-up"), -3);
assert.equal(roundFixed("2.99", 0, "truncate"), 2);
assert.equal(roundFixed("-2.99", 0, "truncate"), -2);

assert.equal(formatFixed("1250.5", { currencyPrefix: "$" }), "$1,250.50");
assert.equal(formatFixed("12", { precision: 4 }), "12.0000");
assert.equal(formatFixed("-1234.567"), "-1,234.57");
assert.equal(
  formatFixed("1234.5", { commaSeparated: false }),
  "1234.50",
);
assert.equal(formatFixed("42", { precision: 0 }), "42");

assert.equal(addFixed("1e-2", "2e-2", 2), 0.03);
assert.equal(mulFixed("-0.1", "0.2", 3), -0.02);
assert.equal(roundFixed("0.000123", 4), 0.0001);

assert.throws(() => addFixed("abc", 1), TypeError);
assert.throws(() => roundFixed(Number.NaN), TypeError);
assert.throws(() => roundFixed(1, -1), RangeError);
assert.throws(() => roundFixed(1, 101), RangeError);
assert.throws(() => roundFixed(1, 2, "invalid" as never), RangeError);

console.log("fixed-decimal tests passed");
