/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because an array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
        
            
            console.log("_addBlock block height "+block.height);
            block.time = new Date().getTime().toString().slice(0,-3);   
            block.height = self.chain.length;
            console.log("block height "+block.height);
            
            
            if (self.chain.length >0 ){
                block.previousBlockHash = self.chain[self.chain.length-1].hash;
            }
            
            block.hash =  SHA256(JSON.stringify(block)).toString();
            
            /**if (block){ //is this how to check for error?
                resolve(self.chain.push(block));
            }else{
                reject(Error('Error adding block'));
            }**/
            
            
            self.height = self.height + 1;
            console.log("self.height "+self.height);
            self.chain.push(block); //note chain length is 1 more than self.height
      
            resolve(block)
           
        }).catch(function(error){
            console.log("error in _addBlock(block)"); 
            reject(error);
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            let msg = `${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`;
            resolve(msg)
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let sent_time = parseInt(message.split(':')[1]);
            let curr_time = parseInt(new Date().getTime().toString().slice(0, -3));
            
            let minutes_laps = (curr_time - sent_time)/60;
            
            console.log('minutes lapsed ', minutes_laps);
            console.log('address ', address);
            console.log('signature ', signature);
            console.log('message ', message);
            console.log('star ', star);
            
            if (minutes_laps < 5){
                let ver = bitcoinMessage.verify(message, address, signature);
                console.log("verify ", ver);
                if (ver){
                    let newBlock =self._addBlock(new BlockClass.Block({address, signature, message, star}));
                    resolve(newBlock);
                }else{
                    let err_msg  = "Error submitting star: message verification failed.";
                    console.log(err_msg)
                    reject(null);
                }
            }else{
                let err_msg ='Error submitting star:  time lapsed more than 5 minutes.';
                console.log(err_msg)
                reject(null)
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(b => b.hash === hash)[0];
            if (block){
                resolve(block);
            }else{
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        console.log("get stars for address: "+address)
        let self = this;
        let stars = [];
        return new Promise(async (resolve, reject) => {
            let chainlen = await self.getChainHeight();//self.chain.length; //
            console.log("self.getChainHeight() :"+chainlen);
            console.log("self.chain.length     :"+ self.chain.length)
            

            for (let i =1; i<=chainlen; i++){ //skip genesis block
                let body = self.chain[i].body;
                
                console.log("block body: "+body)
                
                let decode_body = JSON.parse(hex2ascii(body));
                console.log("block body decoded : "+decode_body)
                
                let thisadd = decode_body.address;
                console.log("this block belong to wallet address: " +thisadd);
                if (thisadd == address){
                    console.log("body.star: " +decode_body.star);
                    stars.push({address:thisadd, star: decode_body.star});
                }
                
                
            }
     
            
            resolve(stars);
            
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validate`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            let chainlen = await self.getChainHeight();
            console.log("validateChain() chain length : "+chainlen);
            for (let i = 0; i <= chainlen; i++){
                
                let blocki = self.chain[i]
                let blocki_valid = await blocki.validate();
                console.log("validating block "+ i + " validate "+blocki_valid);
                
                
                if (i == chainlen) { 
                    
                    if (!blocki_valid === true){
                        console.log("last block "+i+" is not valid");
                        errorLog.push(i);
                    }
                    break;
                }
                
                let blockHash = self.chain[i].hash
                let prevHash = self.chain[i+1].previousBlockHash
                
                console.log("blockHash "+blockHash);
                console.log("prevHash  "+prevHash);
                if (!blocki_valid ===true || blockHash !== prevHash){
                    console.log("block "+i +" is not valid");
                    errorLog.push(i)
                }
        
                
            
            }//end for
            if (errorLog.length == 0){
                resolve(true);
            }
            else{
                resolve(errorLog); //resolve with the list of errors
            }
        });
    }

}

module.exports.Blockchain = Blockchain;   
