const axios = require ("axios");
const crypto = require('crypto');
const config = require("../config.json")
const cred = require("../credentials.json")

function hashString(hashIn){
    //Hasheo
    let hashOut = crypto.createHash('md5').update(hashIn).digest('hex');
    return hashOut
}

function basicRequest(url, mode, data, config){
    //Request basico
    return new Promise((resolve, reject) => {
        data = (data) ? data : {};
        config = (config) ? config : {};

        if (mode == 'GET'){
            //GET
            axios.get(url)
            .then(function (response) {
                // handle success
                resolve(response);
            })
            .catch(function (error) {
                // handle error
                reject(error);
            });
        }else{
            //POST  
            axios.post(url, data, config)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                reject(error);
            });
        }
    });
}

function getPairs(){
    return new Promise((resolve, reject) => {
        //Busca todos los pares de kraken
        let url = "https://api.kraken.com/0/public/AssetPairs"
        basicRequest(url,"GET").then((res) => {
            //console.log(res)
            resolve(res.data.result);
        });
    })
}

function executeOperation(pair,type,orderType,volume){
    //Ejecuta una orden directamente
    return new Promise((resolve, reject) => {
        let url = "https://api.kraken.com/0/private/AddOrder"
        let config = {
            headers: {
                "API-Key": cred.APIKEY,
                "API-Sign": value
            }
        }
        let data = {
            pair: pair,
            type: type,
            ordertype: orderType,
            volume: volume
        }
        basicRequest(url, "POST", data, config).then((res) => {
            resolve(res);
        });
    });
}

function getPrice(pair, typeOp){
    //Busco la cotizacion del par en cuestión
    return new Promise((resolve, reject) => {
        //Busca todos los pares de kraken
        let url = `https://api.kraken.com/0/public/Ticker?pair=${pair}`
        basicRequest(url,"GET").then((res) => {
            if(typeOp == 'BUY'){
                //BUY PRICE
                resolve()
            }else{
                //SELL PRICE
                resolve(res.data.result);
            }
        });
    })
}

function applyFeeNSpread(price){
    //Aplica el fee y spread al precio
    price = Number(price);
    let fee = ( price * config.FEE ) / 100;
    let spread = ( price * config.SPREAD ) / 100;
    return price + fee + spread
}

function checkPair(assetA, assetB, typeOp){
    //Chequea si existe el par buscado, sino lo rutea
    assetA = assetA.toLower();
    assetB = assetB.toLower();
    let foundPair;
    let assetsList = getPairs();

    //Itera sobre todos los pares hasta encontrar un match
    for (let i = 0; i < assetsList.length; i++) {
        const element = assetsList[i];
        const pairName = element.wsname.toLower();
        if (pairName.contains(assetA) && pairName.contains(assetB)) {
            foundPair = element;
            break
        }
    }

    if (foundPair){
        //Encontro el par directo
        let estimation = {
            "typeOp": typeOp,
            "pair": foundPair.altname,
            "price": 
        }
    }else{
        //No lo encontro, hay que rutear

    }
}

function checkHash(vars, hashIn){
    //Chequeo que lo recibido sea legitimo mediante un hash
    let parmVars = vars.trim()+config.SECRET.trim();
    let hashOut = hashString(parmVars);
    if (hashIn === hashOut){
        console.log('Correct hash!');
        return true
    }else{
        console.log('Incorrect hash!');
        return false
    }
}

function estimate(pair, volume, typeOp){
    //Estimacion
    let col = pair.split("<>");
    let assetA = col[0];
    let assetB = col[1];

    checkPair(assetA, assetB, typeOp);
}

module.exports = {
    getPairs: getPairs,
    estimate: estimate,
};