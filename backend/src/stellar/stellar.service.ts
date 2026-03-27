import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { rpc, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  OperationsRepository,
  Operation,
  OperationStatus,
} from './operations.repository';
import { CreateGuaranteeDto } from './dto/create-guarantee.dto';

interface StellarError {
  response?: {
    data?: {
      extras?: {
        result_codes?: Record<string, unknown>;
      };
    };
  };
  message?: string;
}

@Injectable()
export class StellarService implements OnModuleInit {
  private readonly logger = new Logger(StellarService.name);
  private server: rpc.Server;
  private keypair: StellarSdk.Keypair;
  private networkPassphrase: string;
  private readonly keyFilePath: string;
  private guaranteeTokenContract: StellarSdk.Contract;
  private marketplaceContract: StellarSdk.Contract;
  private guaranteeTokenContractId: string;
  private marketplaceContractId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly operationsRepository: OperationsRepository,
  ) {
    this.keyFilePath = path.join(process.cwd(), 'data', 'stellar-keypair.json');
  }

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const rpcUrl =
      this.configService.get<string>('STELLAR_RPC_URL') ||
      'https://soroban-testnet.stellar.org';

    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      StellarSdk.Networks.TESTNET;

    this.server = new rpc.Server(rpcUrl);

    // Get contract IDs from environment
    this.guaranteeTokenContractId =
      this.configService.get<string>('GUARANTEE_TOKEN_CONTRACT_ID') || '';
    this.marketplaceContractId =
      this.configService.get<string>('MARKETPLACE_CONTRACT_ID') || '';

    if (!this.guaranteeTokenContractId || !this.marketplaceContractId) {
      this.logger.warn(
        'Contract IDs not configured. Please deploy contracts and update .env',
      );
    } else {
      this.guaranteeTokenContract = new StellarSdk.Contract(
        this.guaranteeTokenContractId,
      );
      this.marketplaceContract = new StellarSdk.Contract(
        this.marketplaceContractId,
      );
    }

    const secretKey = this.configService.get<string>('STELLAR_SECRET_KEY');

    if (secretKey && secretKey !== 'tu_secret_key_stellar') {
      this.keypair = StellarSdk.Keypair.fromSecret(secretKey);
      this.logger.log(
        `Cuenta Stellar cargada desde .env: ${this.keypair.publicKey()}`,
      );
    } else {
      await this.loadOrCreateKeypair();
    }
  }

  private async loadOrCreateKeypair(): Promise<void> {
    if (fs.existsSync(this.keyFilePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.keyFilePath, 'utf-8'));
        this.keypair = StellarSdk.Keypair.fromSecret(data.secretKey);
        this.logger.log(
          `Keypair cargado desde archivo: ${this.keypair.publicKey()}`,
        );
        return;
      } catch (error) {
        this.logger.warn(`Error cargando keypair desde archivo: ${error}`);
      }
    }

    this.keypair = StellarSdk.Keypair.random();
    this.logger.log(`Nuevo keypair generado: ${this.keypair.publicKey()}`);

    await this.fundWithFriendbot();

    const dir = path.dirname(this.keyFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      this.keyFilePath,
      JSON.stringify(
        {
          publicKey: this.keypair.publicKey(),
          secretKey: this.keypair.secret(),
        },
        null,
        2,
      ),
      'utf-8',
    );
    this.logger.log('Keypair guardado en archivo para persistencia');
  }

  private async fundWithFriendbot(): Promise<void> {
    try {
      this.logger.log('Fondeando cuenta con Friendbot...');
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(this.keypair.publicKey())}`,
      );
      if (response.ok) {
        this.logger.log('Cuenta fondeada exitosamente con Friendbot');
      } else {
        throw new Error(`Friendbot respondió con status ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Error fondeando con Friendbot: ${error}`);
      throw new Error(
        'No se pudo fondear la cuenta con Friendbot. Verifica la conectividad.',
      );
    }
  }

  async checkHealth(): Promise<{
    online: boolean;
    network: string;
    rpcUrl: string;
    publicKey: string;
    contractsConfigured: boolean;
  }> {
    try {
      await this.server.getHealth();
      return {
        online: true,
        network: 'Stellar Testnet (Soroban)',
        rpcUrl:
          this.configService.get<string>('STELLAR_RPC_URL') ||
          'https://soroban-testnet.stellar.org',
        publicKey: this.keypair.publicKey(),
        contractsConfigured: !!(
          this.guaranteeTokenContractId && this.marketplaceContractId
        ),
      };
    } catch {
      return {
        online: false,
        network: 'Stellar Testnet (Soroban)',
        rpcUrl:
          this.configService.get<string>('STELLAR_RPC_URL') ||
          'https://soroban-testnet.stellar.org',
        publicKey: this.keypair?.publicKey() || 'N/A',
        contractsConfigured: !!(
          this.guaranteeTokenContractId && this.marketplaceContractId
        ),
      };
    }
  }

  async createGuarantee(dto: CreateGuaranteeDto): Promise<Operation> {
    if (!this.guaranteeTokenContract) {
      throw new Error(
        'GuaranteeToken contract not configured. Please deploy contract and update .env',
      );
    }

    const operationId = this.operationsRepository.generateId();
    const guaranteeId = Date.now(); // Use timestamp as guarantee ID

    const operation: Operation = {
      id: operationId,
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      valor: dto.valor,
      aval: dto.aval,
      estado: 'pending',
      timestamp: new Date().toISOString(),
      guaranteeId: guaranteeId,
      memoText: `GUARANTEE-${guaranteeId}`,
      network: 'Stellar Testnet (Soroban)',
    };

    this.operationsRepository.save(operation);

    try {
      this.operationsRepository.updateStatus(operationId, 'submitted');

      // Get account from Horizon (needed for sequence number)
      const horizonServer = new StellarSdk.Horizon.Server(
        'https://horizon-testnet.stellar.org',
      );
      const account = await horizonServer.loadAccount(this.keypair.publicKey());

      // Build contract call to mint tokens
      const contract = this.guaranteeTokenContract;

      // Convert parameters to ScVal
      const toAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const guaranteeIdScVal = nativeToScVal(guaranteeId, { type: 'u64' });
      const amountScVal = nativeToScVal(dto.cantidad * 1000000, {
        type: 'u64',
      }); // Scale to 6 decimals
      const commodityTypeScVal = nativeToScVal(dto.tipo, { type: 'string' });
      const weightKgScVal = nativeToScVal(dto.cantidad, { type: 'u64' });
      const valueUsdScVal = nativeToScVal(dto.valor, { type: 'u64' });

      // Create transaction with contract invocation
      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'mint',
            toAddress,
            guaranteeIdScVal,
            amountScVal,
            commodityTypeScVal,
            weightKgScVal,
            valueUsdScVal,
          ),
        )
        .setTimeout(30)
        .build();

      // Simulate transaction
      const simulateResponse = await this.server.simulateTransaction(builtTx);

      if (rpc.Api.isSimulationError(simulateResponse)) {
        throw new Error(`Simulation failed: ${simulateResponse.error}`);
      }

      // Prepare and sign transaction
      const preparedTx = rpc
        .assembleTransaction(builtTx, simulateResponse)
        .build();
      preparedTx.sign(this.keypair);

      // Submit transaction
      const sendResponse = await this.server.sendTransaction(preparedTx);

      if (sendResponse.status === 'ERROR') {
        throw new Error(
          `Transaction submission failed: ${sendResponse.errorResult}`,
        );
      }

      // Poll for result
      const txHash = sendResponse.hash;
      const result = await this.pollForResult(txHash);

      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

      return this.operationsRepository.updateStatus(operationId, 'confirmed', {
        txHash,
        explorerUrl,
        guaranteeId,
      })!;
    } catch (error) {
      const errorMsg = this.parseError(error as StellarError);
      this.operationsRepository.updateStatus(operationId, 'failed', {
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }
  }

  /**
   * Poll for transaction result from Soroban RPC
   */
  private async pollForResult(
    txHash: string,
    maxAttempts = 10,
  ): Promise<rpc.Api.GetTransactionResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await this.server.getTransaction(txHash);

      if (response.status !== 'NOT_FOUND') {
        if (response.status === 'SUCCESS') {
          return response;
        } else if (response.status === 'FAILED') {
          throw new Error(
            `Transaction failed: ${JSON.stringify(response.resultXdr)}`,
          );
        }
      }
    }

    throw new Error('Transaction timeout - unable to confirm on-chain');
  }

  async retryGuarantee(operationId: string): Promise<Operation> {
    const operation = this.operationsRepository.findById(operationId);

    if (!operation) {
      throw new Error(`Operación ${operationId} no encontrada`);
    }

    if (operation.txHash) {
      try {
        const response = await this.server.getTransaction(operation.txHash);
        if (response.status === 'SUCCESS') {
          return operation;
        }
      } catch {
        this.logger.log(
          `TX anterior no encontrada en Soroban RPC, reintentando...`,
        );
      }
    }

    // Retry by creating a new guarantee
    return this.createGuarantee({
      tipo: operation.tipo,
      cantidad: operation.cantidad,
      valor: operation.valor,
      aval: operation.aval,
      operatorConfirmed: true,
    });
  }

  async getTransactionStatus(
    txHash: string,
  ): Promise<{ exists: boolean; status?: string }> {
    try {
      const response = await this.server.getTransaction(txHash);
      if (response.status === 'SUCCESS') {
        return {
          exists: true,
          status: 'confirmed',
        };
      } else if (response.status === 'FAILED') {
        return {
          exists: true,
          status: 'failed',
        };
      } else {
        return {
          exists: true,
          status: 'pending',
        };
      }
    } catch {
      return { exists: false };
    }
  }

  findById(id: string): Operation | undefined {
    return this.operationsRepository.findById(id);
  }

  findAll(): Operation[] {
    return this.operationsRepository.findAll();
  }

  /**
   * Create a sell offer in the marketplace
   */
  async createOffer(
    guaranteeId: number,
    amount: number,
    pricePerToken: number,
  ): Promise<{ offerId: number; txHash: string }> {
    if (!this.marketplaceContract) {
      throw new Error('Marketplace contract not configured');
    }

    try {
      const horizonServer = new StellarSdk.Horizon.Server(
        'https://horizon-testnet.stellar.org',
      );
      const account = await horizonServer.loadAccount(this.keypair.publicKey());

      const contract = this.marketplaceContract;

      // Convert parameters
      const sellerAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const guaranteeIdScVal = nativeToScVal(guaranteeId, { type: 'u64' });
      const amountScVal = nativeToScVal(amount, { type: 'u64' });
      const priceScVal = nativeToScVal(pricePerToken, { type: 'u64' });

      // Build transaction
      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'create_sell_offer',
            sellerAddress,
            guaranteeIdScVal,
            amountScVal,
            priceScVal,
          ),
        )
        .setTimeout(30)
        .build();

      // Simulate and prepare
      const simulateResponse = await this.server.simulateTransaction(builtTx);

      if (rpc.Api.isSimulationError(simulateResponse)) {
        throw new Error(`Simulation failed: ${simulateResponse.error}`);
      }

      const preparedTx = rpc
        .assembleTransaction(builtTx, simulateResponse)
        .build();
      preparedTx.sign(this.keypair);

      // Submit
      const sendResponse = await this.server.sendTransaction(preparedTx);

      if (sendResponse.status === 'ERROR') {
        throw new Error(
          `Transaction submission failed: ${sendResponse.errorResult}`,
        );
      }

      const txHash = sendResponse.hash;
      const result = await this.pollForResult(txHash);

      // Extract offer ID from result
      const successfulResult =
        result as rpc.Api.GetSuccessfulTransactionResponse;
      const rawOfferId = successfulResult.returnValue
        ? scValToNative(successfulResult.returnValue)
        : 0;

      const offerId = Number(rawOfferId);

      return { offerId, txHash };
    } catch (error) {
      throw new Error(`Failed to create offer: ${error.message}`);
    }
  }

  /**
   * Get offers for a guarantee
   */
  async getOffers(guaranteeId: number): Promise<any[]> {
    if (!this.marketplaceContract) {
      throw new Error('Marketplace contract not configured');
    }

    try {
      const horizonServer = new StellarSdk.Horizon.Server(
        'https://horizon-testnet.stellar.org',
      );
      const account = await horizonServer.loadAccount(this.keypair.publicKey());

      const contract = this.marketplaceContract;
      const guaranteeIdScVal = nativeToScVal(guaranteeId, { type: 'u64' });

      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call('get_offers_by_guarantee', guaranteeIdScVal),
        )
        .setTimeout(30)
        .build();

      const simulateResponse = await this.server.simulateTransaction(builtTx);

      if (rpc.Api.isSimulationError(simulateResponse)) {
        throw new Error(`Simulation failed: ${simulateResponse.error}`);
      }

      const result = simulateResponse.result?.retval;
      return result ? scValToNative(result) : [];
    } catch (error) {
      throw new Error(`Failed to get offers: ${error.message}`);
    }
  }

  /**
   * Buy tokens from an offer
   */
  async buyTokens(
    offerId: number,
    amount: number,
  ): Promise<{ txHash: string }> {
    if (!this.marketplaceContract) {
      throw new Error('Marketplace contract not configured');
    }

    try {
      const horizonServer = new StellarSdk.Horizon.Server(
        'https://horizon-testnet.stellar.org',
      );
      const account = await horizonServer.loadAccount(this.keypair.publicKey());

      const contract = this.marketplaceContract;

      const buyerAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const offerIdScVal = nativeToScVal(offerId, { type: 'u64' });
      const amountScVal = nativeToScVal(amount, { type: 'u64' });

      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call('buy', buyerAddress, offerIdScVal, amountScVal),
        )
        .setTimeout(30)
        .build();

      const simulateResponse = await this.server.simulateTransaction(builtTx);

      if (rpc.Api.isSimulationError(simulateResponse)) {
        throw new Error(`Simulation failed: ${simulateResponse.error}`);
      }

      const preparedTx = rpc
        .assembleTransaction(builtTx, simulateResponse)
        .build();
      preparedTx.sign(this.keypair);

      const sendResponse = await this.server.sendTransaction(preparedTx);

      if (sendResponse.status === 'ERROR') {
        throw new Error(
          `Transaction submission failed: ${sendResponse.errorResult}`,
        );
      }

      const txHash = sendResponse.hash;
      await this.pollForResult(txHash);

      return { txHash };
    } catch (error) {
      throw new Error(`Failed to buy tokens: ${error.message}`);
    }
  }

  private parseError(error: StellarError): string {
    const msg = error.message || '';

    if (msg.includes('Account not found') || msg.includes('404')) {
      return 'La cuenta Stellar no está configurada. Contactar al administrador.';
    }

    if (
      msg.includes('insufficient') ||
      msg.includes('underfunded') ||
      error.response?.data?.extras?.result_codes
    ) {
      const codes = error.response?.data?.extras?.result_codes;
      if (codes && JSON.stringify(codes).includes('underfunded')) {
        return 'Saldo insuficiente en la cuenta Stellar para cubrir fees.';
      }
    }

    if (
      msg.includes('timeout') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('network')
    ) {
      return 'La red Stellar no respondió. Intente nuevamente en unos segundos.';
    }

    if (msg.includes('rejected') || msg.includes('tx_failed')) {
      return 'La transacción fue rechazada por la red. Verifique los datos e intente de nuevo.';
    }

    return `Error en Stellar: ${msg || 'Error desconocido'}`;
  }
}
