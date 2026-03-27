# SGR-DIGI - Sistema de Garantías Recíprocas Digital

Sistema de tokenización de garantías de commodities agropecuarios sobre blockchain Stellar usando smart contracts Soroban.

## 🎯 Descripción

SGR-DIGI es una plataforma que permite tokenizar garantías de commodities (soja, trigo, maíz) como tokens en la blockchain de Stellar. Utiliza smart contracts Soroban para:

- **Tokenización**: Convertir garantías físicas en tokens digitales
- **Marketplace**: Compraventa peer-to-peer de tokens de garantía
- **Trazabilidad**: Registro inmutable de todas las operaciones

## 🏗️ Arquitectura

### Contratos Soroban (Rust)

1. **GuaranteeToken** (`contracts/guarantee-token/`)
   - Token personalizado que representa garantías
   - Funciones: mint, transfer, balance, redeem
   - Almacena metadata de commodities (tipo, peso, valor)

2. **Marketplace** (`contracts/marketplace/`)
   - Marketplace descentralizado para compraventa
   - Funciones: create_offer, buy, cancel_offer
   - Gestión de ofertas y transacciones

### Backend (NestJS + TypeScript)

- API REST para interacción con contratos Soroban
- Integración con Soroban RPC
- Gestión de operaciones y estados

### Frontend (React + TypeScript)

- Interfaz web para vendedores
- Upload de documentos y creación de garantías
- Visualización de operaciones

## 🚀 Quick Start

### Prerequisitos

- Node.js 18+
- Rust 1.94+
- Stellar CLI 22+
- npm o pnpm

### 1. Clonar Repositorio

```bash
git clone <repo-url>
cd SGR-DIGI
```

### 2. Setup Contratos Soroban

Ver instrucciones detalladas en [`contracts/README.md`](./contracts/README.md)

```bash
cd contracts

# Build contratos
stellar contract build

# Deploy en testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/guarantee_token.wasm \
  --source deployer --network testnet

# Guardar Contract IDs en .env del backend
```

### 3. Setup Backend

```bash
cd backend
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con:
# - STELLAR_RPC_URL
# - GUARANTEE_TOKEN_CONTRACT_ID
# - MARKETPLACE_CONTRACT_ID
# - STELLAR_SECRET_KEY

# Iniciar servidor
npm run start:dev
```

Backend disponible en: `http://localhost:3000`

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en: `http://localhost:5173`

## 📡 API Endpoints

### Garantías

- `POST /guarantee` - Crear nueva garantía (mint tokens)
- `GET /guarantee` - Listar todas las garantías
- `GET /guarantee/:id` - Obtener garantía específica
- `POST /guarantee/:id/retry` - Reintentar operación fallida

### Marketplace

- `POST /marketplace/offer` - Crear oferta de venta
- `GET /marketplace/offers/:guaranteeId` - Listar ofertas de una garantía
- `POST /marketplace/buy` - Comprar tokens

### Health

- `GET /stellar/health` - Estado de conexión con Soroban RPC

## 🔧 Configuración

### Variables de Entorno (Backend)

```env
# Soroban RPC
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contratos
GUARANTEE_TOKEN_CONTRACT_ID=CBXXX...
MARKETPLACE_CONTRACT_ID=CAXXX...

# Cuenta deployer
STELLAR_SECRET_KEY=SXXX...

# Gemini AI
GEMINI_API_KEY=tu_api_key

# Server
PORT=3000
```

## 📋 Flujo de Uso

### Crear Garantía

1. Vendedor sube documentación del commodity
2. Sistema procesa con IA (validación)
3. Backend invoca contrato `GuaranteeToken.mint()`
4. Se generan tokens vinculados a la garantía
5. Transacción confirmada en blockchain

### Vender Tokens

1. Holder crea oferta en marketplace
2. Define precio y cantidad
3. Contrato `Marketplace.create_sell_offer()`
4. Oferta disponible públicamente

### Comprar Tokens

1. Comprador consulta ofertas disponibles
2. Selecciona oferta y cantidad
3. Contrato `Marketplace.buy()`
4. Tokens transferidos al comprador

## 🧪 Testing

### Contratos

```bash
cd contracts
cargo test
```

### Backend

```bash
cd backend
npm run test
```

## 📦 Stack Tecnológico

- **Blockchain**: Stellar (Soroban smart contracts)
- **Contratos**: Rust + Soroban SDK
- **Backend**: NestJS + TypeScript
- **Frontend**: React + TypeScript + Vite
- **IA**: Google Gemini API
- **Testing**: Jest + Cargo Test

## 🔗 Links Útiles

- [Stellar Docs](https://developers.stellar.org/)
- [Soroban Docs](https://soroban.stellar.org/)
- [Stellar Explorer (Testnet)](https://stellar.expert/explorer/testnet)
- [Soroban RPC](https://soroban-testnet.stellar.org/)

## 📄 Licencia

MIT

## 👥 Equipo

Proyecto desarrollado para hackathon Stellar
