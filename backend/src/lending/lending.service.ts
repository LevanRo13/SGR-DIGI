import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { rpc, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

/**
 * Position information for a user in the BLEND lending pool
 */
export interface PositionInfo {
  /** Total AURA tokens deposited as collateral (in human-readable units) */
  collateral: number;
  /** Total XLM borrowed (in human-readable units) */
  debt: number;
  /** Health factor: collateral * c_factor / debt. > 1 means safe */
  healthFactor: number;
  /** Maximum additional XLM that can be borrowed */
  availableToBorrow: number;
}

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

/** BLEND pool position data returned from on-chain queries */
interface BlendPositionData {
  collateral?: number[];
  liabilities?: number[];
}

/**
 * LendingService
 *
 * Interacts with the BLEND Protocol pool deployed on Soroban Testnet.
 * Operations:
 * - Supply AURA tokens as collateral
 * - Borrow XLM against collateral
 * - Repay borrowed XLM + interest
 * - Query user's lending position
 *
 * Uses @stellar/stellar-sdk to build and submit Soroban transactions.
 */
@Injectable()
export class LendingService implements OnModuleInit {
  private readonly logger = new Logger(LendingService.name);
  private server: rpc.Server;
  private keypair: StellarSdk.Keypair;
  private networkPassphrase: string;

  private blendPoolId: string;
  private blendOracleId: string;
  private blendBackstopId: string;
  private guaranteeTokenContractId: string;

  private blendPoolContract: StellarSdk.Contract | null = null;

  /** Collateral factor for AURA tokens (70%) */
  private readonly COLLATERAL_FACTOR = 0.7;
  /** Liability factor for XLM borrows (75%) */
  private readonly LIABILITY_FACTOR = 0.75;
  /** Scale factor for converting human amounts to on-chain amounts (7 decimals) */
  private readonly SCALE = 10_000_000;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.initialize();
  }

  private initialize(): void {
    const rpcUrl =
      this.configService.get<string>('STELLAR_RPC_URL') ||
      'https://soroban-testnet.stellar.org';

    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      StellarSdk.Networks.TESTNET;

    this.server = new rpc.Server(rpcUrl);

    // Load keypair
    const secretKey = this.configService.get<string>('STELLAR_SECRET_KEY');
    if (secretKey && secretKey !== 'tu_secret_key_stellar') {
      this.keypair = StellarSdk.Keypair.fromSecret(secretKey);
    } else {
      this.logger.warn(
        'STELLAR_SECRET_KEY not configured for LendingService. Lending operations will fail.',
      );
    }

    // Load BLEND contract addresses
    this.blendPoolId = this.configService.get<string>('BLEND_POOL_ID') || '';
    this.blendOracleId =
      this.configService.get<string>('BLEND_ORACLE_ID') || '';
    this.blendBackstopId =
      this.configService.get<string>('BLEND_BACKSTOP_ID') || '';
    this.guaranteeTokenContractId =
      this.configService.get<string>('GUARANTEE_TOKEN_CONTRACT_ID') || '';

    if (this.blendPoolId) {
      this.blendPoolContract = new StellarSdk.Contract(this.blendPoolId);
      this.logger.log(`BLEND Pool contract configured: ${this.blendPoolId}`);
    } else {
      this.logger.warn(
        'BLEND_POOL_ID not configured. Deploy pool and update .env',
      );
    }

    this.logger.log('LendingService initialized');
  }

  /**
   * Deposit AURA tokens as collateral into the BLEND pool
   *
   * Calls BLEND pool.submit() with request_type 2 = SupplyCollateral
   */
  async supplyCollateral(amount: number): Promise<{ txHash: string }> {
    this.ensureConfigured();

    const scaledAmount = BigInt(Math.floor(amount * this.SCALE));

    try {
      const account = await this.loadAccount();

      // BLEND V2 pool.submit(from, spender, to, requests)
      const fromAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const spenderAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const toAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });

      // Request type 2 = SupplyCollateral
      const requestVec = this.buildRequestVec(
        2,
        this.guaranteeTokenContractId,
        scaledAmount,
      );

      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.blendPoolContract!.call(
            'submit',
            fromAddress,
            spenderAddress,
            toAddress,
            requestVec,
          ),
        )
        .setTimeout(30)
        .build();

      const txHash = await this.simulateSignAndSubmit(builtTx);

      this.logger.log(
        `Collateral supplied: ${amount} AURA tokens, txHash: ${txHash}`,
      );

      return { txHash };
    } catch (error) {
      const msg = this.parseError(error as StellarError);
      this.logger.error(`Failed to supply collateral: ${msg}`);
      throw new Error(`Failed to supply collateral: ${msg}`);
    }
  }

  /**
   * Borrow XLM against deposited AURA collateral
   *
   * Calls BLEND pool.submit() with request_type 4 = Borrow
   */
  async borrow(amount: number): Promise<{ txHash: string }> {
    this.ensureConfigured();

    const scaledAmount = BigInt(Math.floor(amount * this.SCALE));

    try {
      const account = await this.loadAccount();

      const fromAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const spenderAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const toAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });

      // Testnet XLM SAC (Stellar Asset Contract)
      const xlmContractId =
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

      // Request type 4 = Borrow
      const requestVec = this.buildRequestVec(4, xlmContractId, scaledAmount);

      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.blendPoolContract!.call(
            'submit',
            fromAddress,
            spenderAddress,
            toAddress,
            requestVec,
          ),
        )
        .setTimeout(30)
        .build();

      const txHash = await this.simulateSignAndSubmit(builtTx);

      this.logger.log(`Borrowed: ${amount} XLM, txHash: ${txHash}`);

      return { txHash };
    } catch (error) {
      const msg = this.parseError(error as StellarError);
      this.logger.error(`Failed to borrow: ${msg}`);
      throw new Error(`Failed to borrow: ${msg}`);
    }
  }

  /**
   * Repay borrowed XLM + interest
   *
   * Calls BLEND pool.submit() with request_type 5 = Repay
   */
  async repay(amount: number): Promise<{ txHash: string }> {
    this.ensureConfigured();

    const scaledAmount = BigInt(Math.floor(amount * this.SCALE));

    try {
      const account = await this.loadAccount();

      const fromAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const spenderAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });
      const toAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });

      const xlmContractId =
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

      // Request type 5 = Repay
      const requestVec = this.buildRequestVec(5, xlmContractId, scaledAmount);

      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.blendPoolContract!.call(
            'submit',
            fromAddress,
            spenderAddress,
            toAddress,
            requestVec,
          ),
        )
        .setTimeout(30)
        .build();

      const txHash = await this.simulateSignAndSubmit(builtTx);

      this.logger.log(`Repaid: ${amount} XLM, txHash: ${txHash}`);

      return { txHash };
    } catch (error) {
      const msg = this.parseError(error as StellarError);
      this.logger.error(`Failed to repay: ${msg}`);
      throw new Error(`Failed to repay: ${msg}`);
    }
  }

  /**
   * Query the user's lending position in the BLEND pool
   *
   * Reads on-chain state to determine collateral, debt, and health factor
   */
  async getPosition(): Promise<PositionInfo> {
    this.ensureConfigured();

    try {
      const account = await this.loadAccount();

      const userAddress = nativeToScVal(this.keypair.publicKey(), {
        type: 'address',
      });

      const builtTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.blendPoolContract!.call('get_positions', userAddress),
        )
        .setTimeout(30)
        .build();

      const simulateResponse = await this.server.simulateTransaction(builtTx);

      if (rpc.Api.isSimulationError(simulateResponse)) {
        this.logger.warn(
          `No position found or simulation error: ${simulateResponse.error}`,
        );
        return this.emptyPosition();
      }

      const result = simulateResponse.result?.retval;

      if (!result) {
        return this.emptyPosition();
      }

      // Parse BLEND position response
      const positionData = scValToNative(result) as BlendPositionData;

      // Reserve 0 = AURA (collateral), Reserve 1 = XLM (borrow)
      const collateralRaw = Number(positionData?.collateral?.[0] ?? 0);
      const debtRaw = Number(positionData?.liabilities?.[0] ?? 0);

      const collateral = collateralRaw / this.SCALE;
      const debt = debtRaw / this.SCALE;

      return this.calculatePosition(collateral, debt);
    } catch (error) {
      const msg = this.parseError(error as StellarError);
      this.logger.error(`Failed to get position: ${msg}`);
      throw new Error(`Failed to get position: ${msg}`);
    }
  }

  /**
   * Check if the lending service is properly configured
   */
  getStatus(): {
    configured: boolean;
    poolId: string;
    oracleId: string;
    backstopId: string;
  } {
    return {
      configured: !!(this.blendPoolId && this.keypair),
      poolId: this.blendPoolId || 'NOT_SET',
      oracleId: this.blendOracleId || 'NOT_SET',
      backstopId: this.blendBackstopId || 'NOT_SET',
    };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private ensureConfigured(): void {
    if (!this.blendPoolContract) {
      throw new Error(
        'BLEND Pool not configured. Deploy pool and set BLEND_POOL_ID in .env',
      );
    }
    if (!this.keypair) {
      throw new Error(
        'Stellar keypair not configured. Set STELLAR_SECRET_KEY in .env',
      );
    }
  }

  private async loadAccount(): Promise<StellarSdk.Horizon.AccountResponse> {
    const horizonServer = new StellarSdk.Horizon.Server(
      'https://horizon-testnet.stellar.org',
    );
    return horizonServer.loadAccount(this.keypair.publicKey());
  }

  /**
   * Build a BLEND request vector ScVal
   * Used for supply, borrow, and repay operations
   */
  private buildRequestVec(
    requestType: number,
    assetAddress: string,
    amount: bigint,
  ): StellarSdk.xdr.ScVal {
    return nativeToScVal([
      {
        request_type: requestType,
        address: assetAddress,
        amount,
      },
    ]);
  }

  /**
   * Simulate, sign, and submit a Soroban transaction.
   * Returns the transaction hash.
   */
  private async simulateSignAndSubmit(
    builtTx: StellarSdk.Transaction,
  ): Promise<string> {
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
        `Transaction submission failed: ${JSON.stringify(sendResponse.errorResult)}`,
      );
    }

    const txHash = sendResponse.hash;
    await this.pollForResult(txHash);

    return txHash;
  }

  /**
   * Poll Soroban RPC for transaction result
   */
  private async pollForResult(
    txHash: string,
    maxAttempts = 10,
  ): Promise<rpc.Api.GetTransactionResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await this.server.getTransaction(txHash);

      if (response.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return response;
      }
      if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(
          `Transaction failed on-chain: ${JSON.stringify(response.resultXdr)}`,
        );
      }
      // NOT_FOUND — keep polling
    }

    throw new Error('Transaction timeout - unable to confirm on-chain');
  }

  private emptyPosition(): PositionInfo {
    return {
      collateral: 0,
      debt: 0,
      healthFactor: 0,
      availableToBorrow: 0,
    };
  }

  private calculatePosition(collateral: number, debt: number): PositionInfo {
    let healthFactor = 0;
    let availableToBorrow = 0;

    const maxBorrow =
      (collateral * this.COLLATERAL_FACTOR) / this.LIABILITY_FACTOR;

    if (debt > 0) {
      healthFactor =
        (collateral * this.COLLATERAL_FACTOR) / (debt * this.LIABILITY_FACTOR);
      availableToBorrow = Math.max(0, maxBorrow - debt);
    } else if (collateral > 0) {
      healthFactor = 999; // No debt = safe
      availableToBorrow = maxBorrow;
    }

    return {
      collateral,
      debt,
      healthFactor: Number(healthFactor.toFixed(4)),
      availableToBorrow: Number(availableToBorrow.toFixed(7)),
    };
  }

  private parseError(error: StellarError): string {
    const msg = error.message || '';

    if (msg.includes('Account not found') || msg.includes('404')) {
      return 'Cuenta Stellar no encontrada. Configurar STELLAR_SECRET_KEY en .env.';
    }

    if (msg.includes('insufficient') || msg.includes('underfunded')) {
      return 'Saldo insuficiente para la operación de lending.';
    }

    if (
      msg.includes('timeout') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('network')
    ) {
      return 'Red Stellar no disponible. Intente nuevamente.';
    }

    return `Error en lending: ${msg || 'Error desconocido'}`;
  }
}
