import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAccount, useWriteContract } from 'wagmi'
import { StakingContract_ABI } from '../config/ABI'

const useEmergency = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const emergencyWithdraw = useCallback(async () => {
    if (!address) {
      toast.error('Wallet not connected')
      throw new Error('Wallet not connected')
    }
    try {
      const result = await writeContractAsync({
        address: import.meta.env.VITE_Staking_Contract as `0x${string}`,
        abi: StakingContract_ABI,
        functionName: 'emergencyWithdraw',
        args: []
      })
      toast.success('Emergency withdrawal successful!')
      return result
    } catch (error) {
      toast.error('Emergency withdrawal failed')
      console.error('Emergency withdrawal error:', error)
      throw error
    }
  }, [address, writeContractAsync])

  return { emergencyWithdraw }
}

export default useEmergency
