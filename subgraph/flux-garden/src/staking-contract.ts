import { BigInt } from '@graphprotocol/graph-ts'
import {
  EmergencyWithdrawn,
  RewardRateUpdated,
  RewardsClaimed,
  Staked,
  Withdrawn
} from '../generated/StakingContract/StakingContract'
import {
  StakeEvent,
  WithdrawEvent,
  EmergencyWithdrawEvent,
  RewardsClaimedEvent,
  RewardRateUpdateEvent
} from '../generated/schema'
import { createTransaction, getOrCreateUser, getOrCreateProtocol } from './utils'

export function handleEmergencyWithdrawn(event: EmergencyWithdrawn): void {
  const tx = createTransaction(event)
  const user = getOrCreateUser(event.params.user)
  user.stakedAmount = user.stakedAmount.minus(event.params.amount)
  user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1))
  user.save()
  const id = event.transaction.hash.concatI32(event.logIndex.toI32())
  const emergencyWithdrawEvent = new EmergencyWithdrawEvent(id.toHexString())
  emergencyWithdrawEvent.user = user.id
  emergencyWithdrawEvent.amount = event.params.amount
  emergencyWithdrawEvent.penalty = event.params.penalty
  emergencyWithdrawEvent.timestamp = event.block.timestamp
  emergencyWithdrawEvent.newTotalStaked = event.params.newTotalStaked
  emergencyWithdrawEvent.transaction = tx.id
  emergencyWithdrawEvent.save()

  const protocol = getOrCreateProtocol()
  protocol.totalStaked = protocol.totalStaked.minus(event.params.amount)
  protocol.lastUpdatedTimestamp = event.block.timestamp
  protocol.save()
}

export function handleRewardRateUpdated(event: RewardRateUpdated): void {
  const tx = createTransaction(event)

  const id = event.transaction.hash.concatI32(event.logIndex.toI32())

  const rewardRateUpdateEvent = new RewardRateUpdateEvent(id.toHexString())
  rewardRateUpdateEvent.oldRewardRate = event.params.oldRate
  rewardRateUpdateEvent.newRewardRate = event.params.newRate
  rewardRateUpdateEvent.totalStaked = event.params.totalStaked
  rewardRateUpdateEvent.timestamp = event.block.timestamp
  rewardRateUpdateEvent.transaction = tx.id
  rewardRateUpdateEvent.save()

  const protocol = getOrCreateProtocol()
  protocol.currentRewardRate = event.params.newRate
  protocol.lastUpdatedTimestamp = event.block.timestamp
  protocol.save()
}

export function handleRewardsClaimed(event: RewardsClaimed): void {
  const tx = createTransaction(event)

  const user = getOrCreateUser(event.params.user)

  user.pendingRewards = event.params.newPendingRewards
  user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1))
  user.save()

  const id = event.transaction.hash.concatI32(event.logIndex.toI32())

  const rewardsClaimedEvent = new RewardsClaimedEvent(id.toHexString())
  rewardsClaimedEvent.user = user.id
  rewardsClaimedEvent.amount = event.params.amount
  rewardsClaimedEvent.timestamp = event.block.timestamp
  rewardsClaimedEvent.newPendingRewards = event.params.newPendingRewards
  rewardsClaimedEvent.totalStaked = event.params.totalStaked
  rewardsClaimedEvent.transaction = tx.id
  rewardsClaimedEvent.save()

  const protocol = getOrCreateProtocol()
  protocol.totalRewards = protocol.totalRewards.plus(event.params.amount)
  protocol.lastUpdatedTimestamp = event.block.timestamp
  protocol.save()
}

export function handleStaked(event: Staked): void {
  const tx = createTransaction(event)

  const user = getOrCreateUser(event.params.user)

  user.stakedAmount = user.stakedAmount.plus(event.params.amount)
  user.lastStakeTimestamp = event.block.timestamp
  user.canWithdraw = false
  user.timeUntilUnlock = BigInt.fromI32(86400) // default 1 day
  user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1))
  user.save()

  const id = event.transaction.hash.concatI32(event.logIndex.toI32())

  const stakeEvent = new StakeEvent(id.toHexString())
  stakeEvent.user = user.id
  stakeEvent.amount = event.params.amount
  stakeEvent.timestamp = event.block.timestamp
  stakeEvent.newTotalStaked = event.params.newTotalStaked
  stakeEvent.transaction = tx.id
  stakeEvent.save()

  const protocol = getOrCreateProtocol()
  protocol.totalStaked = event.params.newTotalStaked
  protocol.lastUpdatedTimestamp = event.block.timestamp
  protocol.save()
}

export function handleWithdrawn(event: Withdrawn): void {
  const tx = createTransaction(event)

  const user = getOrCreateUser(event.params.user)

  user.stakedAmount = user.stakedAmount.minus(event.params.amount)
  user.canWithdraw = true
  user.timeUntilUnlock = BigInt.fromI32(0)
  user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1))
  user.save()

  const id = event.transaction.hash.concatI32(event.logIndex.toI32())

  const withdrawEvent = new WithdrawEvent(id.toHexString())
  withdrawEvent.user = user.id
  withdrawEvent.amount = event.params.amount
  withdrawEvent.timestamp = event.block.timestamp
  withdrawEvent.newTotalStaked = event.params.newTotalStaked
  withdrawEvent.currentRewardRate = event.params.currentRewardRate
  withdrawEvent.rewardsAccrued = event.params.rewardsAccrued
  withdrawEvent.transaction = tx.id
  withdrawEvent.save()

  const protocol = getOrCreateProtocol()
  protocol.totalStaked = event.params.newTotalStaked
  protocol.totalRewards = protocol.totalRewards.plus(event.params.rewardsAccrued)
  protocol.lastUpdatedTimestamp = event.block.timestamp
  protocol.save()
}
