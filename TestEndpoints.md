# Pruebas de Endpoints (Fase 2 y 3)

Aquí tienes los _payloads_ (cuerpos de la petición JSON) que requieren nuestros nuevos endpoints creados para conectarnos a los contratos inteligentes de Soroban. Puedes importarlos en Postman, Insomnia o ejecutarlos usando `curl`/Fetch en consola.

## 1. Crear Garantía (`POST /guarantee`)

Este endpoint recibe la validación final del operador e imprime el "aval" en la red de pruebas de Stellar (Te retorna un ID y un txHash).

**URL:** `http://localhost:3000/guarantee`

```json
{
  "tipo": "PAGARE",
  "cantidad": 1,
  "valor": 1500000,
  "aval": 1500000,
  "operatorConfirmed": true
}
```

*Nota:* Si `"operatorConfirmed": false`, el backend validará y rechazará la petición.

---

## 2. Crear Oferta de Venta en el Marketplace (`POST /marketplace/offer`)

Una vez que tengas al menos una Garantía creada (puedes verificar en el JSON `operations.json` en local), obtendrás un `guaranteeId` (ej. `1`, `2`, `3`). Con esto puedes vender fragmentos (tokens).

**URL:** `http://localhost:3000/marketplace/offer`

```json
{
  "guaranteeId": 1,
  "amount": 500,
  "pricePerToken": 15.5
}
```
* **guaranteeId**: Número interno de la garantía que vas a minitear.
* **amount**: Cantidad de "tokens/fracciones" que deseas listar en el mercado.
* **pricePerToken**: Precio en `$XLM` por cada token.

---

## 3. Listar Ofertas de Venta (`GET /marketplace/offers/:id`)

Una vez listados los tokens con el endpoint anterior, puedes verificar el estado y los IDs de las ofertas pasándole el ID de la garantía en la URL. 

**URL:** `http://localhost:3000/marketplace/offers/1`

Retorna algo similar a:
```json
{
  "success": true,
  "data": [
    {
      "offerId": "1",
      "seller": "GDY6V5EK46DVGGHRI4S2BQZ55DZBQPQIEZBAE2WIQWIIIAV6OU34H4MO",
      "amount": "5000000000",
      "price": "155000000"
    }
  ]
}
```

---

## 4. Comprar Tokens/Fracciones (`POST /marketplace/buy`)

Luego de listar en el endpoint anterior, tendrás el ID interno de la oferta de venta en el Smart Contract (`offerId`), por ejemplo `"1"`.

**URL:** `http://localhost:3000/marketplace/buy`

```json
{
  "offerId": 1,
  "amount": 100
}
```
* **offerId**: El id de la oferta arrojado por el contrato `Marketplace`.
* **amount**: Cantidad de fracciones concretas que deseas comprarle a ese Offer.
