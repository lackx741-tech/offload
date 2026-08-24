import { buildSDK } from "./builder.js";

await buildSDK({
  apiUrl: "http://localhost:3000",
  wallet: "injected"
});
