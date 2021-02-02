const axios = require ("axios");

function basicRequest(url, mode, data){
    //Request basico
    return new Promise((resolve, reject) => {
        mode = mode.toLower();
        data = (data) ? data : {};
        axios({
            method: mode,
            url: url,
            data: data
        })
        .then((response) => {
            resolve(response);
        })
        .catch(err => reject(err));
    })
}

async function getPairs(){
    //Busca todos los pares de kraken
    let url = "https://api.kraken.com/0/public/AssetPairs"
    let res = await basicRequest(url,"GET");
    res = JSON.parse(res);
    return res.result;
}

function checkPair(assetA, assetB){
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

    }else{
        //No lo encontro, hay que rutear

    }
}

module.exports = {
    getPairs: getPairs,
};