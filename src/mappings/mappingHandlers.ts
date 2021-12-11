import { SubstrateEvent } from "@subql/types";
import { bool, Int } from "@polkadot/types";
import { Proposal, VoteHistory, Councillor } from "../types/models";

export async function handleCouncilProposedEvent(
  event: SubstrateEvent
): Promise<void> {
  const {
    event: {
      data: [accountId, proposal_index, proposal_hash, threshold],
    },
  } = event;
  const proposal = new Proposal(proposal_hash.toString());
  proposal.index = proposal_index.toString();
  proposal.account = accountId.toString();
  proposal.hash = proposal_hash.toString();
  proposal.voteThreshold = threshold.toString();
  proposal.block = event.block.block.header.number.toBigInt();
  await proposal.save();
}

export async function handleCouncilVotedEvent(
  event: SubstrateEvent
): Promise<void> {
  // logger.info(JSON.stringify(event.event.data));
  const {
    event: {
      data: [councilorId, proposal_hash, approved_vote, numberYes, numberNo],
    },
  } = event;

  await ensureCouncillor(councilorId.toString());
  // Retrieve the record by the accountID
  const voteHistory = new VoteHistory(
    `${event.block.block.header.number.toNumber()}-${event.idx}`
  );
  voteHistory.proposalHashId = proposal_hash.toString();
  voteHistory.approvedVote = (approved_vote as bool).valueOf();
  voteHistory.councillorId = councilorId.toString();
  voteHistory.votedYes = (numberYes as Int).toNumber();
  voteHistory.votedNo = (numberNo as Int).toNumber();
  voteHistory.block = event.block.block.header.number.toNumber();
  // logger.info(JSON.stringify(voteHistory));
  await voteHistory.save();
}

async function ensureCouncillor(accountId: string): Promise<void> {
  // ensure that our account entities exist
  let councillor = await Councillor.get(accountId);
  if (!councillor) {
    councillor = new Councillor(accountId);
    councillor.numberOfVotes = 0;
  }
  councillor.numberOfVotes += 1;
  await councillor.save();
}
