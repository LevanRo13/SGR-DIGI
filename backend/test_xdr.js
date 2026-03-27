const { nativeToScVal } = require('@stellar/stellar-sdk');
try {
  nativeToScVal(1.5, { type: 'u64' });
  console.log("1.5 worked");
} catch(e) { console.log("1.5 failed", e.message); }

try {
  nativeToScVal(100, { type: 'u64' });
  console.log("100 worked");
} catch(e) { console.log("100 failed", e.message); }
