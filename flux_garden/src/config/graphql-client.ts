import { GraphQLClient } from 'graphql-request'

// Use the subgraph URL from your deployment
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/120773/flux-garden/0.0.1'

// Create a GraphQL client instance with error handling
const client = new GraphQLClient(SUBGRAPH_URL)

// Enhanced GraphQL client with error handling
export const graphqlClient = {
  request: async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
    try {
      return await client.request<T>(query, variables)
    } catch (error) {
      console.error('GraphQL request failed:', error)
      // Re-throw the error to be handled by the try_function in hooks
      throw error
    }
  }
}
