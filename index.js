require('dotenv').config();
const { Web3 } = require('web3');
const { Console } = require("console");
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Initialize Web3 with Infura
let web3;
try {
    web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_API_URL));
    console.log('Web3 initialized successfully');
} catch (error) {
    console.error('Error initializing Web3:', error);
}

// Add this line to parse JSON requests
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World 😎");
});

const logger = (req, res, next) => {
    console.log(`
        method: ${req.method} 
        url: ${req.url} 
        Date: ${new Date().toISOString()}`);
    next();
  };
  
  app.use(logger);
  

app.get("/test", (req, res) => {
    res.send(`
      <script>
        console.log("Console is working");
      </script>
      ${JSON.stringify({ MessageInJSON: "Hello World 😎" })}
    `);
  });

app.get("/greeting/:name", (req, res) => {
  res.send(`Hello ${req.params.name.charAt(0).toLocaleUpperCase() + req.params.name.slice(1).toLocaleLowerCase()} ��`);
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Home.html"));
});

app.post("/process-contract", async (req, res) => {
    try {
        const { address, abi, noAbi } = req.body;
        
        // Validate address format
        if (!address || !address.match(/^0x[0-9a-fA-F]{40}$/)) {
            return res.status(400).json({ 
                error: 'Invalid Ethereum address format' 
            });
        }

        // Get basic information for wallet/contract
        const balance = await web3.eth.getBalance(address);
        const code = await web3.eth.getCode(address);
        const isContract = code !== '0x' && code !== '0x0';

        let addressInfo = {
            address: address,
            balance: balance.toString(),
            isContract: isContract,
            type: isContract ? 'Smart Contract' : 'Wallet Address',
            creationInfo: {}
        };

        if (isContract) {
            try {
                // Retrieve the latest block number as a number
                const latestBlock = Number(await web3.eth.getBlockNumber());
                const maxBlockCheck = 200; // Adjust if needed
                let creationTx = null;
                
                // Search for the creation transaction
                for (let i = 0; i < maxBlockCheck; i++) {
                    const blockToCheck = latestBlock - i;
                    let txs;
                    
                    try {
                        txs = await web3.eth.getBlock(blockToCheck, true);
                    } catch (err) {
                        // If rate limited, wait and retry this block
                        if (err && err.cause && err.cause.code === 429) {
                            console.log(`Rate limited while checking block ${blockToCheck}. Pausing for a couple of seconds...`);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            i--; // Retry same block
                            continue;
                        } else {
                            throw err;
                        }
                    }
                    
                    if (txs && txs.transactions) {
                        const foundTx = txs.transactions.find(tx => 
                            tx.to === null &&
                            tx.creates && 
                            tx.creates.toLowerCase() === address.toLowerCase()
                        );
                        if (foundTx) {
                            creationTx = foundTx;
                            break;
                        }
                    }
                }
                
                if (creationTx) {
                    // Get the block to fetch the accurate timestamp
                    const txBlock = await web3.eth.getBlock(creationTx.blockNumber);
                    const timestamp = Number(txBlock.timestamp);
                    addressInfo.creationInfo = {
                        creator: creationTx.from,
                        creationDate: new Date(timestamp * 1000).toISOString(),
                        creationTxHash: creationTx.hash
                    };

                    // Retrieve the transaction receipt to calculate the gas fee
                    try {
                        const receipt = await web3.eth.getTransactionReceipt(creationTx.hash);
                        if (receipt) {
                            // Ensure we work with BigInt for correct multiplication
                            const gasUsed = BigInt(receipt.gasUsed);
                            const gasPrice = BigInt(receipt.effectiveGasPrice || creationTx.gasPrice);
                            const gasFeeWei = gasUsed * gasPrice;
                            const gasFeeEth = web3.utils.fromWei(gasFeeWei.toString(), 'ether');
                            addressInfo.creationInfo.gasFee = gasFeeEth + ' ETH';
                            addressInfo.creationInfo.gasUsed = receipt.gasUsed;
                            addressInfo.creationInfo.gasPrice = receipt.effectiveGasPrice ? receipt.effectiveGasPrice : creationTx.gasPrice;
                        }
                    } catch (feeError) {
                        console.log('Error fetching gas fee info:', feeError);
                        addressInfo.creationInfo.gasFeeError = "Could not fetch gas fee info";
                    }
                } else {
                    addressInfo.creationInfo = {
                        note: `Creation transaction not found in the last ${maxBlockCheck} blocks.`
                    };
                }
            } catch (error) {
                console.log('Error fetching creation info:', error);
                addressInfo.creationInfo = {
                    error: 'Could not fetch creation information due to rate limiting or scanning range exceeded.'
                };
            }

            // Contract-specific information
            addressInfo.contractInfo = {
                bytecodeSize: (code.length - 2) / 2, // Remove '0x' and convert to bytes
                implementation: null, // For proxy contracts
                isProxy: false,
                verified: false // This would require Etherscan API
            };

            // Check if it's a proxy contract
            try {
                const implementationSlot = await web3.eth.getStorageAt(
                    address, 
                    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
                );
                if (implementationSlot !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    addressInfo.contractInfo.isProxy = true;
                    addressInfo.contractInfo.implementation = '0x' + implementationSlot.slice(-40);
                }
            } catch (error) {
                console.log('Error checking proxy status:', error);
            }

            // If it's an ERC20/721 token contract
            if (!noAbi) {
                try {
                    // Minimal ERC20 ABI for basic checks
                    const minimalABI = [
                        { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
                        { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
                        { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
                        { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }
                    ];

                    const contract = new web3.eth.Contract(minimalABI, address);
                    addressInfo.tokenInfo = {};

                    // Try to get token information
                    try {
                        addressInfo.tokenInfo.name = await contract.methods.name().call();
                        addressInfo.tokenInfo.symbol = await contract.methods.symbol().call();
                        addressInfo.tokenInfo.decimals = await contract.methods.decimals().call();
                        addressInfo.tokenInfo.totalSupply = (await contract.methods.totalSupply().call()).toString();
                        addressInfo.tokenInfo.type = 'ERC20';
                    } catch (error) {
                        addressInfo.tokenInfo.type = 'Unknown';
                    }
                } catch (error) {
                    console.log('Error fetching token info:', error);
                }
            }
        } else {
            // For wallet addresses, creation info is not applicable
            addressInfo.creationInfo = {
                note: 'Not applicable for wallet addresses.'
            };
            
            // Wallet-specific information
            addressInfo.walletInfo = {
                lastTransactionBlock: null,
                transactionCount: await web3.eth.getTransactionCount(address)
            };
        }

        // Before returning the response, sanitize any BigInt values
        const sanitizeBigInt = (obj) => {
            return JSON.parse(JSON.stringify(obj, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));
        };

        console.log('\nProcessed address information:', JSON.stringify(sanitizeBigInt(addressInfo), null, 2));
        res.status(200).json(sanitizeBigInt(addressInfo));
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred while processing the request' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
