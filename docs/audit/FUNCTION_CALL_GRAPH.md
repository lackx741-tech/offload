# Critical function call graph

## Compile route

```text
CompileOutput.handleCompile()
  ├─ if registry category=drainer → generateDrainerBundle()
  └─ POST /api/compile
      └─ POST()
          ├─ if async/queue requested → enqueueCompileJob()
          │   └─ BullMQ compile worker processor
          │       ├─ aff_* → compileAffiliateProject()
          │       │   ├─ getAffiliateProject() / getAffiliateConfig()
          │       │   ├─ generateSDKBundle() / generateSolanaBundle() / generateTronBundle()
          │       │   ├─ obfuscateScript() or obfuscateWithDomainLock()
          │       │   ├─ updateAffiliateProject()
          │       │   └─ saveScriptBuild() if publishBuild
          │       └─ platform → compilePlatformBundle()
          │           ├─ readCompileConfig() + readOperationalConfig()
          │           ├─ generateSDKBundle() / non-EVM bundle
          │           └─ saveScriptBuild()
          └─ sync path
              ├─ mergeCompileConfig()
              ├─ optional writeCompileConfig() / writeOperationalConfig()
              ├─ getContractById() + buildBindingForContract()
              ├─ generateUniversalBundle()
              │   ├─ sequence → generateSDKBundle()
              │   └─ drainer → generateDrainerBundle()
              ├─ fallback ecosystem generator
              ├─ saveScriptBuild()
              └─ NextResponse.json()
```

Evidence: `src/components/compile/compile-output.tsx:203–250`; `src/app/api/compile/route.ts:64–95,100–225`; `workers/compile.worker.ts:23–90`; `src/lib/affiliate-compile.ts:32–112`; `src/lib/universal-sdk-generator.ts:50–146`.

## Telegram compile

```text
POST /api/telegram/webhook
  → isTelegramWebhookAuthorized()
  → enqueueTelegramInbound() OR processTelegramUpdate()
  → telegram.worker inbound processor (queued branch)
  → processTelegramUpdate()
  → handleCommand()
  → handleCompileCommand()
  → enqueueCompileJob() OR compileAffiliateProject() inline
  → compile worker (queued branch)
  → generator → obfuscator → saveScriptBuild()
  → direct sendTelegramApiMessage()
```

Evidence: webhook `src/app/api/telegram/webhook/route.ts:21–45`; processor `workers/telegram.worker.ts:17–26`; dispatcher `src/lib/telegram-bot.ts:1213–1224,987–1128`; compile handler `:795–863`; worker `workers/compile.worker.ts:57–90`.

## Frontpage action compilation and runtime

```text
POST /api/frontpage/compile
  → compileFrontpagePayload()
  → isFrontpageConfig()
  → compileFrontpageScript()
  → deriveCompiledActionsFromFrontpage()
  → toCompiledContractAction()
  → esbuild browser IIFE
  → saveScriptBuild()
  → response script
  → browser wallet connect / chain switch / prepareContractTransaction()
  → eth_sendTransaction
```

Evidence: `src/app/api/frontpage/compile/route.ts:6–23`; `src/lib/frontpage-compile-service.ts:5–21`; `src/lib/frontpage-script-compiler.ts:17–20,41–80,170–200`; `src/lib/contract-actions.ts:27–57`; `src/lib/execute-contract-action.ts:10–35`.

## Contract lookup and ABI-to-calldata

```text
ContractTab.applyAction()
  → CONTRACT_REGISTRY entry and selected function
  → buildBindingForFunction()
  → setGeneralConfig / setContractsConfig / setStrategyConfig
  → CompileOutput selected strategy
  → POST /api/compile
  → getContractById() / buildBindingForContract()
  → generator config
```

Independent frontpage path: stored action methodAbi + paramsJson → compiled action → `prepareContractTransaction()` uses ABI value normalization and viem `encodeFunctionData()` (`contract-tab.tsx:28–65`; `contract-actions.ts:27–57`; `execute-contract-action.ts:1–35`).

## Direct on-chain relay

`POST /api/relay/batch` → validate body/address/config/private key → viem public/wallet clients → branch by execution backend → `walletClient.writeContract()` → best-effort Telegram notification and Kafka `RELAY_EXECUTED` event → `{hash}` response (`src/app/api/relay/batch/route.ts:90–129,131–340,342–371`). This path is synchronous and does not call `enqueueRelayJob()`.
