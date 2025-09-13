import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAccount, useWriteContract } from 'wagmi'
import { StakingContract_ABI } from '../config/ABI'

const useWithdraw = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const withdraw = useCallback(
    async (amount: bigint) => {
      if (!address) {
        toast.error('Wallet not connected')
        throw new Error('Wallet not connected')
      }
      try {
        const result = await writeContractAsync({
          address: import.meta.env.VITE_Staking_Contract as `0x${string}`,
          abi: StakingContract_ABI,
          functionName: 'withdraw',
          args: [amount]
        })
        toast.success('Withdraw successful!')
        return result
      } catch (error) {
        toast.error('Withdraw failed')
        console.error('Withdraw error:', error)
        throw error
      }
    },
    [address, writeContractAsync]
  )

  return { withdraw }
}

export default useWithdraw
