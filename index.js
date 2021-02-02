const Express = require("express");
const cors = require ("cors");
const Server = Express();
const fn = require('./src/functions');

Server.use(cors());
Server.use(Express.json());
const port = process.env.port || 3000

Server.post("/estimate", (request, response) => {
    //console.log(request);
    //Successful 200
    let data = fn.getPairs()
    console.log(data)
    response.status(200);
    response.json(data);
});

Server.post("/swap", (request, response) => {
    console.log(request);
    //Successful 200
    response.status(200);
    response.json('OK');
});

Server.listen(port, () => {
    console.log(`Listen at port: http://localhost:${port}`);
})