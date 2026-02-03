import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { TransactionService } from "./transaction.service";
import {
  TransactionType,
  TransactionStatus,
} from "src/model/transaction.entity";

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Get transactions for the authenticated user
   */
  @Get()
  async getUserTransactions(
    @Request() req: any,
    @Query("type") type?: TransactionType,
    @Query("status") status?: TransactionStatus,
    @Query("contractId") contractId?: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    const userId = req.user.id;

    const result = await this.transactionService.getUserTransactions(userId, {
      type,
      status,
      contractId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return {
      transactions: result.transactions,
      count: result.transactions.length,
      total: result.total,
    };
  }

  /**
   * Get transaction summary for the authenticated user
   */
  @Get("summary")
  async getUserTransactionSummary(@Request() req: any) {
    const userId = req.user.id;

    const summary =
      await this.transactionService.getUserTransactionSummary(userId);

    return summary;
  }

  /**
   * Get total earnings for the authenticated user
   */
  @Get("summary/total-earnings")
  async getTotalEarnings(@Request() req: any) {
    const userId = req.user.id;

    const totalEarnings =
      await this.transactionService.getTotalEarnings(userId);

    return { totalEarnings };
  }

  /**
   * Get total withdrawn for the authenticated user
   */
  @Get("summary/total-withdrawn")
  async getTotalWithdrawn(@Request() req: any) {
    const userId = req.user.id;

    const totalWithdrawn =
      await this.transactionService.getTotalWithdrawn(userId);

    return { totalWithdrawn };
  }

  /**
   * Get total escrowed for the authenticated user
   */
  @Get("summary/total-escrowed")
  async getTotalEscrowed(@Request() req: any) {
    const userId = req.user.id;

    const totalEscrowed =
      await this.transactionService.getTotalEscrowed(userId);

    return { totalEscrowed };
  }

  /**
   * Get available balance for the authenticated user
   */
  @Get("summary/available-balance")
  async getAvailableBalance(@Request() req: any) {
    const userId = req.user.id;

    const availableBalance =
      await this.transactionService.getAvailableBalance(userId);

    return { availableBalance };
  }

  /**
   * Get transactions for a specific contract
   */
  @Get("contract/:contractId")
  async getContractTransactions(
    @Request() req: any,
    @Param("contractId") contractId: string,
  ) {
    const userId = req.user.id;

    const result = await this.transactionService.getUserTransactions(userId, {
      contractId,
    });

    return {
      transactiions: result.transactions,
      count: result.transactions.length,
      total: result.total,
    };
  }
}
