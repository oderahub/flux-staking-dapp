import { useQuery } from '@tanstack/react-query'
import { graphqlClient } from '../config/graphql-client'
import { gql } from 'graphql-request'

// Utility function to safely execute GraphQL requests and handle errors
async function try_function<T>(callback: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await callback()
  } catch (error) {
    console.error('GraphQL request failed:', error)
    return fallback
  }
}

// Query to get protocol stats
const PROTOCOL_QUERY = gql`
  query GetProtocolStats {
    protocols(first: 1) {
      id
      totalStaked
      totalRewards
      currentRewardRate
      userCount
      lastUpdatedTimestamp
    }
  }
`

// Query to get user data
const USER_QUERY = gql`
  query GetUserData($userAddress: ID!) {
    user(id: $userAddress) {
      id
      stakedAmount
      pendingRewards
      lastStakeTimestamp
      canWithdraw
      timeUntilUnlock
      transactionCount
      stakeEvents(first: 5, orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
        newTotalStaked
      }
      withdrawEvents(first: 5, orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
        newTotalStaked
        rewardsAccrued
        currentRewardRate
      }
      rewardClaimEvents(first: 5, orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
        newPendingRewards
      }
    }
  }
`

// Define protocol data type
type ProtocolData = {
  id: string
  totalStaked: string
  totalRewards: string
  currentRewardRate: string
  userCount: string
  lastUpdatedTimestamp: string
}

// Hook to fetch protocol stats
export function useProtocolStats() {
  return useQuery<ProtocolData>({
    queryKey: ['protocolStats'],
    queryFn: async () => {
      return try_function(async () => {
        const data = await graphqlClient.request<{ protocols: ProtocolData[] }>(PROTOCOL_QUERY)
        return data.protocols[0] || {} as ProtocolData
      }, {} as ProtocolData)
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// Define event types
type StakeEvent = {
  id: string
  amount: string
  timestamp: string
  newTotalStaked: string
}

type WithdrawEvent = {
  id: string
  amount: string
  timestamp: string
  newTotalStaked: string
  rewardsAccrued: string
  currentRewardRate: string
}

type RewardClaimEvent = {
  id: string
  amount: string
  timestamp: string
  newPendingRewards: string
}

// Define user data type
type UserData = {
  id: string
  stakedAmount: string
  pendingRewards: string
  lastStakeTimestamp: string
  canWithdraw: boolean
  timeUntilUnlock: string
  transactionCount: string
  stakeEvents: StakeEvent[]
  withdrawEvents: WithdrawEvent[]
  rewardClaimEvents: RewardClaimEvent[]
}

// Hook to fetch user data
export function useUserSubgraphData(userAddress: string | undefined) {
  return useQuery<UserData | null>({
    queryKey: ['userData', userAddress],
    queryFn: async () => {
      if (!userAddress) return null

      return try_function(async () => {
        const data = await graphqlClient.request<{ user: UserData | null }>(USER_QUERY, {
          userAddress: userAddress.toLowerCase()
        })
        return data.user
      }, null)
    },
    enabled: !!userAddress,
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    // onError callback removed as it's not supported in the useQuery options
  })
}
