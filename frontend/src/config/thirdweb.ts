import { createThirdwebClient } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";

// Initialize Thirdweb client
// Replace with your actual client ID from Thirdweb dashboard
export const client = createThirdwebClient({
  clientId: process.env.REACT_APP_THIRDWEB_CLIENT_ID || "your-client-id-here",
});

// Configure wallet options
export const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email", "passkey", "phone", "facebook", "apple"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("com.binance.wallet"),
];
