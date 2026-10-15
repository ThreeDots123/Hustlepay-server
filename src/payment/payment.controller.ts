import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
  Headers,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { PaymentService } from "./payment.service";
import { InitiatePaymentDto, PaymentMode } from "./dto/create-payment.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";

@ApiTags("Payments")
@Controller("payments")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private userService: UsersService,
  ) {}

  @Get("checkout")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get checkout details",
    description:
      "Returns subtotal, platform fee, and total for the checkout page. Use before initiating payment for full contract or milestone.",
  })
  @ApiResponse({
    status: 200,
    description: "Checkout breakdown",
    schema: {
      type: "object",
      properties: {
        subtotal: { type: "number" },
        platformFee: { type: "number" },
        total: { type: "number" },
        currency: { type: "string" },
        paymentMode: { enum: ["full", "milestone"] },
        contractId: { type: "string" },
        milestoneId: { type: "string" },
        milestoneTitle: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 403, description: "Forbidden - not the contract client" })
  @ApiResponse({ status: 404, description: "Contract or milestone not found" })
  async getCheckoutDetails(
    @Req() request: Request,
    @Query("contractId") contractId: string,
    @Query("paymentMode") paymentMode: string,
    @Query("milestoneId") milestoneId?: string,
  ) {
    if (!contractId) {
      throw new BadRequestException("contractId is required");
    }
    const mode =
      paymentMode === "full"
        ? PaymentMode.FULL
        : paymentMode === "milestone"
          ? PaymentMode.MILESTONE
          : null;
    if (mode === null) {
      throw new BadRequestException(
        "paymentMode must be 'full' or 'milestone'",
      );
    }
    const { id } = request.user as AuthorisedRequest;
    return this.paymentService.getCheckoutDetails(id, {
      contractId,
      paymentMode: mode,
      ...(mode === PaymentMode.MILESTONE && milestoneId
        ? { milestoneId }
        : {}),
    });
  }

  @Post("initiate")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Initiate a payment",
    description:
      "Initiates a payment for a contract. Can be either full upfront payment or milestone-based payment. Returns Paystack authorization URL for payment.",
  })
  @ApiBody({
    type: InitiatePaymentDto,
    description: "Payment initiation data",
  })
  @ApiResponse({
    status: 201,
    description: "Payment initiated successfully",
    schema: {
      type: "object",
      properties: {
        authorizationUrl: {
          type: "string",
          example: "https://checkout.paystack.com/xxxxx",
        },
        paymentId: {
          type: "string",
          example: "pymt_01ARZ3NDEKTSV4RRFFQ69G5FAV",
        },
        reference: {
          type: "string",
          example: "ref_xxxxx",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation error or invalid payment request",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client or not the contract owner",
  })
  @ApiResponse({
    status: 404,
    description: "Contract or milestone not found",
  })
  async initiatePayment(
    @Req() request: Request,
    @Body() dto: InitiatePaymentDto,
  ) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.paymentService.initiatePayment(user, dto);
  }

  @Get("profit")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get platform profit from payment fees",
    description:
      "Returns total profit (sum of platform fees) and per-payment breakdown for payments that are escrowed or released.",
  })
  @ApiResponse({
    status: 200,
    description: "Profit summary and payment list",
    schema: {
      type: "object",
      properties: {
        totalProfit: { type: "number" },
        currency: { type: "string" },
        payments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              amount: { type: "number" },
              subtotalAmount: { type: "number" },
              platformFeeAmount: { type: "number" },
              status: { type: "string" },
              contractId: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  })
  async getPlatformProfit(@Req() request: Request) {
    return this.paymentService.getPlatformProfit();
  }

  @Get("contract/:contractId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get payments for a contract",
    description:
      "Retrieves all payments associated with a contract. Both client and freelancer can view payments.",
  })
  @ApiParam({
    name: "contractId",
    description: "Contract ID",
    type: String,
    example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Payments retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not involved in this contract",
  })
  @ApiResponse({
    status: 404,
    description: "Contract not found",
  })
  async getPaymentsForContract(
    @Param("contractId") contractId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.paymentService.getPaymentsForContract(contractId, id);
  }

  @Get("verify/:reference")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Verify a payment",
    description: "Verifies a payment using a reference",
  })
  @ApiParam({
    name: "reference",
    description: "Payment reference",
  })
  @ApiResponse({
    status: 200,
    description: "Payment verified successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Missing or invalid reference",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 404,
    description: "Payment not found",
  })
  async verifyPayment(
    @Param("reference") reference: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.paymentService.getPaymentByReference(reference);
  }

  @Post("verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Verify payment using contract or milestone ID",
    description:
      "Searches for a payment based on contractId and optionally milestoneId, then verifies the transaction with Paystack and updates appropriate records",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        contractId: {
          type: "string",
          description: "Contract ID",
          example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
        },
        milestoneId: {
          type: "string",
          description: "Milestone ID (optional, for milestone payments)",
          example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
        },
      },
      required: ["contractId"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Payment verified successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Missing or invalid contractId",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 404,
    description: "Contract or payment not found",
  })
  async verifyPaymentUsingContractOrMilestone(
    @Body() body: { contractId: string; milestoneId?: string },
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.paymentService.verifyPaymentUsingContractOrMilestoneId({
      contractId: body.contractId,
      milestoneId: body.milestoneId,
    });
  }

  @Post("webhook")
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: "Paystack webhook endpoint",
    description:
      "Handles Paystack webhook events. Verifies signature and processes payment events.",
  })
  @ApiResponse({
    status: 200,
    description: "Webhook processed successfully",
  })
  async handleWebhook(
    // @Req() request: RawBodyRequest<Request>,
    @Headers("x-paystack-signature") signature: string,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new BadRequestException("Missing Paystack signature");
    }

    // Get raw body as string for signature verification
    const rawBody = JSON.stringify(body);

    // Verify webhook signature
    const isValid = this.paymentService.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isValid) return;

    // Process webhook event
    await this.paymentService.handleWebhookEvent(body);

    return { status: "success" };
  }
}
