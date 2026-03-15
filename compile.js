const path = require('path');
const fs = require('fs');
const solc = require('solc');

// contract ka correct path
const contractPath = path.join(__dirname, 'contracts', 'EvidenceContract.sol');

// file read
const source = fs.readFileSync(contractPath, 'utf8');

// solidity compiler input
const input = {
  language: 'Solidity',
  sources: {
    'EvidenceContract.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

// compile
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// errors check
if (output.errors) {
  console.log(output.errors);
}

// build folder banana
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  fs.mkdirSync(buildPath);
}

// contract extract
const contract = output.contracts['EvidenceContract.sol']['EvidenceContract'];

// save JSON
fs.writeFileSync(
  path.join(buildPath, 'EvidenceContract.json'),
  JSON.stringify(contract, null, 2)
);

console.log("✅ Contract compiled successfully!");
