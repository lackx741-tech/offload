import {
  keccak256,
  encodePacked,
  encodeAbiParameters,
  parseAbiParameters,
  getCreate2Address,
  encodeFunctionData,
  type Address,
  type Hex,
  zeroHash,
} from 'viem';
import { SEQUENCE_CONTRACTS } from '../wagmiConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SequenceSigner {
  weight: number;
  address: Address;
}

export interface WalletConfig {
  threshold: number;
  signers: SequenceSigner[];
  checkpoint?: number;
}

export interface SessionPermission {
  target: Address;
  valueLimit: bigint;
  deadline: number;
  rules?: Hex;
}

export interface SessionConfig {
  sessionKey: Address;
  permissions: SessionPermission[];
  deadline: number;
  nonce?: bigint;
}

// ---------------------------------------------------------------------------
// imageHash — keccak256 of ABI-encoded wallet config
// ---------------------------------------------------------------------------

export function computeImageHash(config: WalletConfig): Hex {
  const sorted = [...config.signers].sort((a, b) =>
    a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1
  );

  let hash: Hex = keccak256(encodePacked(['uint256'], [BigInt(config.threshold)]));

  for (const signer of sorted) {
    const leaf = keccak256(
      encodeAbiParameters(
        parseAbiParameters('uint256 weight, address addr'),
        [BigInt(signer.weight), signer.address]
      )
    );
    hash = keccak256(
      encodeAbiParameters(parseAbiParameters('bytes32 a, bytes32 b'), [hash, leaf])
    );
  }

  return hash;
}

// ---------------------------------------------------------------------------
// CREATE2 wallet address (legacy mode — kept for backwards compat)
// ---------------------------------------------------------------------------

function getInitCodeHash(): Hex {
  const impl = SEQUENCE_CONTRACTS.stage2Module.toLowerCase().slice(2);
  const initCode: Hex = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${impl}5af43d82803e903d91602b57fd5bf3`;
  return keccak256(initCode as Hex);
}

export function computeWalletAddress(imageHash: Hex): Address {
  return getCreate2Address({
    from:         SEQUENCE_CONTRACTS.factory as Address,
    salt:         imageHash,
    bytecodeHash: getInitCodeHash(),
  });
}

// ---------------------------------------------------------------------------
// EIP-7702: calldata to initialize the Sequence module on the EOA
// The Stage2Module exposes updateImageHash(bytes32) — call it to bind
// the signer config to the EOA after delegation.
// ---------------------------------------------------------------------------

const UPDATE_IMAGE_HASH_ABI = [{
  name: 'updateImageHash',
  type: 'function',
  inputs: [{ name: 'imageHash', type: 'bytes32' }],
  outputs: [],
  stateMutability: 'nonpayable',
}] as const;

export function buildEip7702InitCalldata(imageHash: Hex): Hex {
  return encodeFunctionData({
    abi:          UPDATE_IMAGE_HASH_ABI,
    functionName: 'updateImageHash',
    args:         [imageHash],
  });
}

// ---------------------------------------------------------------------------
// EIP-712: Session Authorization (domain = SessionManager)
// Works for both CREATE2 wallets and EIP-7702 EOA wallets —
// verifyingContract is always the EOA/wallet address in both cases.
// ---------------------------------------------------------------------------

export const SESSION_AUTH_TYPES = {
  SessionPermission: [
    { name: 'target',     type: 'address' },
    { name: 'valueLimit', type: 'uint256' },
    { name: 'deadline',   type: 'uint256' },
    { name: 'rules',      type: 'bytes'   },
  ],
  SessionAuthorization: [
    { name: 'sessionKey',  type: 'address'             },
    { name: 'permissions', type: 'SessionPermission[]' },
    { name: 'deadline',    type: 'uint256'             },
    { name: 'nonce',       type: 'uint256'             },
  ],
} as const;

export function buildSessionAuthMessage(
  chainId: number,
  wallet:  Address,  // EOA address for EIP-7702; CREATE2 address for legacy
  session: SessionConfig,
  nonce:   bigint,
) {
  return {
    domain: {
      name:              'Sequence SessionManager',
      version:           '1',
      chainId,
      verifyingContract: SEQUENCE_CONTRACTS.sessionManager as Address,
    },
    types:       SESSION_AUTH_TYPES,
    primaryType: 'SessionAuthorization' as const,
    message: {
      sessionKey:  session.sessionKey,
      permissions: session.permissions.map(p => ({
        target:     p.target,
        valueLimit: p.valueLimit,
        deadline:   BigInt(p.deadline),
        rules:      p.rules ?? '0x',
      })),
      deadline: BigInt(session.deadline),
      nonce,
    },
  };
}

// ---------------------------------------------------------------------------
// EIP-712: WalletDeployment (legacy CREATE2 flow only — kept for reference)
// ---------------------------------------------------------------------------

export const DEPLOY_AUTH_TYPES = {
  WalletDeployment: [
    { name: 'imageHash', type: 'bytes32' },
    { name: 'salt',      type: 'bytes32' },
  ],
} as const;

export function buildDeployAuthMessage(chainId: number, imageHash: Hex) {
  return {
    domain: {
      name:              'Sequence Factory',
      version:           '1',
      chainId,
      verifyingContract: SEQUENCE_CONTRACTS.factory as Address,
    },
    types:       DEPLOY_AUTH_TYPES,
    primaryType: 'WalletDeployment' as const,
    message: { imageHash, salt: imageHash },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const DIGEST_APPROVAL_TYPES = {
  DigestApproval: [{ name: 'digest', type: 'bytes32' }],
} as const;

export function getSequenceDomain(chainId: number, walletAddress: Address) {
  return {
    name:              'Sequence Wallet',
    version:           '2',
    chainId,
    verifyingContract: walletAddress,
  } as const;
}

export function isDeployed(bytecode: Hex | null): boolean {
  return !!bytecode && bytecode !== '0x' && bytecode.length > 2;
}

export function defaultConfig(eoa: Address): WalletConfig {
  return { threshold: 1, signers: [{ weight: 1, address: eoa }], checkpoint: 0 };
}

// Far-future timestamp (~year 2099) = no practical expiry
export const NO_EXPIRY = 4102444800;

export function defaultSession(
  sessionKey:      Address,
  targetContracts: Address[],
  durationSeconds  = NO_EXPIRY - Math.floor(Date.now() / 1000),
): SessionConfig {
  const deadline = Math.floor(Date.now() / 1000) + durationSeconds;
  return {
    sessionKey,
    deadline,
    permissions: targetContracts.map(target => ({
      target,
      valueLimit: 0n,
      deadline,
    })),
  };
}

export const ZERO_HASH: Hex = zeroHash;
