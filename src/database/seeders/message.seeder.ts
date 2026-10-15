// @ts-nocheck

import { DataSource } from "typeorm";
import { Proposal } from "src/model/proposal.entity";
import { Bid, BidStatus } from "src/model/bid.entity";
import { Contract } from "src/model/contract.entity";
import { Message } from "src/model/message.entity";
import { PROPOSAL_MESSAGE_PAIRS, CONTRACT_MESSAGE_SETS } from "./seed-data";

export async function seedMessages(dataSource: DataSource) {
  const proposalRepo = dataSource.getRepository(Proposal);
  const bidRepo = dataSource.getRepository(Bid);
  const contractRepo = dataSource.getRepository(Contract);
  const messageRepo = dataSource.getRepository(Message);

  console.log("Starting message seeding...");

  const existingMessageCount = await messageRepo.count();
  if (existingMessageCount > 0) {
    console.log(
      `Messages already exist (${existingMessageCount} found), skipping...`,
    );
    return;
  }

  // Pre-hire chat between a client and one of the bidders on their proposal.
  const proposals = await proposalRepo.find();
  for (let i = 0; i < proposals.length; i++) {
    const proposal = proposals[i];
    const bid = await bidRepo.findOne({ where: { proposalId: proposal.id } });
    if (!bid) continue;

    const [clientLine, freelancerLine] =
      PROPOSAL_MESSAGE_PAIRS[i % PROPOSAL_MESSAGE_PAIRS.length];

    await messageRepo.save(
      messageRepo.create({
        senderId: proposal.clientId,
        proposalId: proposal.id,
        body: clientLine,
        isRead: true,
      }),
    );
    await messageRepo.save(
      messageRepo.create({
        senderId: bid.freelancerId,
        proposalId: proposal.id,
        body: freelancerLine,
        isRead: bid.status !== BidStatus.PENDING,
      }),
    );
  }

  // Post-hire chat on each contract, alternating between client and freelancer.
  const contracts = await contractRepo.find();
  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i];
    const lines = CONTRACT_MESSAGE_SETS[i % CONTRACT_MESSAGE_SETS.length];

    for (let j = 0; j < lines.length; j++) {
      const senderId = j % 2 === 0 ? contract.freelancerId : contract.clientId;
      await messageRepo.save(
        messageRepo.create({
          senderId,
          contractId: contract.id,
          body: lines[j],
          // Leave the very last message unread, as if the recipient hasn't
          // opened the thread yet.
          isRead: j !== lines.length - 1,
        }),
      );
    }
  }

  console.log("✅ Message seeding completed successfully!");
}
