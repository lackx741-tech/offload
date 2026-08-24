import { ethers } from "ethers";
import EventEmitter from "eventemitter3";
import type { WalletState, AssetInfo } from "../types";

export class WalletModule extends EventEmitter {
  provider: ethers.BrowserProvider | null = null;
  state: WalletState = {
    address: null,
    chainId: null,
    chainName: null,
    connected: false,
    assets: [],
  };

  async connect(): Promise<{ address: string; chainId: number }> {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("No wallet provider found");

    this.provider = new ethers.BrowserProvider(ethereum);
    await this.provider.send("eth_requestAccounts", []);

    const signer = await this.provider.getSigner();
    const address = await signer.getAddress();
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    this.state = { ...this.state, address, chainId, connected: true };
    this.emit("connect", { address, chainId });

    this._listenForChanges(ethereum);
    return { address, chainId };
  }

  async disconnect() {
    this.state = { address: null, chainId: null, chainName: null, connected: false, assets: [] };
    this.provider = null;
    this.emit("disconnect");
  }

  async getAddress(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");
    const signer = await this.provider.getSigner();
    return signer.getAddress();
  }

  async getSigner(): Promise<ethers.Signer> {
    if (!this.provider) throw new Error("Wallet not connected");
    return this.provider.getSigner();
  }

  async signMessage(message: string): Promise<string> {
    const signer = await this.getSigner();
    return signer.signMessage(message);
  }

  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    const signer = await this.getSigner();
    return (signer as ethers.Signer & { signTypedData: any }).signTypedData(domain, types, value);
  }

  private _listenForChanges(ethereum: any) {
    ethereum.on?.("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.state.address = accounts[0];
        this.emit("accountChanged", accounts[0]);
      }
    });

    ethereum.on?.("chainChanged", (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      this.state.chainId = chainId;
      this.emit("chainChanged", chainId);
    });
  }
}
