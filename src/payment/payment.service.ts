import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import * as crypto from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Payment, PaymentStatus } from "src/model/payment.entity";
import { Contract, ContractStatus } from "src/model/contract.entity";
import { Milestone, MilestoneStatus } from "src/model/milestone.entity";
import { User } from "src/model/user.entity";
import { PaystackService } from "./paystack.service";
import { InitiatePaymentDto, PaymentMode } from "./dto/create-payment.dto";
import { ContractService } from "src/contract/contract.service";
import { FRONTEND_URL, PAYSTACK_SECRET_KEY } from "src/config/env";
import { TransactionService } from "src/transaction/transaction.service";
import { TransactionType } from "src/model/transaction.entity";
import { Wallet } from "src/model/wallet.entity";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
    private readonly paystackService: PaystackService,
    private readonly configService: ConfigService,
    private readonly contractService: ContractService,
    private readonly transactionService: TransactionService,
  ) {}

  async initiatePayment(
    client: User,
    dto: InitiatePaymentDto,
  ): Promise<{
    authorizationUrl: string;
    paymentId: string;
    reference: string;
  }> {
    return this.dataSource.transaction(async (manager) => {
      // Find contract with relations including proposal
      const contract = await manager.findOne(Contract, {
        where: { id: dto.contractId },
        relations: ["client", "freelancer", "proposal"],
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      // Verify contract belongs to the client
      if (contract.clientId !== client.id) {
        throw new ForbiddenException(
          "You can only initiate payment for your own contracts",
        );
      }

      // Verify contract status based on payment mode
      if (dto.paymentMode === PaymentMode.FULL) {
        // Full payment requires contract to be awaiting payment
        if (contract.status !== ContractStatus.AWAITING_PAYMENT) {
          throw new BadRequestException(
            `Contract must be in AWAITING_PAYMENT status for full payment. Current status: ${contract.status}`,
          );
        }
      } else if (dto.paymentMode === PaymentMode.MILESTONE) {
        // Milestone payments can be made when contract is ACTIVE or AWAITING_PAYMENT
        if (
          contract.status !== ContractStatus.AWAITING_PAYMENT &&
          contract.status !== ContractStatus.ACTIVE
        ) {
          throw new BadRequestException(
            `Contract must be in AWAITING_PAYMENT or ACTIVE status for milestone payment. Current status: ${contract.status}`,
          );
        }
      }

      // Validate amount based on payment mode
      const currency = dto.currency || contract.currency || "ngn";
      let milestone: Milestone | null = null;

      if (dto.paymentMode === PaymentMode.FULL) {
        if (dto.amount !== contract.amount) {
          throw new BadRequestException(
            `Full payment amount must match contract amount. Expected: ${contract.amount}, Got: ${dto.amount}`,
          );
        }
      } else if (dto.paymentMode === PaymentMode.MILESTONE) {
        // For milestone mode, milestoneId is required
        if (!dto.milestoneId) {
          throw new BadRequestException(
            "milestoneId is required when paymentMode is MILESTONE",
          );
        }

        // Find and validate milestone
        milestone = await manager.findOne(Milestone, {
          where: { id: dto.milestoneId },
          relations: ["contract"],
        });

        if (!milestone) {
          throw new NotFoundException("Milestone not found");
        }

        // Verify milestone belongs to this contract
        if (milestone.contractId !== contract.id) {
          throw new BadRequestException(
            "Milestone does not belong to this contract",
          );
        }

        // Verify this is a child milestone (can't pay for parent milestones directly)
        if (!milestone.parentId) {
          throw new BadRequestException(
            "Cannot initiate payment for parent milestones. Only child milestones can be paid for.",
          );
        }

        // Verify parent milestone is accepted
        const parentMilestone = await manager.findOne(Milestone, {
          where: { id: milestone.parentId },
        });

        if (!parentMilestone) {
          throw new NotFoundException("Parent milestone not found");
        }

        if (parentMilestone.status !== MilestoneStatus.ACCEPTED) {
          throw new BadRequestException(
            `Parent milestone must be accepted before initiating payment for child milestones. Parent milestone status: ${parentMilestone.status}`,
          );
        }

        // Verify milestone is in PENDING status (not already paid/activated)
        if (milestone.status !== MilestoneStatus.PENDING) {
          throw new BadRequestException(
            `Milestone must be in PENDING status to initiate payment. Current status: ${milestone.status}`,
          );
        }

        // Validate payment amount matches milestone amount
        if (dto.amount !== milestone.amount) {
          throw new BadRequestException(
            `Payment amount must match milestone amount. Expected: ${milestone.amount}, Got: ${dto.amount}`,
          );
        }

        // Check if there's already an active payment for this milestone
        // We check all active payments and verify their metadata contains this milestoneId
        const existingPayments = await manager.find(Payment, {
          where: {
            contractId: contract.id,
            status: In([PaymentStatus.PENDING, PaymentStatus.ESCROWED]),
          },
        });

        // Check if any existing payment is for this milestone
        const hasExistingMilestonePayment = existingPayments.some(
          (payment) => payment.providerRaw?.milestoneId === dto.milestoneId,
        );

        if (hasExistingMilestonePayment) {
          throw new BadRequestException(
            "There is already an active payment for this milestone",
          );
        }

        // Update milestone status to PAYMENT_INITIATED
        milestone.status = MilestoneStatus.PAYMENT_INITIATED;
        await manager.save(milestone);
      }

      // For full payment mode, check if there's already an active payment for this contract
      if (dto.paymentMode === PaymentMode.FULL) {
        const existingPayment = await manager.findOne(Payment, {
          where: {
            contractId: contract.id,
            status: In([PaymentStatus.PENDING, PaymentStatus.ESCROWED]),
          },
        });

        if (existingPayment) {
          throw new BadRequestException(
            "There is already an active payment for this contract",
          );
        }

        //update contract status to PAYMENT_INITIATED
        contract.status = ContractStatus.PAYMENT_INITIATED;
        await manager.save(contract);
      }

      // Create payment record
      const payment = manager.create(Payment, {
        contract,
        payer: client,
        amount: dto.amount,
        currency: currency.toLowerCase(),
        status: PaymentStatus.PENDING,
        // Store metadata in providerRaw for later retrieval
        providerRaw: {
          metadata: {
            contractId: contract.id,
            paymentMode: dto.paymentMode,
            clientId: client.id,
            freelancerId: contract.freelancerId,
            ...(dto.paymentMode === PaymentMode.MILESTONE && {
              milestoneId: dto.milestoneId,
            }),
          },
        },
      });

      const savedPayment = await manager.save(payment);

      // Generate callback URL with redirect to project page
      const frontendUrl =
        this.configService.get<string>(FRONTEND_URL) || "http://localhost:3000";

      // Build redirect URL to project contract tab if proposal exists
      let redirectUrl = `${frontendUrl}/dashboard`;
      if (contract.proposal?.slug) {
        redirectUrl = `${frontendUrl}/projects/${contract.proposal.slug}?tab=contract`;
      }

      const callbackUrl = `${frontendUrl}/payments/callback?paymentId=${savedPayment.id}&redirect=${encodeURIComponent(redirectUrl)}`;

      // Initialize Paystack transaction
      const paystackResponse = await this.paystackService.initializeTransaction(
        {
          email: client.email,
          amount: dto.amount * 100, // Convert to kobo
          reference: savedPayment.id, // Use payment ID as reference
          callback_url: callbackUrl,
          metadata: {
            contractId: contract.id,
            paymentId: savedPayment.id,
            paymentMode: dto.paymentMode,
            clientId: client.id,
            freelancerId: contract.freelancerId,
            ...(dto.paymentMode === PaymentMode.MILESTONE && {
              milestoneId: dto.milestoneId,
            }),
          },
        },
      );

      // Update payment with Paystack reference and preserve metadata
      savedPayment.providerPaymentId = paystackResponse.reference;
      savedPayment.providerRaw = {
        ...savedPayment.providerRaw, // Preserve existing metadata
        access_code: paystackResponse.access_code,
        authorization_url: paystackResponse.authorization_url,
      };
      await manager.save(savedPayment);

      return {
        authorizationUrl: paystackResponse.authorization_url,
        paymentId: savedPayment.id,
        reference: paystackResponse.reference,
      };
    });
  }

  /**
   * Get all payments for a contract
   * Only the client or freelancer associated with the contract can view payments
   */
  async getPaymentsForContract(
    contractId: string,
    userId: string,
  ): Promise<Payment[]> {
    // Find contract and verify user is involved
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ["client", "freelancer"],
    });

    if (!contract) {
      throw new NotFoundException("Contract not found");
    }

    // Verify user is either the client or freelancer
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException(
        "You can only view payments for contracts you are involved in",
      );
    }

    // Get all payments for this contract
    const payments = await this.paymentRepo.find({
      where: { contractId },
      order: { createdAt: "DESC" },
    });

    return payments;
  }

  /**
   * Verify payment using contract or milestone id
   * Searches for a payment based on contractId and optionally milestoneId,
   * then verifies the transaction with Paystack and updates appropriate records
   */
  async verifyPaymentUsingContractOrMilestoneId(data: {
    contractId: string;
    milestoneId?: string;
  }): Promise<{
    status: string;
    message: string;
    payment?: Payment;
    contract?: Contract;
  }> {
    return this.dataSource.transaction(async (manager) => {
      // Find contract with relations
      const contract = await manager.findOne(Contract, {
        where: { id: data.contractId },
        relations: ["proposal", "client", "freelancer"],
      });

      if (!contract) {
        throw new NotFoundException("Contract not found");
      }

      // Find payment(s) for this contract
      // We need to find the payment that matches the contract and optionally the milestone
      let payment: Payment | null = null;

      if (data.milestoneId) {
        // For milestone payment, search for payment with matching milestoneId in providerRaw metadata
        const payments = await manager.find(Payment, {
          where: { contractId: data.contractId },
          order: { createdAt: "DESC" },
        });

        // Filter payments where providerRaw.metadata.milestoneId matches
        payment =
          payments.find(
            (p) =>
              p.providerRaw?.metadata?.milestoneId === data.milestoneId ||
              (p.providerRaw as any)?.milestoneId === data.milestoneId,
          ) || null;

        if (!payment) {
          // Try to find by checking Paystack metadata when payment was created
          // The metadata is stored in providerRaw after Paystack response
          payment =
            payments.find(
              (p) =>
                p.status === PaymentStatus.PENDING ||
                p.status === PaymentStatus.ESCROWED,
            ) || null;
        }
      } else {
        // For full contract payment, find payment without milestoneId
        const payments = await manager.find(Payment, {
          where: { contractId: data.contractId },
          order: { createdAt: "DESC" },
        });

        // Find payment where milestoneId is not present in metadata (full contract payment)
        payment =
          payments.find(
            (p) =>
              !p.providerRaw?.metadata?.milestoneId &&
              !(p.providerRaw as any)?.milestoneId,
          ) || null;

        // If not found, try to find the most recent pending/escrowed payment
        if (!payment) {
          payment =
            payments.find(
              (p) =>
                p.status === PaymentStatus.PENDING ||
                p.status === PaymentStatus.ESCROWED,
            ) || null;
        }
      }

      if (!payment) {
        throw new NotFoundException(
          `Payment not found for contract ${data.contractId}${
            data.milestoneId ? ` and milestone ${data.milestoneId}` : ""
          }`,
        );
      }

      // Verify transaction with Paystack using payment ID as reference
      const verification = await this.paystackService.verifyTransaction(
        payment.id,
      );

      if (!verification.status || verification.data.status !== "success") {
        this.logger.warn(
          `Transaction verification failed for payment: ${payment.id}`,
        );
        return {
          status: verification.data.status || "failed",
          message: "Payment verification failed. Please try again.",
        };
      }

      // Extract metadata from Paystack verification response
      const {
        metadata: { contractId, milestoneId = null },
      } = verification.data;

      // Update contract or milestone status based on payment type
      if (!milestoneId) {
        // Full contract payment
        if (contract.status === ContractStatus.PAYMENT_INITIATED) {
          contract.status = ContractStatus.ACTIVE;
          await manager.save(contract);
          this.logger.log(
            `Contract ${contract.id} activated after payment verification`,
          );
        }
      } else {
        // Milestone payment
        const milestone = await manager.findOne(Milestone, {
          where: { id: milestoneId },
          relations: ["contract", "contract.proposal"],
        });

        if (!milestone) {
          throw new NotFoundException("Milestone not found");
        }

        if (milestone.status === MilestoneStatus.PAYMENT_INITIATED) {
          milestone.status = MilestoneStatus.APPROVED;
          await manager.save(milestone);
          this.logger.log(
            `Milestone ${milestone.id} approved after payment verification`,
          );
        }
      }

      // Update payment status to ESCROWED if still pending
      if (payment.status === PaymentStatus.PENDING) {
        payment.status = PaymentStatus.ESCROWED;
        payment.providerRaw = {
          ...payment.providerRaw,
          webhookData: verification.data,
          verifiedAt: new Date().toISOString(),
          metadata: verification.data.metadata,
        };
        await manager.save(payment);

        // Create transaction records for client and freelancer
        if (contract.client) {
          // Client: Payment made and escrowed
          await this.transactionService.createPaymentMadeTransaction(
            contract.client,
            payment,
            contract,
            data.milestoneId,
          );
          await this.transactionService.createEscrowedPaymentTransaction(
            contract.client,
            payment,
            contract,
            data.milestoneId,
          );
        }

        if (contract.freelancer) {
          // Freelancer: Funds escrowed
          await this.transactionService.createEscrowedTransaction(
            contract.freelancer,
            payment,
            contract,
            data.milestoneId,
          );
        }
      }

      // Reload contract with updated relations
      const updatedContract = await manager.findOne(Contract, {
        where: { id: data.contractId },
        relations: ["proposal"],
      });

      return {
        status: "success",
        message: "Payment verified and processed successfully",
        payment,
        contract: updatedContract || undefined,
      };
    });
  }

  /**
   * verify payment using reference
   */
  async getPaymentByReference(reference: string): Promise<{
    status: string;
    message: string;
    payment?: Payment;
    contract?: Contract;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: reference },
        relations: ["contract", "contract.proposal"],
      });

      if (!payment) throw new NotFoundException("Payment not found");

      // Verify transaction with Paystack
      const verification =
        await this.paystackService.verifyTransaction(reference);
      if (!verification.status || verification.data.status !== "success") {
        this.logger.warn(
          `Transaction verification failed for payment: ${payment.id}`,
        );
        return {
          status: verification.data.status || "failed",
          message: "Payment verification failed. Please try again.",
        };
      }

      const {
        metadata: { contractId, milestoneId = null },
      } = verification.data;

      let contract: Contract | null = null;

      if (!milestoneId) {
        // Payment was made for a full contract instead, use the contractId
        contract = await manager.findOne(Contract, {
          where: { id: contractId },
          relations: ["proposal", "client", "freelancer"],
        });
        if (!contract) throw new NotFoundException("Contract not found");

        if (contract.status === ContractStatus.PAYMENT_INITIATED) {
          contract.status = ContractStatus.ACTIVE;
          await manager.save(contract);
        }
      }

      if (milestoneId) {
        // Payment was made for a milestone, use the milestoneId
        const milestone = await manager.findOne(Milestone, {
          where: { id: milestoneId },
          relations: [
            "contract",
            "contract.proposal",
            "contract.client",
            "contract.freelancer",
          ],
        });

        if (!milestone) throw new NotFoundException("Milestone not found");

        contract = milestone.contract;

        if (milestone.status === MilestoneStatus.PAYMENT_INITIATED) {
          milestone.status = MilestoneStatus.APPROVED;
          await manager.save(milestone);
        }
      }

      // Update payment status to ESCROWED and save metadata
      if (payment.status === PaymentStatus.PENDING) {
        payment.status = PaymentStatus.ESCROWED;
        payment.providerRaw = {
          ...payment.providerRaw,
          webhookData: verification.data,
          verifiedAt: new Date().toISOString(),
        };
        await manager.save(payment);

        // Create transaction records for client and freelancer
        if (contract && contract.client) {
          // Client: Payment made and escrowed
          await this.transactionService.createPaymentMadeTransaction(
            contract.client,
            payment,
            contract,
            milestoneId,
          );
          await this.transactionService.createEscrowedPaymentTransaction(
            contract.client,
            payment,
            contract,
            milestoneId,
          );
        }

        if (contract && contract.freelancer) {
          // Freelancer: Funds escrowed
          await this.transactionService.createEscrowedTransaction(
            contract.freelancer,
            payment,
            contract,
            milestoneId,
          );
        }
      }

      return {
        status: "success",
        message: "Payment verified and processed successfully",
        payment,
        contract: contract || undefined,
      };
    });
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secretKey =
      this.configService.getOrThrow<string>(PAYSTACK_SECRET_KEY);
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(payload)
      .digest("hex");

    return hash === signature;
  }

  /**
   * Handle Paystack webhook event
   */
  async handleWebhookEvent(event: any): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.event}`);

    if (event.event === "charge.success") {
      const data = event.data;
      const {
        reference,
        metadata: { contractId, milestoneId = null },
      } = data.reference;

      let contract: Contract | null = null;

      this.dataSource.transaction(async (manager) => {
        try {
          if (!milestoneId) {
            // Payment was made for a full contract instead, use the contractId
            contract = await manager.findOne(Contract, {
              where: { id: contractId },
            });

            if (!contract) throw new NotFoundException("Contract not found");

            if (contract.status !== ContractStatus.PAYMENT_INITIATED)
              throw new BadRequestException(
                "Contract is not in awaiting payment status",
              );

            contract.status = ContractStatus.ACTIVE;
            await manager.save(contract);
            this.logger.log(`Contract ${contract.id} activated after payment`);
          } else {
            // Payment was made for a milestone, use the milestoneId
            const milestone = await manager.findOne(Milestone, {
              where: { id: milestoneId },
              relations: ["contract"],
            });

            if (!milestone) throw new NotFoundException("Milestone not found");

            if (milestone.contractId !== contractId)
              throw new BadRequestException(
                "Milestone does not belong to this contract",
              );

            if (milestone.status !== MilestoneStatus.PAYMENT_INITIATED)
              throw new BadRequestException(
                "Milestone is not in payment initiated status",
              );

            contract = milestone.contract;

            milestone.status = MilestoneStatus.APPROVED;
            await manager.save(milestone);

            this.logger.log(
              `Milestone ${milestone.id} marked as payment success`,
            );
          }

          // Handle Payment....
          // Find payment by reference (which is the payment ID)
          const payment = await this.paymentRepo.findOne({
            where: { id: reference },
          });

          if (!payment) {
            this.logger.warn(`Payment not found for reference: ${reference}`);
            return;
          }

          if (payment.status !== PaymentStatus.PENDING) {
            this.logger.warn(`Payment is not in pending status: ${payment.id}`);
            return;
          }

          // Update payment status to ESCROWED and save metadata
          if (payment.status === PaymentStatus.PENDING) {
            payment.status = PaymentStatus.ESCROWED;
            payment.providerRaw = {
              ...payment.providerRaw,
              webhookData: data,
              verifiedAt: new Date().toISOString(),
            };
            await manager.save(payment);

            // Create transaction records for client and freelancer
            if (contract && contract.client) {
              // Client: Payment made and escrowed
              await this.transactionService.createPaymentMadeTransaction(
                contract.client,
                payment,
                contract,
                milestoneId,
              );
              await this.transactionService.createEscrowedPaymentTransaction(
                contract.client,
                payment,
                contract,
                milestoneId,
              );
            }

            if (contract && contract.freelancer) {
              // Freelancer: Funds escrowed
              await this.transactionService.createEscrowedTransaction(
                contract.freelancer,
                payment,
                contract,
                milestoneId,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `Error processing webhook event: ${error instanceof Error ? error.message : "Unknown error"}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw error;
        }
      });
    } else if (event.event === "charge.failed") {
      const data = event.data;
      const {
        reference,
        metadata: { contractId, milestoneId = null },
      } = data.reference;

      this.dataSource.transaction(async (manager) => {
        // Reset milestone or contract back to the state before payment was initiated
        if (!milestoneId) {
          // Payment was made for a full contract instead, use the contractId
          const contract = await this.contractRepo.findOne({
            where: { id: contractId },
          });

          if (!contract) throw new NotFoundException("Contract not found");

          contract.status = ContractStatus.AWAITING_PAYMENT;
          await this.contractRepo.save(contract);
        }

        if (milestoneId) {
          // Payment was made for a milestone, use the milestoneId
          const milestone = await this.milestoneRepo.findOne({
            where: { id: milestoneId },
          });

          if (!milestone) throw new NotFoundException("Milestone not found");

          milestone.status = MilestoneStatus.PENDING;
          await this.milestoneRepo.save(milestone);
        }

        // Handle Payment....
        // Find payment by reference (which is the payment ID)
        const payment = await this.paymentRepo.findOne({
          where: { id: reference },
        });

        if (!payment) {
          this.logger.warn(`Payment not found for reference: ${reference}`);
          return;
        }

        // Update payment status to failed
        if (payment.status === PaymentStatus.PENDING) {
          payment.status = PaymentStatus.FAILED;
          payment.providerRaw = {
            failedAt: new Date().toISOString(),
          };
          await manager.save(payment);
          this.logger.log(`Payment ${payment.id} marked as failed`);
        }
      });
    }
  }
}
