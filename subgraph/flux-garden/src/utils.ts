import { BigInt, Address, ethereum } from '@graphprotocol/graph-ts'
import { User, Protocol, Transaction } from '../generated/schema'

export function createTransaction(event: ethereum.Event): Transaction {
  const txId = event.transaction.hash.toHexString()
  let tx = Transaction.load(txId)
  if (!tx) {
    tx = new Transaction(txId)
    tx.blockNumber = event.block.number
    tx.blockTimestamp = event.block.timestamp
    tx.save()
  }
  return tx as Transaction
}

export function getOrCreateUser(address: Address): User {
  const userId = address.toHexString()
  let user = User.load(userId)

  if (!user) {
    user = new User(userId)
    user.stakedAmount = BigInt.fromI32(0)
    user.pendingRewards = BigInt.fromI32(0)
    user.lastStakeTimestamp = BigInt.fromI32(0)
    user.canWithdraw = false
    user.timeUntilUnlock = BigInt.fromI32(0)
    user.transactionCount = BigInt.fromI32(0)
    user.save()

    const protocol = getOrCreateProtocol()
    protocol.userCount = protocol.userCount.plus(BigInt.fromI32(1))
    protocol.save()
  }

  return user as User
}

export function getOrCreateProtocol(): Protocol {
  const PROTOCOL_ID = 'flux-garden'
  let protocol = Protocol.load(PROTOCOL_ID)

  if (!protocol) {
    protocol = new Protocol(PROTOCOL_ID)
    protocol.totalStaked = BigInt.fromI32(0)
    protocol.totalRewards = BigInt.fromI32(0)
    protocol.currentRewardRate = BigInt.fromI32(0)
    protocol.stakingTokenAddress = '0x0000000000000000000000000000000000000000'
    protocol.userCount = BigInt.fromI32(0)
    protocol.lastUpdatedTimestamp = BigInt.fromI32(0)
    protocol.save()
  }

  return protocol as Protocol
}
