import { useState } from 'react'
import useUserStakeData from './hooks/useUserStakeData'
import { Clock, Coins, TrendingUp, Users, Wallet, AlertTriangle, Award } from 'lucide-react'
import useApprove from './hooks/useApprove'
import useStake from './hooks/useStake'
import useEmergency from './hooks/useEmergency'
import useClaimReward from './hooks/useclaimReward'
import useWithdraw from './hooks/useWithdraw'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { parseUnits } from 'viem/utils'
import { useProtocolStats, useUserSubgraphData } from './hooks/useSubgraphData'
import { useAccount } from 'wagmi'

const StakingFrontend = () => {
  const [stakeAmount, setStakeAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const { approve } = useApprove()
  const { stake } = useStake()
  const { emergencyWithdraw } = useEmergency()
  const { claimRewards } = useClaimReward()
  const { withdraw } = useWithdraw()
  const { address } = useAccount()

  // Get on-chain data via ethers
  const { userBalance } = useUserStakeData()
  
  // Get indexed data from subgraph
  const { data: protocolData, isLoading: protocolLoading, error: protocolError } = useProtocolStats()
  const { data: userData, isLoading: userDataLoading, error: userDataError } = useUserSubgraphData(address)
  
  // Loading and error states for UI
  const isLoading = protocolLoading || userDataLoading
  const hasError = !!protocolError || !!userDataError
  
  // Format data from subgraph
  const userStake = userData && userData.stakedAmount ? (parseInt(userData.stakedAmount) / 1e18).toString() : '0'
  const pendingRewards = userData && userData.pendingRewards ? (parseInt(userData.pendingRewards) / 1e18).toString() : '0'
  const timeUntilUnlock = userData && userData.timeUntilUnlock ? userData.timeUntilUnlock : '0'
  const canWithdraw = userData && typeof userData.canWithdraw === 'boolean' ? userData.canWithdraw : false
  const totalStaked = protocolData && protocolData.totalStaked ? (parseInt(protocolData.totalStaked) / 1e18).toString() : '0'
  const currentApr = protocolData && protocolData.currentRewardRate ? `${(parseInt(protocolData.currentRewardRate) / 1e8).toFixed(2)}%` : '0%'
  const rewardRate = protocolData && protocolData.currentRewardRate ? (parseInt(protocolData.currentRewardRate) / 1e18).toString() : '0'
  
  // Get user transaction history from subgraph
  const stakeHistory = userData && userData.stakeEvents ? userData.stakeEvents : []
  const withdrawHistory = userData && userData.withdrawEvents ? userData.withdrawEvents : []
  const rewardClaimHistory = userData && userData.rewardClaimEvents ? userData.rewardClaimEvents : []

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      return
    }
    try {
      // ethers.js parseUnits returns a BigNumber, convert to bigint for wagmi/viem
      const amountInWei = BigInt(parseUnits(stakeAmount, 18).toString())
      await stake(amountInWei)
    } catch (error) {
      console.error(error)
    }
  }

  const handleApprove = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      return
    }
    try {
      const amountInWei = parseUnits(stakeAmount, 18)
      await approve(amountInWei)
      // setStakeAmount('')
    } catch (error) {
      console.error('Stake process failed:', error)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      return
    }
    try {
      const amountInWei = BigInt(parseUnits(withdrawAmount, 18).toString())
      await withdraw(amountInWei)
    } catch (error) {
      console.error('Withdraw failed:', error)
    }
  }

  const handleClaimRewards = async () => {
    try {
      await claimRewards()
    } catch (error) {
      console.error('Claim rewards failed:', error)
    }
  }

  const handleEmergencyWithdraw = async () => {
    try {
      await emergencyWithdraw()
    } catch (error) {
      console.error('Emergency withdrawal failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b-2 border-yellow-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">StakeVault</h1>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {hasError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              <p className="text-red-700 font-medium">Error loading data from subgraph</p>
            </div>
            <p className="text-red-600 mt-2 text-sm">
              There was an error connecting to The Graph. Using fallback data instead. Please try again later.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Staking Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Coins className="w-6 h-6 text-yellow-500 mr-2" />
                Stake Tokens
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Stake
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-3 text-sm text-gray-500">
                      Balance: {userBalance}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleStake}
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Stake
                  </button>
                </div>
              </div>
            </div>

            {/* Withdrawal Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 text-yellow-500 mr-2" />
                Withdraw & Rewards
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Withdraw
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    disabled={!canWithdraw}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleWithdraw}
                    disabled={!canWithdraw}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={handleClaimRewards}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Award className="w-4 h-4 mr-1" />
                    Claim Rewards
                  </button>
                  <button
                    onClick={handleEmergencyWithdraw}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Emergency
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* User Position */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Wallet className="w-5 h-5 text-yellow-500 mr-2" />
                Your Position
              </h3>

              {isLoading && !userData ? (
                <div className="py-4 text-center">
                  <div className="animate-pulse flex flex-col space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                  </div>
                  <p className="text-gray-500 mt-3">Loading position data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Staked Amount</span>
                    <span className="font-semibold text-gray-800">{userStake}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Rewards</span>
                    <span className="font-semibold text-green-600">{pendingRewards}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Time to Unlock
                    </span>
                    <span className="font-semibold text-orange-600">{timeUntilUnlock}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Can Withdraw</span>
                    <span
                      className={`font-semibold ${
                        canWithdraw ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {canWithdraw ? 'Yes' : 'Locked'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Protocol Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 text-yellow-500 mr-2" />
                Protocol Statistics
              </h3>

              {protocolLoading && !protocolData ? (
                <div className="py-4 text-center">
                  <div className="animate-pulse flex flex-col space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                  </div>
                  <p className="text-gray-500 mt-3">Loading protocol data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current APR</span>
                    <span className="font-semibold text-blue-600">{currentApr}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Staked</span>
                    <span className="font-semibold text-gray-800">{totalStaked}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reward Rate</span>
                    <span className="font-semibold text-purple-600">{rewardRate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction History */}
            {address && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-yellow-500 mr-2" />
                  Transaction History
                </h3>
                
                {isLoading ? (
                  <p className="text-gray-500 text-center py-4">Loading transaction history...</p>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {stakeHistory.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Recent Stakes</h4>
                        {stakeHistory.map((event) => (
                          <div key={event.id} className="text-sm border-l-2 border-green-400 pl-3 py-1 mb-2">
                            <div className="flex justify-between">
                              <span>Staked {(parseInt(event.amount) / 1e18).toFixed(2)}</span>
                              <span className="text-gray-500">
                                {new Date(parseInt(event.timestamp) * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {withdrawHistory.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Recent Withdrawals</h4>
                        {withdrawHistory.map((event) => (
                          <div key={event.id} className="text-sm border-l-2 border-blue-400 pl-3 py-1 mb-2">
                            <div className="flex justify-between">
                              <span>Withdrew {(parseInt(event.amount) / 1e18).toFixed(2)}</span>
                              <span className="text-gray-500">
                                {new Date(parseInt(event.timestamp) * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {rewardClaimHistory.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Recent Rewards</h4>
                        {rewardClaimHistory.map((event) => (
                          <div key={event.id} className="text-sm border-l-2 border-yellow-400 pl-3 py-1 mb-2">
                            <div className="flex justify-between">
                              <span>Claimed {(parseInt(event.amount) / 1e18).toFixed(2)} rewards</span>
                              <span className="text-gray-500">
                                {new Date(parseInt(event.timestamp) * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {stakeHistory.length === 0 && withdrawHistory.length === 0 && rewardClaimHistory.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No transaction history found</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* APR Info */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-200 rounded-full p-2">
                  <TrendingUp className="w-4 h-4 text-yellow-700" />
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Dynamic APR</h4>
                  <p className="text-sm text-yellow-700">
                    APR decreases as more tokens are staked in the protocol. Early stakers get
                    higher rewards!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StakingFrontend
