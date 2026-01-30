import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "src/model/transaction.entity";
import { User } from "src/model/user.entity";
import { Contract } from "src/model/contract.entity";
import { Milestone } from "src/model/milestone.entity";
import { Payment } from "src/model/payment.entity";
import { Wallet } from "src/model/wallet.entity";

interface CreateTransactionDto {
  userId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  description?: string;
  contractId?: string;
  milestoneId?: string;
  paymentId?: string;
  walletId?: string;
  metadata?: Record<string, any>;
  status?: TransactionStatus;
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a transaction record
   */
  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepo.create({
      userId: dto.userId,
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency || "ngn",
      description: dto.description,
      contractId: dto.contractId,
      milestoneId: dto.milestoneId,
      paymentId: dto.paymentId,
      walletId: dto.walletId,
      metadata: dto.metadata,
      status: dto.status || TransactionStatus.COMPLETED,
    });

    // If this is a wallet-related transaction, calculate balance after
    if (dto.walletId) {
      const wallet = await this.dataSource.manager.findOne(Wallet, {
        where: { id: dto.walletId },
      });
      if (wallet) {
        transaction.balanceAfter = Number(wallet.balance);
      }
    }

    return await this.transactionRepo.save(transaction);
  }

  /**
   * Create transaction for client payment made
   */
  async createPaymentMadeTransaction(
    client: User,
    payment: Payment,
    contract: Contract,
    milestoneId?: string,
  ): Promise<Transaction> {
    const description = milestoneId
      ? `Payment for milestone`
      : `Payment for contract: ${contract.id}`;

    return this.createTransaction({
      userId: client.id,
      type: milestoneId
        ? TransactionType.MILESTONE_PAYMENT
        : TransactionType.CONTRACT_PAYMENT,
      amount: payment.amount,
      currency: payment.currency,
      description,
      contractId: contract.id,
      milestoneId,
      paymentId: payment.id,
      metadata: {
        paymentMode: payment.providerRaw?.metadata?.paymentMode,
        providerPaymentId: payment.providerPaymentId,
      },
      status: TransactionStatus.COMPLETED,
    });
  }

  /**
   * Create transaction for escrowed payment (client view)
   */
  async createEscrowedPaymentTransaction(
    client: User,
    payment: Payment,
    contract: Contract,
    milestoneId?: string,
  ): Promise<Transaction> {
    console.log("milestoneId", milestoneId);
    const description = milestoneId
      ? `Escrowed payment for milestone`
      : `Escrowed payment for contract: ${contract.id}`;

    return this.createTransaction({
      userId: client.id,
      type: TransactionType.ESCROWED_PAYMENT,
      amount: payment.amount,
      currency: payment.currency,
      description,
      contractId: contract.id,
      milestoneId,
      paymentId: payment.id,
      metadata: {
        paymentMode: payment.providerRaw?.metadata?.paymentMode,
        providerPaymentId: payment.providerPaymentId,
      },
      status: TransactionStatus.COMPLETED,
    });
  }

  /**
   * Create transaction for escrowed funds (freelancer view)
   */
  async createEscrowedTransaction(
    freelancer: User,
    payment: Payment,
    contract: Contract,
    milestoneId?: string,
  ): Promise<Transaction> {
    const description = milestoneId
      ? `Funds escrowed for milestone`
      : `Funds escrowed for contract: ${contract.id}`;

    return this.createTransaction({
      userId: freelancer.id,
      type: TransactionType.ESCROWED,
      amount: payment.amount,
      currency: payment.currency,
      description,
      contractId: contract.id,
      milestoneId,
      paymentId: payment.id,
      status: TransactionStatus.COMPLETED,
    });
  }

  /**
   * Create transaction for payment released to freelancer wallet
   */
  async createPaymentReleasedTransaction(
    freelancer: User,
    milestone: Milestone,
    payment: Payment,
    wallet: Wallet,
  ): Promise<Transaction> {
    const description = `Payment released for milestone: ${milestone.title}`;

    return this.createTransaction({
      userId: freelancer.id,
      type: TransactionType.RELEASED,
      amount: milestone.amount,
      currency: milestone.contract?.currency || "ngn",
      description,
      contractId: milestone.contractId,
      milestoneId: milestone.id,
      paymentId: payment.id,
      walletId: wallet.id,
      metadata: {
        milestoneTitle: milestone.title,
        providerPaymentId: payment.providerPaymentId,
      },
      status: TransactionStatus.COMPLETED,
    });
  }

  /**
   * Create transaction for payment received (freelancer view - when funds are in wallet)
   */
  async createPaymentReceivedTransaction(
    freelancer: User,
    milestone: Milestone,
    payment: Payment,
    wallet: Wallet,
  ): Promise<Transaction> {
    const description = `Payment received for milestone: ${milestone.title}`;

    return this.createTransaction({
      userId: freelancer.id,
      type: TransactionType.PAYMENT_RECEIVED,
      amount: milestone.amount,
      currency: milestone.contract?.currency || "ngn",
      description,
      contractId: milestone.contractId,
      milestoneId: milestone.id,
      paymentId: payment.id,
      walletId: wallet.id,
      metadata: {
        milestoneTitle: milestone.title,
        providerPaymentId: payment.providerPaymentId,
      },
      status: TransactionStatus.COMPLETED,
    });
  }

  /**
   * Create transaction for withdrawal
   */
  async createWithdrawalTransaction(
    freelancer: User,
    amount: number,
    wallet: Wallet,
    metadata: {
      withdrawalMethod: string;
      withdrawalAccount: string;
      reference?: string;
    },
  ): Promise<Transaction> {
    const description = `Withdrawal via ${metadata.withdrawalMethod}`;

    return this.createTransaction({
      userId: freelancer.id,
      type: TransactionType.WITHDRAWN,
      amount,
      currency: wallet.currency,
      description,
      walletId: wallet.id,
      metadata,
      status: TransactionStatus.PENDING, // Will be updated to COMPLETED when withdrawal is processed
    });
  }

  /**
   * Create transaction for refund
   */
  async createRefundTransaction(
    client: User,
    payment: Payment,
    contract: Contract,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    const description = `Refund for contract: ${contract.id}`;

    return this.createTransaction({
      userId: client.id,
      type: TransactionType.REFUNDED,
      amount,
      currency: payment.currency,
      description,
      contractId: contract.id,
      paymentId: payment.id,
      metadata: {
        ...metadata,
        providerPaymentId: payment.providerPaymentId,
      },
      status: TransactionStatus.COMPLETED,
    });
  }

  /**
   * Get transactions for a user with optional filters
   */
  async getUserTransactions(
    userId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      contractId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Transaction[]> {
    const query = this.transactionRepo
      .createQueryBuilder("transaction")
      .where("transaction.userId = :userId", { userId })
      .orderBy("transaction.createdAt", "DESC");

    if (filters?.type) {
      query.andWhere("transaction.type = :type", { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere("transaction.status = :status", {
        status: filters.status,
      });
    }

    if (filters?.contractId) {
      query.andWhere("transaction.contractId = :contractId", {
        contractId: filters.contractId,
      });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return query.getMany();
  }

  /**
   * Get transaction summary for a user
   */
  async getUserTransactionSummary(userId: string): Promise<{
    totalEarnings: number;
    totalWithdrawn: number;
    totalEscrowed: number;
    availableBalance: number;
  }> {
    const transactions = await this.transactionRepo.find({
      where: { userId, status: TransactionStatus.COMPLETED },
    });

    const totalEarnings = transactions
      .filter(
        (t) =>
          t.type === TransactionType.PAYMENT_RECEIVED ||
          t.type === TransactionType.RELEASED,
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = transactions
      .filter((t) => t.type === TransactionType.WITHDRAWN)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEscrowed = transactions
      .filter((t) => t.type === TransactionType.ESCROWED)
      .reduce((sum, t) => sum + t.amount, 0);

    const availableBalance = totalEarnings - totalWithdrawn - totalEscrowed;

    return {
      totalEarnings,
      totalWithdrawn,
      totalEscrowed,
      availableBalance: Math.max(0, availableBalance),
    };
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    transaction.status = status;
    return await this.transactionRepo.save(transaction);
  }
}
