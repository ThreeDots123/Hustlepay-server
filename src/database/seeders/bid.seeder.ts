// @ts-nocheck

import { DataSource } from "typeorm";
import { Proposal, ProposalStatus } from "src/model/proposal.entity";
import {
  Bid,
  BidStatus,
  BidRateType,
  BidExperienceLevel,
} from "src/model/bid.entity";
import { FreelancerProfile } from "src/model/freelancer-profile.entity";
import { COVER_LETTERS } from "./seed-data";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function seedBids(dataSource: DataSource) {
  const proposalRepo = dataSource.getRepository(Proposal);
  const bidRepo = dataSource.getRepository(Bid);
  const freelancerProfileRepo = dataSource.getRepository(FreelancerProfile);

  console.log("Starting bid seeding...");

  const existingBidCount = await bidRepo.count();
  if (existingBidCount > 0) {
    console.log(`Bids already exist (${existingBidCount} found), skipping...`);
    return;
  }

  const proposals = await proposalRepo.find({ relations: ["skills"] });
  const profiles = await freelancerProfileRepo.find({ relations: ["skills"] });

  const experienceLevels = Object.values(BidExperienceLevel);
  let hiredCount = 0;

  for (let i = 0; i < proposals.length; i++) {
    const proposal = proposals[i];
    const proposalSkillNames = (proposal.skills || []).map((s) => s.name);

    let candidates = profiles.filter((p) =>
      (p.skills || []).some((s) => proposalSkillNames.includes(s.name)),
    );
    if (candidates.length < 2) candidates = profiles;

    const bidCount = Math.min(candidates.length, 2 + (i % 3));
    const chosenProfiles = shuffle(candidates).slice(0, bidCount);

    const budgetMin = proposal.budgetMin ?? 200;
    const budgetMax = proposal.budgetMax ?? budgetMin;

    const bidsForProposal: Bid[] = [];
    for (let j = 0; j < chosenProfiles.length; j++) {
      const profile = chosenProfiles[j];
      const proposedBudget =
        budgetMin + Math.round((budgetMax - budgetMin) * Math.random());

      const bid = await bidRepo.save(
        bidRepo.create({
          freelancerId: profile.userId,
          proposalId: proposal.id,
          title: `Proposal for "${proposal.title}"`,
          coverLetter: COVER_LETTERS[(i + j) % COVER_LETTERS.length],
          proposedBudget: proposedBudget || budgetMin,
          rateType: BidRateType.FIXED,
          proposedDurationDays: proposal.durationEstimateDays || 7,
          experience: experienceLevels[(i + j) % experienceLevels.length],
          status: BidStatus.PENDING,
        }),
      );
      bidsForProposal.push(bid);
    }

    // Convert roughly a third of proposals into hired/accepted bids, which
    // feeds the contract/payment seeders below.
    const willHire = i % 3 === 0 && bidsForProposal.length > 0;
    if (willHire) {
      const [accepted, ...rest] = bidsForProposal;
      accepted.status = BidStatus.ACCEPTED;
      await bidRepo.save(accepted);

      for (const bid of rest) {
        bid.status = BidStatus.REJECTED;
        await bidRepo.save(bid);
      }

      proposal.status = ProposalStatus.HIRED;
      await proposalRepo.save(proposal);
      hiredCount++;
    }

    console.log(
      `Seeded ${bidsForProposal.length} bid(s) for proposal: ${proposal.title}${
        willHire ? " (hired)" : ""
      }`,
    );
  }

  console.log(
    `✅ Bid seeding completed successfully! ${hiredCount} proposals hired.`,
  );
}
