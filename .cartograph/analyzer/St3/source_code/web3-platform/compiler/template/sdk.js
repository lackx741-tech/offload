export function initSDK(config) {
  const state = { wallet: null };

  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      state.wallet = accounts[0];

      await fetch(config.apiUrl + "/api/events/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ wallet: state.wallet })
      });
    }
  }

  return { connectWallet };
}
