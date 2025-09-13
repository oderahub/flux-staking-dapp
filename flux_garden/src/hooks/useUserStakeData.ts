import { useState, useEffect, useCallback } from 'react'
import { StakingContract_ABI, MockToken_ABI } from '../config/ABI'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'
import { useEthersProvider } from './ethersAdapter'

const useUserStakeData = () => {
  const { address, isConnected } = useAccount()
  const ethersProvider = useEthersProvider()

  const [userStake, setUserStake] = useState('0')
  const [pendingRewards, setPendingRewards] = useState('0')
  const [timeUntilUnlock, setTimeUntilUnlock] = useState('0')
  const [canWithdraw, setCanWithdraw] = useState(false)
  const [userBalance, setUserBalance] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add validation for contract addresses
  const stakingContractAddress = import.meta.env.VITE_Staking_Contract
  const tokenContractAddress = import.meta.env.VITE_Mock_ERC20

  const fetchUserData = useCallback(async () => {
    if (!isConnected || !address || !ethersProvider) {
      return
    }

    // Validate contract addresses
    if (!stakingContractAddress || !tokenContractAddress) {
      setError('Contract addresses not configured. Check your environment variables.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const stakingContract = new ethers.Contract(
        stakingContractAddress,
        StakingContract_ABI,
        ethersProvider
      )
      const tokenContract = new ethers.Contract(tokenContractAddress, MockToken_ABI, ethersProvider)

      // Sequential calls instead of Promise.all to avoid batch limits
      console.log('Fetching user details...')
      const details = await stakingContract.getUserDetails(address)

      // Small delay to avoid overwhelming the RPC
      await new Promise((resolve) => setTimeout(resolve, 100))

      console.log('Fetching user balance...')
      const balance = await tokenContract.balanceOf(address)

      // Update state
      setUserStake(ethers.formatUnits(details.stakedAmount, 18))
      setPendingRewards(ethers.formatUnits(details.pendingRewards, 18))
      setTimeUntilUnlock(details.timeUntilUnlock.toString())
      setCanWithdraw(details.canWithdraw)
      setUserBalance(ethers.formatUnits(balance, 18))
    } catch (err: any) {
      console.error('Error fetching user stake data:', err)

      // More detailed error handling
      if (err.code === 'SERVER_ERROR' && err.message?.includes('Batch of more than 3 requests')) {
        setError(
          'RPC provider batch limit exceeded. Consider switching to a different RPC provider.'
        )
      } else if (err.code === 'INVALID_ARGUMENT' && err.message?.includes('target')) {
        setError('Invalid contract address. Check your environment configuration.')
      } else {
        setError(`Error fetching data: ${err.message || err}`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, ethersProvider, stakingContractAddress, tokenContractAddress])

  useEffect(() => {
    // Reset state if disconnected
    if (!isConnected || !address || !ethersProvider) {
      setUserStake('0')
      setPendingRewards('0')
      setTimeUntilUnlock('0')
      setCanWithdraw(false)
      setUserBalance('0')
      setIsLoading(false)
      setError(null)
      return
    }

    fetchUserData()
  }, [fetchUserData])

  useEffect(() => {
    // Set up event listeners separately to avoid conflicts
    if (!isConnected || !address || !ethersProvider || !stakingContractAddress) {
      return
    }

    try {
      const stakingContract = new ethers.Contract(
        stakingContractAddress,
        StakingContract_ABI,
        ethersProvider
      )

      const handleStakeEvent = () => {
        console.log('Stake event detected, refetching data...')
        setTimeout(fetchUserData, 1000) // Delay to ensure state is updated on-chain
      }

      const handleWithdrawEvent = () => {
        console.log('Withdraw event detected, refetching data...')
        setTimeout(fetchUserData, 1000)
      }

      const handleRewardsEvent = () => {
        console.log('Rewards claimed event detected, refetching data...')
        setTimeout(fetchUserData, 1000)
      }

      // Listen for relevant contract events
      stakingContract.on('Staked', handleStakeEvent)
      stakingContract.on('Withdrawn', handleWithdrawEvent)
      stakingContract.on('RewardsClaimed', handleRewardsEvent)

      return () => {
        // Clean up event listeners
        stakingContract.off('Staked', handleStakeEvent)
        stakingContract.off('Withdrawn', handleWithdrawEvent)
        stakingContract.off('RewardsClaimed', handleRewardsEvent)
      }
    } catch (err) {
      console.error('Error setting up event listeners:', err)
    }
  }, [address, isConnected, ethersProvider, stakingContractAddress, fetchUserData])

  // Manual refetch function
  const refetch = useCallback(() => {
    if (isConnected && address) {
      fetchUserData()
    }
  }, [isConnected, address, fetchUserData])

  return {
    userStake,
    pendingRewards,
    timeUntilUnlock,
    canWithdraw,
    userBalance,
    isLoading,
    error,
    address,
    refetch
  }
}

export default useUserStakeData
