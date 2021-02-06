const axios = require ("axios");
const crypto = require('crypto');
const config = require("../config.json")
const cred = require("../credentials.json")

function hashString(hashIn){
    //Hasheo
    let hashOut = crypto.createHash('md5').update(hashIn).digest('hex');
    return hashOut
}

function getCurrentUnixTime(){
    //Busco la hora actual the unix, seconds
    let ts = Math.round((new Date()).getTime() / 1000);
    return ts
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

function executeOperation(pair,type,volume){
    //Ejecuta una orden directamente
    // return new Promise((resolve, reject) => {
    //     let url = "https://api.kraken.com/0/private/AddOrder"
    //     let config = {
    //         headers: {
    //             "API-Key": cred.APIKEY,
    //             "API-Sign": value
    //         }
    //     }
    //     let data = {
    //         pair: pair,
    //         type: type,
    //         ordertype: orderType,
    //         volume: volume
    //     }
    //     basicRequest(url, "POST", data, config).then((res) => {
    //         resolve(res);
    //     });
    // });

    return `Executed ${type} on ${pair}, volume: ${volume}`
}

function getPrice(pair, typeOp){
    //Busco la cotizacion del par en cuestión
    return new Promise((resolve, reject) => {
        //Busca todos los pares de kraken
        let url = `https://api.kraken.com/0/public/Ticker?pair=${pair}`
        basicRequest(url,"GET").then((res) => {
            let obj;
            let response = res.data.result;
            for (const key in response) {
                if (Object.hasOwnProperty.call(response, key)) {
                    obj = response[key];
                    break
                }
            }

            if(typeOp == 'BUY'){
                //BUY PRICE
                resolve(obj.a[0])
            }else{
                //SELL PRICE
                resolve(obj.b[0]);
            }
        });
    })
}

function route(assetA, assetB, assetsList){
    //Rutea las ordenes que no pueden ser compradas de manera directa
    assetA = assetA.toUpperCase()
    assetB = assetB.toUpperCase()
    //typeOp = typeOp.toUpperCase()

    function searchCompPair(asset){
        //Busco par compatible
        for (const key in assetsList) {
            if (Object.hasOwnProperty.call(assetsList, key)) {
                obj = assetsList[key];
                const pairName = obj.altname.toUpperCase();
                if (pairName.includes(asset) && (obj.quote == asset || obj.base == asset)) {
                    return obj
                }
            }
        }
    }

    function recursiveSearch(assetX, assetToSell, assetToBuy,  pairRouting, assetsListAux){
        //console.log(pairRouting);
        console.log(Object.keys(assetsListAux).length);
        if (pairRouting.length !== 0 && pairRouting[0].includes(assetToSell) && pairRouting[-1].includes(assetToBuy) ){
            return pairRouting
        }else{
            let asset;
            if (pairRouting.length !== 0){
                asset = assetToSell;
            }else{
                asset = assetX;
            }

            let ret = searchCompPair(asset)
            pairRouting.push(ret.altname);
            let prop = ret.altname
            delete assetsListAux[prop] //quitar de lista
            ret = ret.altname.replace(asset,"");
            recursiveSearch(ret, assetToSell, assetToBuy,  pairRouting, assetsListAux);
        }
    }

    let list = recursiveSearch('', assetA, assetB, [], assetsList);
    console.log('list',list)
}

function applyFeeNSpread(price, typeOp){
    //Aplica el fee y spread al precio
    typeOp = typeOp.toUpperCase();
    let configSpread = (typeOp == 'BUY') ? config.SPREAD : config.SPREAD * (-1);

    price = Number(price);
    let fee = ( price * config.FEE ) / 100;
    let spread = ( price * configSpread ) / 100;
    return price + spread + fee
}

async function checkPair(assetA, assetB, volume, typeOp){
    //Chequea si existe el par buscado, sino lo rutea
    assetA = assetA.toUpperCase()
    assetB = assetB.toUpperCase()
    let foundPair;
    let estimation;
    let assetsList = await getPairs();
    
    //Itera sobre todos los pares hasta encontrar un match    
    for (const key in assetsList) {
        if (Object.hasOwnProperty.call(assetsList, key)) {
            try {
                obj = assetsList[key];
                //console.log(obj)
                const pairName = obj.altname.toUpperCase();
                if (pairName.includes(assetA) && pairName.includes(assetB)) {
                    foundPair = obj;
                    break
                }
            } catch (error) {
                console.log('err',error)
            }
        }
    }

    if (foundPair){
        //Encontro el par directo
        let price = await getPrice(foundPair.altname, typeOp);
        price = price * volume;
        //console.log(price)
        estimation = {
            "typeOp": typeOp,
            "pair": foundPair.altname,
            "price": applyFeeNSpread(price,typeOp),
            "volume": volume,
            "routed": false,
            "timelock": getCurrentUnixTime() + config.TIMELOCK,
        }
    }else{
        //No lo encontro, hay que rutear

        route(assetA, assetB, assetsList);

        estimation = {
            "routedObj":"obj"
        }
    }

    estimation = Object.assign(estimation, { "checksum": genChecksum(estimation) });
    return estimation
}

function genChecksum(estimation){
    //Genero el checksum a partir de los atributos y el secret
    let str = '';
    for (const key in estimation) {
        if (Object.hasOwnProperty.call(estimation, key)) {
            obj = estimation[key];
            str += obj;
        }
    }
    str += config.SECRET;
    let hashed = hashString(str);
    return hashed;
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
    //Realiza la estimacion
    let col = pair.split("<>");
    let assetA = col[0];
    let assetB = col[1];

    let estimation = checkPair(assetA, assetB, volume, typeOp);
    return estimation;
}

function swap(returnedEstimation){
    //Realiza el swap mediante el objeto estimacion
    if(returnedEstimation.timelock > getCurrentUnixTime()){
        //Dentro del timelock
        //Guardo todos los atributos del objeto
        let str = '';
        for (const key in returnedEstimation) {
            if (Object.hasOwnProperty.call(returnedEstimation, key)) {
                atr = returnedEstimation[key];
                if (atr !== 'checksum') {
                    str += atr;
                }
            }
        }

        if(checkHash(str, returnedEstimation.checksum)){
            //El hash es correcto, ejecuto la compra
            let ret = executeOperation(returnedEstimation.pair, returnedEstimation.typeOp, returnedEstimation.volume);
            return ret
        }else{
            //El hash no es correcto
            return `Hash incorrect, modified content`
        }
    }else{
        //Fuera del timelock, EXPIRO
        return `Order expired`
    }
}

module.exports = {
    estimate: estimate,
    swap: swap,
};