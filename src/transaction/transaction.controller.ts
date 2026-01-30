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

    const transactions = await this.transactionService.getUserTransactions(
      userId,
      {
        type,
        status,
        contractId,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      },
    );

    return {
      status: "success",
      data: transactions,
      count: transactions.length,
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

    return {
      status: "success",
      data: summary,
    };
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

    const transactions = await this.transactionService.getUserTransactions(
      userId,
      {
        contractId,
      },
    );

    return {
      status: "success",
      data: transactions,
      count: transactions.length,
    };
  }
}
