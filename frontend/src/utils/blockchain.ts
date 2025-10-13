/**
 * Blockchain utility functions for Sepolia testnet
 */

const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io';

/**
 * Get transaction URL for Sepolia Etherscan
 * @param txHash - Transaction hash
 * @returns Full URL to transaction on Etherscan
 */
export const getTransactionUrl = (txHash: string): string => {
  return `${SEPOLIA_EXPLORER}/tx/${txHash}`;
};

/**
 * Get address URL for Sepolia Etherscan
 * @param address - Wallet or contract address
 * @returns Full URL to address on Etherscan
 */
export const getAddressUrl = (address: string): string => {
  return `${SEPOLIA_EXPLORER}/address/${address}`;
};

/**
 * Get block URL for Sepolia Etherscan
 * @param blockNumber - Block number
 * @returns Full URL to block on Etherscan
 */
export const getBlockUrl = (blockNumber: number | string): string => {
  return `${SEPOLIA_EXPLORER}/block/${blockNumber}`;
};

/**
 * Truncate address for display
 * @param address - Full address
 * @param startLength - Characters to show at start (default: 6)
 * @param endLength - Characters to show at end (default: 4)
 * @returns Truncated address (e.g., "0x1234...5678")
 */
export const truncateAddress = (
  address: string, 
  startLength: number = 6, 
  endLength: number = 4
): string => {
  if (!address || address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Format wei to ETH
 * @param wei - Amount in wei
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted ETH amount
 */
export const formatWeiToEth = (wei: string | number, decimals: number = 4): string => {
  const weiNumber = typeof wei === 'string' ? parseInt(wei, 10) : wei;
  const eth = weiNumber / Math.pow(10, 18);
  return eth.toFixed(decimals);
};

/**
 * Format ETH to wei
 * @param eth - Amount in ETH
 * @returns Amount in wei
 */
export const formatEthToWei = (eth: number): string => {
  return (eth * Math.pow(10, 18)).toString();
};

/**
 * Check if address is valid Ethereum address
 * @param address - Address to validate
 * @returns True if valid Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Check if transaction hash is valid
 * @param txHash - Transaction hash to validate
 * @returns True if valid transaction hash
 */
export const isValidTransactionHash = (txHash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
};

/**
 * Get network name from chain ID
 * @param chainId - Chain ID
 * @returns Network name
 */
export const getNetworkName = (chainId: number): string => {
  const networks: { [key: number]: string } = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    5: 'Goerli Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
  };
  return networks[chainId] || `Unknown Network (${chainId})`;
};

/**
 * Get network explorer URL from chain ID
 * @param chainId - Chain ID
 * @returns Explorer base URL
 */
export const getExplorerUrl = (chainId: number): string => {
  const explorers: { [key: number]: string } = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    5: 'https://goerli.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
  };
  return explorers[chainId] || 'https://etherscan.io';
};

/**
 * Format timestamp to readable date
 * @param timestamp - Unix timestamp
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get transaction status based on confirmation count
 * @param confirmations - Number of confirmations
 * @returns Status string
 */
export const getTransactionStatus = (confirmations: number): string => {
  if (confirmations === 0) return 'Pending';
  if (confirmations < 12) return 'Confirming';
  return 'Confirmed';
};

/**
 * Get transaction status color
 * @param confirmations - Number of confirmations
 * @returns Color string for UI
 */
export const getTransactionStatusColor = (confirmations: number): string => {
  if (confirmations === 0) return 'warning';
  if (confirmations < 12) return 'info';
  return 'success';
};
