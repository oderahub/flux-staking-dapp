import { useState, useEffect } from 'react'
import { StakingContract_ABI } from '../config/ABI'
import { ethers } from 'ethers'
import { useEthersProvider } from './ethersAdapter'

const useProtocolStats = () => {
  const provider = useEthersProvider()
  const [totalStaked, setTotalStaked] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!provider) return
    setIsLoading(true)
    setError(null)
    const stakingContract = new ethers.Contract(
      import.meta.env.VITE_Staking_Contract,
      StakingContract_ABI,
      provider
    )
    const fetchStats = async () => {
      try {
        const staked = await stakingContract.totalStaked()
        setTotalStaked(ethers.formatUnits(staked, 18))
      } catch (err) {
        setError('Error fetching total staked')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
    // Listen for Staked/Withdrawn events to update
    const refetchOnEvent = () => fetchStats()
    stakingContract.on('Staked', refetchOnEvent)
    stakingContract.on('Withdrawn', refetchOnEvent)
    return () => {
      stakingContract.off('Staked', refetchOnEvent)
      stakingContract.off('Withdrawn', refetchOnEvent)
    }
  }, [provider])

  return { totalStaked, isLoading, error }
}

export default useProtocolStats
