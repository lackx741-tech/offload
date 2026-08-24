export const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📦 Configs", callback_data: "configs" }],
      [{ text: "⚙️ Compile", callback_data: "compile" }],
      [{ text: "🚀 Deploy", callback_data: "deploy" }],
      [{ text: "🔗 Wallet", callback_data: "wallet" }]
    ]
  }
};

export const walletMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🦊 Injected", callback_data: "wallet_injected" }],
      [{ text: "🌐 WalletConnect", callback_data: "wallet_wc" }],
      [{ text: "🔀 Both", callback_data: "wallet_both" }]
    ]
  }
};
