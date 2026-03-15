const path = require('path');
const fs = require('fs');
const Web3 = require('web3');

const buildPath = path.resolve(__dirname, 'build', 'EvidenceContract.json');
const contractFile = JSON.parse(fs.readFileSync(buildPath, 'utf8'));

const web3 = new Web3('http://127.0.0.1:7545');

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log("Deploying from account:", accounts[0]);

    const result = await new web3.eth.Contract(contractFile.abi)
    .deploy({
        data: "0x" + contractFile.evm.bytecode.object
    })
    .send({
        from: accounts[0],
        gas: '5000000'
    });

    console.log("====================================");
    console.log("✅ CONTRACT DEPLOYED SUCCESSFULLY");
    console.log("Contract Address:", result.options.address);
    console.log("====================================");

    fs.writeFileSync(
        path.resolve(__dirname, 'contractAddress.txt'),
        result.options.address
    );
};

deploy();