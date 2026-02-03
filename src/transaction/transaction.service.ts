import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "src/model/transaction.entity";
import { User } from "src/model/user.entity";
import { Contract } from "src/model/contract.entity";
import { Milestone } from "src/model/milestone.entity";
import { Payment, PaymentStatus } from "src/model/payment.entity";
import { Wallet } from "src/model/wallet.entity";
import BaseService from "src/interface/service/base.service";

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
export class TransactionService extends BaseService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {
    super();
  }

  /**
   * Create a transaction record
   */
  async createTransaction(
    dto: CreateTransactionDto,
    entityManager?: EntityManager,
  ): Promise<Transaction> {
    const transactionInstance = this.transactionRepo.create({
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
      const wallet = await this.performEntityOps<Wallet, Wallet>({
        repositoryManager: this.walletRepo,
        transactionalEntity: entityManager,
        action: "findOne",
        opsArgs: [Wallet, { where: { id: dto.walletId } }],
      });
      if (wallet) {
        transactionInstance.balanceAfter = Number(wallet.balance);
      }
    }

    return await this.performEntityOps<Transaction, Transaction>({
      repositoryManager: this.transactionRepo,
      transactionalEntity: entityManager,
      action: "save",
      opsArgs: [transactionInstance],
    });
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
  ): Promise<{ transactions: Transaction[]; total: number }> {
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

    // Get total count before applying limit/offset
    const total = await query.getCount();

    // Apply pagination
    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const transactions = await query.getMany();

    return { transactions, total };
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
   * Get total earnings for a user
   */
  async getTotalEarnings(userId: string): Promise<number> {
    const transactions = await this.transactionRepo.find({
      where: { userId, status: TransactionStatus.COMPLETED },
    });

    return transactions
      .filter(
        (t) =>
          t.type === TransactionType.PAYMENT_RECEIVED ||
          t.type === TransactionType.RELEASED,
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Get total withdrawn for a user
   */
  async getTotalWithdrawn(userId: string): Promise<number> {
    const transactions = await this.transactionRepo.find({
      where: {
        userId,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.WITHDRAWN,
      },
    });

    return transactions
      .filter((t) => t.type === TransactionType.WITHDRAWN)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Get total escrowed for a freelancer
   */
  async getTotalEscrowed(userId: string): Promise<number> {
    const payments = await this.paymentRepo
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.contract", "contract")
      .where("contract.freelancerId = :userId", { userId })
      .andWhere("payment.status = :status", { status: PaymentStatus.ESCROWED })
      .getMany();

    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * Get available balance for a user from their wallet
   */
  async getAvailableBalance(userId: string): Promise<number> {
    const wallet = await this.walletRepo.findOne({
      where: { userId },
    });

    if (!wallet) {
      return 0;
    }

    return Number(wallet.balance);
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
