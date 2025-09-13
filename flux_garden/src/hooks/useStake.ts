import { StakingContract_ABI } from '../config/ABI.ts'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAccount, useWriteContract } from 'wagmi'

const useStake = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const stake = useCallback(
    async (amount: bigint) => {
      if (!address) {
        toast.error('Wallet not connected')
        throw new Error('Wallet not connected')
      }

      try {
        const result = await writeContractAsync({
          address: import.meta.env.VITE_Staking_Contract as `0x${string}`,
          abi: StakingContract_ABI,
          functionName: 'stake',
          args: [amount]
        })

        toast.success('Staking successful!')
        return result
      } catch (error) {
        toast.error('Staking failed')
        console.error('Staking error:', error)
        throw error
      }
    },
    [address, writeContractAsync]
  )

  return { stake }
}

export default useStake
