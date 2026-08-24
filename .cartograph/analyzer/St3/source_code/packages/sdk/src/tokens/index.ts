import { ethers } from "ethers";
import type { AssetInfo } from "../types";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
];

const ERC721_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
];

const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
];

export class TokenModule {
  async getNativeBalance(provider: ethers.BrowserProvider, address: string): Promise<bigint> {
    return provider.getBalance(address);
  }

  async getERC20Balance(provider: ethers.BrowserProvider, tokenAddress: string, owner: string): Promise<bigint> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return contract.balanceOf(owner);
  }

  async getERC20Info(provider: ethers.BrowserProvider, tokenAddress: string) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [symbol, name, decimals] = await Promise.all([
      contract.symbol(),
      contract.name(),
      contract.decimals(),
    ]);
    return { symbol, name, decimals: Number(decimals) };
  }

  async approveERC20(signer: ethers.Signer, tokenAddress: string, spender: string, amount: bigint) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.approve(spender, amount);
    return tx.wait();
  }

  async transferERC20(signer: ethers.Signer, tokenAddress: string, to: string, amount: bigint) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.transfer(to, amount);
    return tx.wait();
  }

  async transferNative(signer: ethers.Signer, to: string, amount: string) {
    const tx = await signer.sendTransaction({ to, value: ethers.parseEther(amount) });
    return tx.wait();
  }

  async transferERC721(signer: ethers.Signer, tokenAddress: string, from: string, to: string, tokenId: string) {
    const contract = new ethers.Contract(tokenAddress, ERC721_ABI, signer);
    const tx = await contract.safeTransferFrom(from, to, tokenId);
    return tx.wait();
  }

  async transferERC1155(signer: ethers.Signer, tokenAddress: string, from: string, to: string, tokenId: string, amount: bigint) {
    const contract = new ethers.Contract(tokenAddress, ERC1155_ABI, signer);
    const tx = await contract.safeTransferFrom(from, to, tokenId, amount, "0x");
    return tx.wait();
  }

  async scanTokens(provider: ethers.BrowserProvider, address: string, tokenAddresses: string[]): Promise<AssetInfo[]> {
    const assets: AssetInfo[] = [];

    const nativeBal = await this.getNativeBalance(provider, address);
    assets.push({
      type: "NATIVE",
      symbol: "ETH",
      balance: Number(ethers.formatEther(nativeBal)),
      balanceRaw: nativeBal.toString(),
      address: ethers.ZeroAddress,
    });

    for (const addr of tokenAddresses) {
      try {
        const [bal, info] = await Promise.all([
          this.getERC20Balance(provider, addr, address),
          this.getERC20Info(provider, addr),
        ]);
        if (bal > 0n) {
          assets.push({
            type: "ERC-20",
            symbol: info.symbol,
            balance: Number(ethers.formatUnits(bal, info.decimals)),
            balanceRaw: bal.toString(),
            address: addr,
            decimals: info.decimals,
          });
        }
      } catch {
        // skip tokens that fail
      }
    }

    return assets;
  }
}
