// @ts-nocheck

import { DataSource } from "typeorm";
import { Proposal, ProposalStatus } from "src/model/proposal.entity";
import { Bid, BidStatus } from "src/model/bid.entity";
import { Contract, ContractStatus } from "src/model/contract.entity";
import { Milestone, MilestoneStatus } from "src/model/milestone.entity";
import { Deliverable, DeliverableStatus } from "src/model/deliverable.entity";

// Cycle of overall contract outcomes, applied in order across hired proposals
// so the demo data shows every stage of the contract lifecycle.
const STATUS_CYCLE: Array<{
  status: ContractStatus;
  firstMilestone: MilestoneStatus;
  secondMilestone: MilestoneStatus;
}> = [
  {
    status: ContractStatus.AWAITING_PAYMENT,
    firstMilestone: MilestoneStatus.PENDING,
    secondMilestone: MilestoneStatus.PENDING,
  },
  {
    status: ContractStatus.ACTIVE,
    firstMilestone: MilestoneStatus.RELEASED,
    secondMilestone: MilestoneStatus.SUBMITTED,
  },
  {
    status: ContractStatus.COMPLETED,
    firstMilestone: MilestoneStatus.RELEASED,
    secondMilestone: MilestoneStatus.RELEASED,
  },
  {
    status: ContractStatus.SUBMITTED,
    firstMilestone: MilestoneStatus.RELEASED,
    secondMilestone: MilestoneStatus.SUBMITTED,
  },
  {
    status: ContractStatus.DISPUTED,
    firstMilestone: MilestoneStatus.RELEASED,
    secondMilestone: MilestoneStatus.DISPUTED,
  },
  {
    status: ContractStatus.PAUSED,
    firstMilestone: MilestoneStatus.RELEASED,
    secondMilestone: MilestoneStatus.PENDING,
  },
];

function deliverableStatusFor(milestoneStatus: MilestoneStatus): DeliverableStatus | null {
  switch (milestoneStatus) {
    case MilestoneStatus.RELEASED:
      return DeliverableStatus.VERIFIED;
    case MilestoneStatus.SUBMITTED:
    case MilestoneStatus.DISPUTED:
      return DeliverableStatus.COMPLETED;
    default:
      return null;
  }
}

export async function seedContracts(dataSource: DataSource) {
  const proposalRepo = dataSource.getRepository(Proposal);
  const bidRepo = dataSource.getRepository(Bid);
  const contractRepo = dataSource.getRepository(Contract);
  const milestoneRepo = dataSource.getRepository(Milestone);
  const deliverableRepo = dataSource.getRepository(Deliverable);

  console.log("Starting contract seeding...");

  const existingContractCount = await contractRepo.count();
  if (existingContractCount > 0) {
    console.log(
      `Contracts already exist (${existingContractCount} found), skipping...`,
    );
    return;
  }

  const hiredProposals = await proposalRepo.find({
    where: { status: ProposalStatus.HIRED },
  });

  let cycleIndex = 0;
  for (const proposal of hiredProposals) {
    const acceptedBid = await bidRepo.findOne({
      where: { proposalId: proposal.id, status: BidStatus.ACCEPTED },
    });
    if (!acceptedBid) continue;

    const outcome = STATUS_CYCLE[cycleIndex % STATUS_CYCLE.length];
    cycleIndex++;

    const contract = await contractRepo.save(
      contractRepo.create({
        proposalId: proposal.id,
        bidId: acceptedBid.id,
        clientId: proposal.clientId,
        freelancerId: acceptedBid.freelancerId,
        amount: acceptedBid.proposedBudget,
        currency: proposal.currency || "ngn",
        durationDays: acceptedBid.proposedDurationDays,
        rateType: acceptedBid.rateType,
        startedAt: outcome.status === ContractStatus.AWAITING_PAYMENT ? null : new Date(),
        status: outcome.status,
      }),
    );

    const halfAmount = Math.round(contract.amount / 2);
    const milestoneDefs = [
      { title: "Milestone 1: Initial Delivery", amount: halfAmount, status: outcome.firstMilestone },
      {
        title: "Milestone 2: Final Delivery",
        amount: contract.amount - halfAmount,
        status: outcome.secondMilestone,
      },
    ];

    for (const def of milestoneDefs) {
      // Parent milestone groups the payable child milestone, mirroring how
      // the app requires freelancer acceptance before a child can be paid.
      const parent = await milestoneRepo.save(
        milestoneRepo.create({
          contractId: contract.id,
          title: def.title,
          amount: def.amount,
          durationDays: Math.round((contract.durationDays || 14) / 2),
          status: MilestoneStatus.ACCEPTED,
        }),
      );

      const child = await milestoneRepo.save(
        milestoneRepo.create({
          contractId: contract.id,
          parentId: parent.id,
          title: def.title,
          amount: def.amount,
          durationDays: Math.round((contract.durationDays || 14) / 2),
          startedAt: def.status === MilestoneStatus.PENDING ? null : new Date(),
          status: def.status,
        }),
      );

      const deliverableStatus = deliverableStatusFor(def.status);
      if (deliverableStatus) {
        await deliverableRepo.save(
          deliverableRepo.create({
            milestoneId: child.id,
            title: `${def.title} deliverable`,
            description: "Submitted deliverable for client review.",
            status: deliverableStatus,
          }),
        );
      }
    }

    console.log(
      `Seeded contract for proposal "${proposal.title}" (status: ${outcome.status})`,
    );
  }

  console.log("✅ Contract seeding completed successfully!");
}
