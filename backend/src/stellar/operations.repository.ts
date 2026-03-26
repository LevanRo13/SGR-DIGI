import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type OperationStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

export interface Operation {
  id: string;
  tipo: string;
  cantidad: number;
  valor: number;
  aval: number;
  estado: OperationStatus;
  timestamp: string;
  txHash?: string;
  explorerUrl?: string;
  memoText?: string;
  network?: string;
  error?: string;
}

@Injectable()
export class OperationsRepository {
  private readonly logger = new Logger(OperationsRepository.name);
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'operations.json');
    this.ensureFileExists();
  }

  private ensureFileExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf-8');
    }
  }

  private readOperations(): Operation[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.warn(`Error leyendo operations.json: ${error}`);
      return [];
    }
  }

  private writeOperations(operations: Operation[]): void {
    try {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(operations, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.warn(`Error escribiendo operations.json: ${error}`);
    }
  }

  save(operation: Operation): Operation {
    const operations = this.readOperations();
    const existingIndex = operations.findIndex((op) => op.id === operation.id);

    if (existingIndex >= 0) {
      operations[existingIndex] = operation;
    } else {
      operations.push(operation);
    }

    this.writeOperations(operations);
    return operation;
  }

  findById(id: string): Operation | undefined {
    const operations = this.readOperations();
    return operations.find((op) => op.id === id);
  }

  findAll(): Operation[] {
    return this.readOperations();
  }

  updateStatus(
    id: string,
    status: OperationStatus,
    extra?: Partial<Operation>,
  ): Operation | undefined {
    const operations = this.readOperations();
    const index = operations.findIndex((op) => op.id === id);

    if (index < 0) {
      return undefined;
    }

    operations[index] = {
      ...operations[index],
      estado: status,
      ...extra,
    };

    this.writeOperations(operations);
    return operations[index];
  }

  generateId(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const operations = this.readOperations();
    const todayOps = operations.filter((op) => op.id.includes(dateStr));
    const seq = String(todayOps.length + 1).padStart(3, '0');
    return `OP-${dateStr}-${seq}`;
  }
}
