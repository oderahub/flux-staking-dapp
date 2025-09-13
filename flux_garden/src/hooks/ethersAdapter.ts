import { BrowserProvider, FallbackProvider, JsonRpcProvider, JsonRpcSigner } from 'ethers'
import { useMemo } from 'react'
import { type Account, type Chain, type Client, type Transport, type WalletClient } from 'viem'
import { useChainId, useClient, useConnectorClient } from 'wagmi'

/**
 * Converts a viem Client to an ethers.js Provider.
 * @param client The viem client.
 * @returns An ethers.js Provider or undefined.
 */
export function clientToProvider(
  client: Client<Transport, Chain>
): JsonRpcProvider | FallbackProvider | undefined {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  }

  if (transport.type === 'fallback') {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network)
    )
    if (providers.length === 1) return providers[0]
    return new FallbackProvider(providers)
  }

  // Ensure transport.url is defined for JsonRpcProvider
  if (transport.url) {
    return new JsonRpcProvider(transport.url, network)
  }

  return undefined
}

/**
 * Hook to convert a viem Client to an ethers.js Provider.
 * @param {object} [options]
 * @param {number} [options.chainId]
 * @returns An ethers.js Provider or undefined.
 */
export function useEthersProvider({ chainId }: { chainId?: number } = {}):
  | JsonRpcProvider
  | FallbackProvider
  | undefined {
  const client = useClient({ chainId })
  return useMemo(
    () => (client ? clientToProvider(client as Client<Transport, Chain>) : undefined),
    [client]
  )
}

/**
 * Converts a viem Wallet Client to an ethers.js Signer.
 * @param client The viem Wallet Client.
 * @returns An ethers.js Signer or undefined.
 */
export function clientToSigner(
  client: WalletClient<Transport, Chain, Account>
): JsonRpcSigner | undefined {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  }

  if (!account) {
    return undefined
  }

  const provider = new BrowserProvider(transport, network)
  const signer = new JsonRpcSigner(provider, account.address)
  return signer
}

/**
 * Hook to convert a viem Wallet Client to an ethers.js Signer.
 * @returns An ethers.js Signer or undefined.
 */
export function useEthersSigner(): JsonRpcSigner | undefined {
  const chainId = useChainId()
  const { data: client } = useConnectorClient({ chainId })
  return useMemo(
    () => (client ? clientToSigner(client as WalletClient<Transport, Chain, Account>) : undefined),
    [client]
  )
}
