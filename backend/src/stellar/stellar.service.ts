import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
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
  private server: StellarSdk.Horizon.Server;
  private keypair: StellarSdk.Keypair;
  private networkPassphrase: string;
  private readonly keyFilePath: string;

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
    const horizonUrl =
      this.configService.get<string>('STELLAR_HORIZON_URL') ||
      'https://horizon-testnet.stellar.org';

    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      StellarSdk.Networks.TESTNET;

    this.server = new StellarSdk.Horizon.Server(horizonUrl);

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
    horizonUrl: string;
    publicKey: string;
  }> {
    try {
      await this.server.ledgers().limit(1).call();
      return {
        online: true,
        network: 'Stellar Testnet',
        horizonUrl:
          this.configService.get<string>('STELLAR_HORIZON_URL') ||
          'https://horizon-testnet.stellar.org',
        publicKey: this.keypair.publicKey(),
      };
    } catch {
      return {
        online: false,
        network: 'Stellar Testnet',
        horizonUrl:
          this.configService.get<string>('STELLAR_HORIZON_URL') ||
          'https://horizon-testnet.stellar.org',
        publicKey: this.keypair?.publicKey() || 'N/A',
      };
    }
  }

  async createGuarantee(dto: CreateGuaranteeDto): Promise<Operation> {
    const operationId = this.operationsRepository.generateId();
    const shortId = uuidv4().slice(0, 8).toUpperCase();
    const memoText = `AURA-${shortId}`;

    const operation: Operation = {
      id: operationId,
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      valor: dto.valor,
      aval: dto.aval,
      estado: 'pending',
      timestamp: new Date().toISOString(),
      memoText,
      network: 'Stellar Testnet',
    };

    this.operationsRepository.save(operation);

    try {
      this.operationsRepository.updateStatus(operationId, 'submitted');

      const account = await this.server.loadAccount(this.keypair.publicKey());

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: this.keypair.publicKey(),
            asset: StellarSdk.Asset.native(),
            amount: '0.0000001',
          }),
        )
        .addMemo(StellarSdk.Memo.text(memoText))
        .setTimeout(30)
        .build();

      transaction.sign(this.keypair);

      const result = await this.server.submitTransaction(transaction);
      const txHash = result.hash;
      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

      return this.operationsRepository.updateStatus(operationId, 'confirmed', {
        txHash,
        explorerUrl,
      })!;
    } catch (error) {
      const errorMsg = this.parseError(error as StellarError);
      this.operationsRepository.updateStatus(operationId, 'failed', {
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }
  }

  async retryGuarantee(operationId: string): Promise<Operation> {
    const operation = this.operationsRepository.findById(operationId);

    if (!operation) {
      throw new Error(`Operación ${operationId} no encontrada`);
    }

    if (operation.txHash) {
      try {
        await this.server.transactions().transaction(operation.txHash).call();
        return operation;
      } catch {
        this.logger.log(
          `TX anterior no encontrada en Horizon, reintentando...`,
        );
      }
    }

    const shortId = uuidv4().slice(0, 8).toUpperCase();
    const memoText = `AURA-${shortId}`;

    try {
      this.operationsRepository.updateStatus(operationId, 'submitted', {
        error: undefined,
        memoText,
      });

      const account = await this.server.loadAccount(this.keypair.publicKey());

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: this.keypair.publicKey(),
            asset: StellarSdk.Asset.native(),
            amount: '0.0000001',
          }),
        )
        .addMemo(StellarSdk.Memo.text(memoText))
        .setTimeout(30)
        .build();

      transaction.sign(this.keypair);

      const result = await this.server.submitTransaction(transaction);
      const txHash = result.hash;
      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

      return this.operationsRepository.updateStatus(operationId, 'confirmed', {
        txHash,
        explorerUrl,
      })!;
    } catch (error) {
      const errorMsg = this.parseError(error as StellarError);
      this.operationsRepository.updateStatus(operationId, 'failed', {
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }
  }

  async getTransactionStatus(
    txHash: string,
  ): Promise<{ exists: boolean; status?: string }> {
    try {
      const tx = await this.server.transactions().transaction(txHash).call();
      return {
        exists: true,
        status: tx.successful ? 'confirmed' : 'failed',
      };
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
