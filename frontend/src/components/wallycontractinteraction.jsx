import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract'

export default function WallyContractInteraction() {
  const { address, isConnected } = useAccount()

  // Read Permission
  const { data: permission, refetch } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPermission',
    args: [address],
    enabled: !!address,
  })

  // Write: Grant Permission
  const { write: grantPermission, data: txData, isLoading, isSuccess, error } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'grantPermission',
    // args: [withdrawalAddress, durationInSeconds, remainingBalance, allowEntireWallet, validTokenContracts]
  })

  // Wait for transaction to confirm
  const { isLoading: txPending, isSuccess: txConfirmed } = useWaitForTransaction({
    hash: txData?.hash,
    enabled: !!txData?.hash
  })

  return (
    <div>
      <h3>My Permission</h3>
      <pre>{JSON.stringify(permission, null, 2)}</pre>
      <button
        onClick={() =>
          grantPermission({
            args: [
              "0x...", // withdrawalAddress
              86400,   // durationInSeconds (e.g. 1 day)
              0,       // remainingBalance
              true,    // allowEntireWallet
              []       // validTokenContracts
            ]
          })
        }
        disabled={isLoading}
      >
        Grant Permission
      </button>
      {isLoading && <span>Sending transaction...</span>}
      {txPending && <span>Waiting for confirmation...</span>}
      {txConfirmed && <span>Transaction confirmed!</span>}
      {error && <span style={{ color: 'red' }}>{error.message}</span>}
    </div>
  )
}