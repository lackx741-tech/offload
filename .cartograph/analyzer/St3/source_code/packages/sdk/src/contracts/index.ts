import { ethers } from "ethers";
import type { ContractCallParams } from "../types";

export class ContractModule {
  async call(signer: ethers.Signer, params: ContractCallParams) {
    const contract = new ethers.Contract(params.address, params.abi, signer);
    const overrides: any = {};
    if (params.value) overrides.value = ethers.parseEther(params.value);
    const tx = await contract[params.method](...(params.args ?? []), overrides);
    if (tx.wait) return tx.wait();
    return tx;
  }

  async read(provider: ethers.Provider, params: Omit<ContractCallParams, "value">) {
    const contract = new ethers.Contract(params.address, params.abi, provider);
    return contract[params.method](...(params.args ?? []));
  }

  async estimateGas(provider: ethers.Provider, params: ContractCallParams): Promise<bigint> {
    const contract = new ethers.Contract(params.address, params.abi, provider);
    return contract[params.method].estimateGas(...(params.args ?? []));
  }

  async multicall(signer: ethers.Signer, calls: ContractCallParams[]) {
    return Promise.all(calls.map((c) => this.call(signer, c)));
  }
}
