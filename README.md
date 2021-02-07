### **Smart order router**

##### *Como usar:* 

- Para estimar una compra o venta:

Para estimar una operacion se debe usar el endpoint [http://localhost:3000/estimate](http://localhost:3000/estimate), mediante POST, y enviando en el body los datos con la siguiente estructura:

```json
{
    "typeOp": "sell",
    "pair": "USDC/AAVE",
    "volume":10000
}
```

Eso devuelve unos datos similares a estos:

```json
{
    "typeOp": "SELL",
    "pair": "USDC/AAVE",
    "price": 4287953.161799999,
    "volume": 10000,
    "routed": true,
    "timelock": 1612720101,
    "checksum": "88bb3084b103068fc4dde2d3b620707c"
}
```

- Para ejecutar una compra o venta:

Para ejecutar la correspondiente operación se debe usar el endpoint [http://localhost:3000/swap](http://localhost:3000/swap), mediante POST, y enviando en el body exactamente los mismos datos recibidos en la estimación (si los datos son distintos, no coincidirá el checksum y la operación será rechazada).

##### *Lo que faltaria implementar:* 

- A la hora de hacer el desarrollo no vi la necesidad de usar bases de datos, pero para escalar mas el desarrollo quizás si sea necesario.
- Implementación de JWT para autenticación en la llamada de los endpoints para darle mas seguridad al sistema.
- Testing y pruebas para evitar ataques.



