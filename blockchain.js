const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

const web3 = new Web3("http://127.0.0.1:7545");

// Read ABI
const contractPath = path.resolve(__dirname, "build", "EvidenceContract.json");
const contractJSON = JSON.parse(fs.readFileSync(contractPath, "utf8"));

// Read deployed address
const addressPath = path.resolve(__dirname, "contractAddress.txt");
const contractAddress = fs.readFileSync(addressPath, "utf8").toString().trim();

// Create instance
const contract = new web3.eth.Contract(
  contractJSON.abi,
  contractAddress
);

module.exports = { web3, contract };