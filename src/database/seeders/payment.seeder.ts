// @ts-nocheck

import { DataSource } from "typeorm";
import { Contract } from "src/model/contract.entity";
import { Milestone, MilestoneStatus } from "src/model/milestone.entity";
import { Payment, PaymentStatus } from "src/model/payment.entity";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "src/model/transaction.entity";
import { Wallet } from "src/model/wallet.entity";
import { User } from "src/model/user.entity";

const PLATFORM_FEE_PERCENT = 10;

function paymentStatusFor(milestoneStatus: MilestoneStatus): PaymentStatus | null {
  switch (milestoneStatus) {
    case MilestoneStatus.RELEASED:
      return PaymentStatus.RELEASED;
    case MilestoneStatus.SUBMITTED:
      return PaymentStatus.ESCROWED;
    case MilestoneStatus.DISPUTED:
      return PaymentStatus.DISPUTED;
    default:
      return null;
  }
}

export async function seedPayments(dataSource: DataSource) {
  const contractRepo = dataSource.getRepository(Contract);
  const milestoneRepo = dataSource.getRepository(Milestone);
  const paymentRepo = dataSource.getRepository(Payment);
  const transactionRepo = dataSource.getRepository(Transaction);
  const walletRepo = dataSource.getRepository(Wallet);
  const userRepo = dataSource.getRepository(User);

  console.log("Starting payment seeding...");

  const existingPaymentCount = await paymentRepo.count();
  if (existingPaymentCount > 0) {
    console.log(
      `Payments already exist (${existingPaymentCount} found), skipping...`,
    );
    return;
  }

  const contracts = await contractRepo.find();

  for (const contract of contracts) {
    const payer = await userRepo.findOne({ where: { id: contract.clientId } });
    if (!payer) continue;

    // Only child milestones (those with a parentId) are ever paid for directly.
    const childMilestones = await milestoneRepo.find({
      where: { contractId: contract.id },
    });

    for (const milestone of childMilestones.filter((m) => !!m.parentId)) {
      const status = paymentStatusFor(milestone.status);
      if (!status) continue;

      const subtotal = milestone.amount;
      const platformFee = Math.round((subtotal * PLATFORM_FEE_PERCENT) / 100);
      const amount = subtotal + platformFee;

      const payment = await paymentRepo.save(
        paymentRepo.create({
          contractId: contract.id,
          payer,
          amount,
          subtotalAmount: subtotal,
          platformFeeAmount: platformFee,
          currency: contract.currency || "ngn",
          status,
          providerPaymentId: `seed_${contract.id}_${milestone.id}`,
          providerRaw: {
            metadata: {
              contractId: contract.id,
              milestoneId: milestone.id,
              paymentMode: "milestone",
              clientId: contract.clientId,
              freelancerId: contract.freelancerId,
            },
          },
        }),
      );

      await transactionRepo.save(
        transactionRepo.create({
          userId: contract.clientId,
          type: TransactionType.MILESTONE_PAYMENT,
          amount: payment.amount,
          currency: payment.currency,
          status: TransactionStatus.COMPLETED,
          description: `Payment for "${milestone.title}"`,
          contractId: contract.id,
          milestoneId: milestone.id,
          paymentId: payment.id,
        }),
      );

      const freelancerWallet = await walletRepo.findOne({
        where: { userId: contract.freelancerId },
      });

      const transactionType =
        status === PaymentStatus.RELEASED
          ? TransactionType.RELEASED
          : TransactionType.ESCROWED;

      let balanceAfter: number | undefined;
      if (status === PaymentStatus.RELEASED && freelancerWallet) {
        freelancerWallet.balance = Number(freelancerWallet.balance) + subtotal;
        await walletRepo.save(freelancerWallet);
        balanceAfter = Number(freelancerWallet.balance);
      }

      await transactionRepo.save(
        transactionRepo.create({
          userId: contract.freelancerId,
          type: transactionType,
          amount: subtotal,
          currency: payment.currency,
          status: TransactionStatus.COMPLETED,
          description: `Earnings for "${milestone.title}"`,
          contractId: contract.id,
          milestoneId: milestone.id,
          paymentId: payment.id,
          walletId: freelancerWallet?.id,
          balanceAfter,
        }),
      );
    }

    console.log(`Seeded payments for contract: ${contract.id}`);
  }

  // Give a few freelancers withdrawal history against their released earnings.
  const wallets = await walletRepo.find();
  const fundedWallets = wallets.filter((w) => Number(w.balance) > 0);
  const withdrawingWallets = fundedWallets.slice(0, Math.ceil(fundedWallets.length / 3));

  for (const wallet of withdrawingWallets) {
    const withdrawAmount = Math.round(Number(wallet.balance) * 0.4);
    if (withdrawAmount <= 0) continue;

    wallet.balance = Number(wallet.balance) - withdrawAmount;
    await walletRepo.save(wallet);

    await transactionRepo.save(
      transactionRepo.create({
        userId: wallet.userId,
        type: TransactionType.WITHDRAWN,
        amount: withdrawAmount,
        currency: wallet.currency,
        status: TransactionStatus.COMPLETED,
        description: "Withdrawal to bank account",
        walletId: wallet.id,
        balanceAfter: Number(wallet.balance),
        metadata: {
          withdrawalMethod: "bank_transfer",
          withdrawalAccount: "****1234",
        },
      }),
    );

    console.log(`Seeded withdrawal for wallet: ${wallet.id}`);
  }

  console.log("✅ Payment seeding completed successfully!");
}
