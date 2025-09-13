import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAccount, useWriteContract } from 'wagmi'
import { StakingContract_ABI } from '../config/ABI'

const useClaimReward = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const claimRewards = useCallback(async () => {
    if (!address) {
      toast.error('Wallet not connected')
      throw new Error('Wallet not connected')
    }
    try {
      const result = await writeContractAsync({
        address: import.meta.env.VITE_Staking_Contract as `0x${string}`,
        abi: StakingContract_ABI,
        functionName: 'claimRewards',
        args: []
      })
      toast.success('Rewards claimed successfully!')
      return result
    } catch (error) {
      toast.error('Claiming rewards failed')
      console.error('Claiming rewards error:', error)
      throw error
    }
  }, [address, writeContractAsync])

  return { claimRewards }
}

export default useClaimReward
