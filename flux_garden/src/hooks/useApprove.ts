import { MockToken_ABI } from '../config/ABI.ts'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAccount, useWriteContract } from 'wagmi'
// import { useAccount, useWriteContract, usePublicClient, useWalletClient } from 'wagmi'

const useApprove = () => {
  const { address } = useAccount()
  //const publicClient = usePublicClien();
  //const walletClientent = useWalletClient();
  const { writeContractAsync } = useWriteContract()

  const approve = useCallback(
    async (amount: bigint) => {
      // Change parameter type to bigint
      if (!address) {
        toast.error('Wallet not connected')
        throw new Error('Wallet not connected')
      }

      try {
        const result = await writeContractAsync({
          address: import.meta.env.VITE_Mock_ERC20,
          abi: MockToken_ABI,
          functionName: 'approve',
          args: [import.meta.env.VITE_Staking_Contract as `0x${string}`, amount]
          //   account: address,
          //   chain: publicClient.chain
        })

        toast.success('Approval successful!')
        return result
      } catch (error) {
        toast.error('Approval failed')
        console.error('Approval error:', error)
        throw error
      }
    },
    [address, writeContractAsync]
  )

  return { approve }
}

export default useApprove
