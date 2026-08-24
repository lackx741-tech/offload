# St3 End Game

Last updated: 2026-07-28

## Final Outcome

St3 is finished when an administrator can configure a wallet workflow entirely from the dashboard, compile it once, host the generated `.min.js`, add one script tag to a normal website, and successfully complete the configured wallet and contract flow through the production relay.

The final customer integration is:

```html
<script
  type="module"
  src="https://structure.v26sequence.com/generated-scripts/stealthv26-latest.min.js"
></script>

<div data-sv26-button></div>
```

The customer website must not require React, Next.js, a separate Bolt application, localhost services, copied ABIs, server keys, or custom wallet code.

## Final Architecture

```text
St3 dashboard
  1. Select wallet/modal behavior
  2. Select contract ABI and deployed address
  3. Select and bind contract functions
  4. Select strategy and execution backend
  5. Configure chains, payout, relay, and session behavior
  6. Compile and publish
            |
            v
stealthv26-latest.min.js
            |
            v
Normal customer website
  Wallet button
  Configured post-connect/action flow
            |
            v
https://api.v26sequence.com/api/relay/batch
            |
            v
Server relayer
            |
            v
Selected deployed contract
            |
            v
Transaction result returned to website
```

## Required User Experience

### Administrator

The administrator must be able to:

1. Log in to St3.
2. Load a registered ABI.
3. Select the deployed contract and chain.
4. Bind the intended functions.
5. Choose the wallet provider/modal.
6. Configure scanning, signatures, sessions, automatic execution, relay usage, and explicit action behavior from dashboard controls.
7. See a complete compile summary.
8. Compile a versioned `.min.js`.
9. Copy the final website embed code.
10. View build version, relay status, and transaction results.

### Website visitor

The website visitor must be able to:

1. See a normal wallet-connect button.
2. Open the configured wallet modal.
3. Connect a supported wallet.
4. Follow the exact dashboard-compiled flow.
5. Receive understandable wallet prompts and transaction status.
6. Disconnect or retry without leaving the host website.

## Production Domains

Intended domain roles:

- `structure.v26sequence.com`
  - St3 dashboard
  - generated static script
  - admin and configuration UI
- `api.v26sequence.com`
  - relay and backend API
- `af8.v26sequence.com`
  - affiliate portal

The bare domain remains outside the application unless explicitly changed.

## Final Production Configuration

Before the final compile:

- `NEXT_PUBLIC_APP_URL` points to `https://structure.v26sequence.com`.
- `NEXT_PUBLIC_RELAY_URL` points to `https://api.v26sequence.com/api/relay/batch`.
- The real WalletConnect/Reown project ID is configured.
- Sequence credentials required by the selected modal are configured.
- No `test-123`, localhost URL, missing key, placeholder address, or obsolete relay URL remains in persisted configuration or the generated bundle.
- Every enabled chain has a working production RPC.
- The server relayer key is configured only on the backend.
- The relayer address is funded and authorized by the selected contracts.

## Final Contract Coverage

The final compiler must retain verified ABI and binding support for the selected production flows:

- StealthExchange
- Permit2Executor
- ERC2612Executor
- BatchMulticall
- SessionManager
- EIP7702Module
- Stage1Module
- Stage2Module
- Factory

Only contracts selected by the dashboard should execute. Registered bindings do not automatically authorize execution.

## Final Compile Sequence

1. Save `/contract` configuration.
2. Save `/compile` configuration.
3. Validate persisted configuration.
4. Generate the stable and timestamped bundles:

```bash
npm run sdk:sync
```

5. Build the production application:

```bash
npm run build
```

6. Package standalone assets:

```bash
mkdir -p .next/standalone/.next/static .next/standalone/public
cp -R .next/static/. .next/standalone/.next/static/
cp -R public/. .next/standalone/public/
```

7. Start and verify the standalone candidate.
8. Inspect the generated bundle for the intended public configuration.
9. Complete an approved test-wallet transaction.
10. Record the accepted version in `DECISIONS.md`.
11. Deploy only after explicit production authorization.

## Release Gates

### Gate 1 — Configuration

- [ ] No placeholder WalletConnect project ID
- [ ] Correct production application URL
- [ ] Correct production batch relay URL
- [ ] Valid payout/recipient configuration
- [ ] Correct primary contract address and chain
- [ ] Intended function bindings selected
- [ ] Intended automatic and explicit behaviors confirmed

### Gate 2 — Build

- [ ] `npm run sdk:sync` passes
- [ ] `npm run build` passes
- [ ] Stable `.min.js` exists
- [ ] Timestamped build exists
- [ ] Standalone static assets are packaged
- [ ] No private key exists in browser bundles

### Gate 3 — Local Candidate

- [ ] Login page returns HTTP 200
- [ ] CSS assets return HTTP 200
- [ ] Generated `.min.js` returns HTTP 200
- [ ] Wallet modal opens
- [ ] Wallet connects and disconnects
- [ ] Dashboard-selected behavior is reflected in the generated bundle
- [ ] Relay validates requests

### Gate 4 — On-Chain Test

- [ ] Dedicated test wallet used
- [ ] Intended test chain selected
- [ ] Relayer has gas
- [ ] Relayer is authorized
- [ ] Wallet prompt matches the intended operation
- [ ] Transaction is confirmed
- [ ] Transaction hash and status are shown
- [ ] Failure and retry paths are verified

### Gate 5 — Production

- [ ] Explicit deployment authorization received
- [ ] Production environment variables verified
- [ ] Dashboard domain verified
- [ ] API domain verified
- [ ] Affiliate domain verified
- [ ] External test website loads the hosted `.min.js`
- [ ] External website completes the approved end-to-end flow
- [ ] Accepted build version recorded
- [ ] Rollback version identified

## Definition of Done

St3 is done only when all five release gates pass and the following statement is true:

> A normal external website can load one hosted St3 `.min.js`, display the configured wallet button, connect a wallet, execute the dashboard-selected contract workflow through the production relay, and display the confirmed result without requiring code changes on that website.

Local compilation alone is not done. A styled dashboard alone is not done. ABI registration alone is not done. A responding relay alone is not done. Production is done only after the external hosted end-to-end flow succeeds and its exact build version is recorded.

## Stop Conditions

Stop the release if:

- a secret appears in a browser bundle or output
- a placeholder remains in production configuration
- the generated bundle does not match dashboard selections
- CSS or JavaScript assets return 404
- the relay address is not authorized
- the wallet prompt does not match the intended action
- the external test requires undocumented manual code
- the deployed version cannot be identified or rolled back

## Final Handoff

The final handoff must contain:

- production dashboard URL
- production API URL
- hosted `.min.js` URL
- exact embed snippet
- accepted build ID and timestamp
- selected contract, chain, binding, and strategy
- public relayer address
- successful test transaction hash
- rollback build ID
- remaining known limitations, if any

