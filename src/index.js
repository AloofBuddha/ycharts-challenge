const fs = require("fs");

const input = fs.readFileSync("recon.in", "utf8");

const [d0POS, d1TRN, d1POS] = parse(toLines(input));

// calculated positions starts with d0POS values
const calculatedPOS = Object.assign({}, d0POS);

// apply the list of transactions to calculatedPOS
d1TRN.forEach(transaction => {
  // set previously unseen symbols to a default of 0
  calculatedPOS[transaction.symbol] = calculatedPOS[transaction.symbol] || 0;
  switch (transaction.action) {
    case "SELL":
      calculatedPOS[transaction.symbol] -= Number(transaction.shares);
      calculatedPOS["Cash"] += Number(transaction.price);
      break;
    case "BUY":
      calculatedPOS[transaction.symbol] += Number(transaction.shares);
      calculatedPOS["Cash"] -= Number(transaction.price);
      break;
    case "DEPOSIT":
    case "DIVIDEND":
      calculatedPOS["Cash"] += Number(transaction.price);
      break;
    case "FEE":
      calculatedPOS["Cash"] -= Number(transaction.price);
      break;
    default:
      throw new Error("Unsupported Case");
  }
});

cleanUp(calculatedPOS);

const calculatedDiff = {};

// get all possible keys from union of actual and calculated
const allKeys = getSetofKeys(d1POS, calculatedPOS);

for (let symbol of allKeys) {
  const actual = d1POS[symbol] || 0;
  const calculated = calculatedPOS[symbol] || 0;

  calculatedDiff[symbol] = actual - calculated;
}

cleanUp(calculatedDiff);

const output = toReconOutText(calculatedDiff);

fs.writeFileSync("recon.out", output);

// toLines :: String -> [String]
// toLines splits on \n and filters out empty strings
function toLines(text) {
  return text.split("\r\n").filter(str => str.length > 0);
}

// parse :: [String] -> [{String: Number}, [Transactions], {String: Number}]
function parse(lines) {
  const d0POS_index = lines.indexOf("D0-POS");
  const D1TRN_index = lines.indexOf("D1-TRN");
  const D1POS_index = lines.indexOf("D1-POS");
  const d0POS_lines = lines.slice(d0POS_index + 1, D1TRN_index);
  const d1TRN_lines = lines.slice(D1TRN_index + 1, D1POS_index);
  const d1POS_lines = lines.slice(D1POS_index + 1);

  const d0POS = parsePOS(d0POS_lines);
  const d1TRN = parseTRN(d1TRN_lines);
  const d1POS = parsePOS(d1POS_lines);

  return [d0POS, d1TRN, d1POS];
}

// parsePOS :: [String] -> {String: Number}
function parsePOS(lines) {
  const positions = {};

  lines.forEach(line => {
    const [symbol, price] = line.split(" ");
    positions[symbol] = Number(price);
  });

  return positions;
}

// parseTRN :: [String] -> [Actions]
function parseTRN(lines) {
  const transactions = [];

  lines.forEach(line => {
    const [symbol, action, shares, price] = line.split(" ");
    transactions.push({ symbol, action, shares, price });
  });

  return transactions;
}

// removes any 0-valued key-value pairs from the object
function cleanUp(object) {
  for (let key of Object.keys(object)) {
    if (object[key] === 0) {
      delete object[key];
    }
  }
}

// [Object] -> Set<String>
function getSetofKeys(...objects) {
  const allKeys = new Set();

  objects.forEach(object => {
    const keys = Object.keys(object);
    keys.forEach(key => allKeys.add(key));
  });

  return allKeys;
}

// {String: Number} -> String
function toReconOutText(calculatedDiff) {
  let reconOutText = "";

  for (let [symbol, value] of Object.entries(calculatedDiff)) {
    reconOutText += `${symbol} ${value}\n`;
  }

  return reconOutText;
}
