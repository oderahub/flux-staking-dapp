import { BigInt } from '@graphprotocol/graph-ts'
import { Approval, Transfer } from '../generated/MockToken/MockToken'
import { ApprovalEvent, TransferEvent } from '../generated/schema'
import { createTransaction, getOrCreateUser } from './utils'

export function handleApproval(event: Approval): void {
  const tx = createTransaction(event)

  const owner = getOrCreateUser(event.params.owner)
  const spender = getOrCreateUser(event.params.spender)

  owner.transactionCount = owner.transactionCount.plus(BigInt.fromI32(1))
  owner.save()

  const id = event.transaction.hash.concatI32(event.logIndex.toI32())

  const approvalEvent = new ApprovalEvent(id.toHexString())
  approvalEvent.owner = owner.id
  approvalEvent.spender = spender.id
  approvalEvent.value = event.params.value
  approvalEvent.timestamp = event.block.timestamp
  approvalEvent.transaction = tx.id
  approvalEvent.save()
}

export function handleTransfer(event: Transfer): void {
  const tx = createTransaction(event)

  const from = getOrCreateUser(event.params.from)
  const to = getOrCreateUser(event.params.to)

  from.transactionCount = from.transactionCount.plus(BigInt.fromI32(1))
  from.save()

  const id = event.transaction.hash.concatI32(event.logIndex.toI32())

  const transferEvent = new TransferEvent(id.toHexString())
  transferEvent.from = from.id
  transferEvent.to = to.id
  transferEvent.value = event.params.value
  transferEvent.timestamp = event.block.timestamp
  transferEvent.transaction = tx.id
  transferEvent.save()
}
