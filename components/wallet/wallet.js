/**
 This file is part of kaya.
  Copyright (c) 2018 - present Zilliqa Research Pvt. Ltd.
  
  kaya is free software: you can redistribute it and/or modify it under the
  terms of the GNU General Public License as published by the Free Software
  Foundation, either version 3 of the License, or (at your option) any later
  version.
 
  kaya is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
  A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 
  You should have received a copy of the GNU General Public License along with
  kaya.  If not, see <http://www.gnu.org/licenses/>.
**/

/* Wallet Component */
const assert = require('assert');
const config = require('../../config');
const {Zilliqa} = require('zilliqa-js');
const debug_wallet = require('debug')('kaya:wallet');

//@dev: As this is a kaya, private keys will be stored
// note: Real systems do not store private key

// Wallet will store three things - address, private key and balance
wallets = {};

/*  Dummy constructor for zilliqajs */
// @dev: Will be replaced once zilliqa-js exposes utils without constructors
let zilliqa = new Zilliqa({
    nodeUrl: 'http://localhost:8888'
});


function createNewWallet() {
    // let pk = zilliqa.util.generatePrivateKey();
    let pk = zilliqa.util.generatePrivateKey();
    let address = zilliqa.util.getAddressFromPrivateKey(pk);
    let privKey_string = pk.toString('hex');
    newWallet = {
        privateKey: privKey_string,
        amount: config.wallet.defaultAmt,
        nonce: config.wallet.defaultNonce
    };
    wallets[address] = newWallet;
}

module.exports = {
    createWallets: (n) => { 
        assert(n > 0);
        for(var i=0; i < n; i++){
            createNewWallet();
        }
    },

    printWallet: () => {
        if(wallets.length == 0) { 
            console.log('No wallets generated.');
        } else {
            console.log('Available Accounts');
            console.log('=============================');
            keys = [];
            for(let i = 0; i< config.wallet.numAccounts; i++) {
                var addr = Object.keys(wallets)[i];
                console.log(`(${i}) ${addr} (Amt: ${wallets[addr].amount}) (Nonce: ${wallets[addr].nonce})`);
                keys.push(wallets[addr].privateKey);
            }
            console.log('\n Private Keys ');
            console.log('=============================');
            for(let i = 0; i < config.wallet.numAccounts; i++) { 
                console.log(`(${i}) ${keys[i]}`);
            }
        }
    },

    sufficientFunds: (address, amount) => {
        // checking if an address has sufficient funds for deduction
        userBalance = module.exports.getBalance(address);
        debug_wallet(`Checking if ${address} has ${amount}`)
        if(userBalance.balance < amount) {
            debug_wallet(`Insufficient funds.`);
            return false;
        } else {
            debug_wallet(`Sufficient Funds.`)
            return true;
        }
    },

    deductFunds: (address, amount) => {
        debug_wallet(`Deducting ${amount} from ${address}`);        
        assert(module.exports.sufficientFunds(address, amount));
        // deduct funds
        let currentBalance = wallets[address].amount;
        debug_wallet(`Sender's previous Balance: ${currentBalance}`);
        currentBalance = currentBalance - amount;
        if(currentBalance < 0) { 
            throw new Error('Unexpected error, funds went below 0');
        }
        wallets[address].amount = currentBalance;
        debug_wallet(`Deduct funds complete. Sender's new balance: ${wallets[address].amount}`)
    },

    addFunds: (address, amount) => { 
        debug_wallet(`Adding ${amount} to ${address}`);        
        let currentBalance = wallets[address].amount;
        debug_wallet(`Recipient's previous Balance: ${currentBalance}`);

        // add amount
        currentBalance = currentBalance + amount;
        wallets[address].amount = currentBalance;
        debug_wallet(`Adding funds complete. Recipient's new Balance: ${wallets[address].amount}`)
    },

    increaseNonce: (address) => { 
        debug_wallet(`Increasing nonce for ${address}`)
        if(!zilliqa.util.isAddress(address)) { 
            throw new Error('Address size not appropriate')
        }
        if(!wallets[address]) { 
            // on zilliqa, default balance and nonce is 0
            // however, since im only storing wallets that have been created, i will throw error instead of increasing dummy nonce.
            throw new Error('Address not found');
        } else {
            wallets[address].nonce = wallets[address].nonce + 1;
            debug_wallet(`New nonce for ${address} : ${wallets[address].nonce}`)
        }
    },

    getBalance: (address) => { 
        if(!zilliqa.util.isAddress(address)) { 
            throw new Error('Address size not appropriate')
        }
        if(!wallets[address]) { 
            return {balance: 0, nonce: 0};
        } else {
            return {balance: wallets[address].amount,
                nonce: wallets[address].nonce}
        }
    }


}