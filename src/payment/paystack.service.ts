import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Paystack from "paystack";
import { PAYSTACK_SECRET_KEY } from "src/config/env";

export interface InitializeTransactionResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    currency: string;
    channel: string;
    metadata?: any;
  };
}

@Injectable()
export class PaystackService {
  private paystack: ReturnType<typeof Paystack>;

  constructor(private configService: ConfigService) {
    const secretKey =
      this.configService.getOrThrow<string>(PAYSTACK_SECRET_KEY);
    this.paystack = Paystack(secretKey);
  }

  async initializeTransaction(params: {
    email: string;
    amount: number; // amount in kobo (smallest currency unit)
    reference?: string;
    callback_url?: string;
    metadata?: Record<string, any>;
  }): Promise<InitializeTransactionResponse> {
    try {
      const response = await this.paystack.transaction.initialize({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
      });

      if (!response.status) {
        throw new Error(response.message || "Failed to initialize transaction");
      }

      return {
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference,
      };
    } catch (error) {
      throw new Error(
        `Paystack initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyTransactionResponse> {
    try {
      const response = await this.paystack.transaction.verify(reference);

      if (!response.status) {
        throw new Error(response.message || "Failed to verify transaction");
      }

      return {
        status: response.status,
        message: response.message,
        data: {
          status: response.data.status,
          reference: response.data.reference,
          amount: response.data.amount,
          gateway_response: response.data.gateway_response,
          paid_at: response.data.paid_at,
          created_at: response.data.created_at,
          currency: response.data.currency,
          channel: response.data.channel,
          metadata: response.data.metadata,
        },
      };
    } catch (error) {
      throw new Error(
        `Paystack verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async createTransferRecipient(params: {
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
  }): Promise<any> {
    try {
      const response = await this.paystack.transferrecipient.create({
        type: params.type,
        name: params.name,
        account_number: params.account_number,
        bank_code: params.bank_code,
        currency: params.currency || "NGN",
      });

      if (!response.status) {
        throw new Error(
          response.message || "Failed to create transfer recipient",
        );
      }

      return response.data;
    } catch (error) {
      throw new Error(
        `Paystack transfer recipient creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async initiateTransfer(params: {
    source: string;
    amount: number;
    recipient: string;
    reason?: string;
    reference?: string;
  }): Promise<any> {
    try {
      const response = await this.paystack.transfer.create({
        source: params.source,
        amount: params.amount,
        recipient: params.recipient,
        reason: params.reason,
        reference: params.reference,
      });

      if (!response.status) {
        throw new Error(response.message || "Failed to initiate transfer");
      }

      return response.data;
    } catch (error) {
      throw new Error(
        `Paystack transfer initiation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
