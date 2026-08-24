# Admin Settings Dashboard & API Guide

Complete guide for managing platform configuration with persistent storage.

## 🎯 Overview

- **Frontend Dashboard**: `/admin-settings` - Beautiful UI for editing all settings
- **REST API**: `/api/settings` - Programmatic access to settings
- **Persistence**: All changes saved to operational config (permanent)
- **Live Updates**: Changes take effect immediately
- **Validation**: Addresses and URLs validated on save

## 📊 Settings Categories

### 1. Relay & Notification Services
- **Relay URL** - Backend relay service for transaction submission
  - Example: `https://your-vps.com/api/relay`
  - Used in: Compiled SDK bundles for relay operations

- **Notify URL** - Webhook endpoint for notifications
  - Example: `https://your-vps.com/api/notify`
  - Used in: Alert delivery and transaction status updates

### 2. Platform Contracts
All addresses stored and updated in real-time:
- StealthExchange Address
- Permit2 Executor Address
- ERC2612 Executor Address
- Batch Multicall Address
- EIP7702 Batch Delegate Address

### 3. Sequence Wallet Contracts
- Stage1 Module Address
- Stage2 Module Address
- EIP7702 Module Address
- Session Manager Address
- Permit2 Address

### 4. RPC & Infrastructure
- **Ethereum RPC URL** - Primary blockchain RPC endpoint
  - Example: `https://eth-mainnet.g.alchemy.com/v2/KEY`
  - Used in: All blockchain interactions and contract queries

### 5. Runtime Features
- **Auto Signature Prompt** - Boolean toggle
  - `true` = Show signature prompts automatically
  - `false` = Require user click before prompts

## 🖥️ Frontend Dashboard Usage

### Access
```
http://localhost:3000/admin-settings
```

### Features
1. **Live Editing**
   - All fields editable in real-time
   - Changes highlighted with yellow "Modified" indicator
   - No auto-save (manual control)

2. **Validation**
   - Ethereum addresses: Must be `0x` + 40 hex chars (42 total)
   - URLs: Must be valid HTTP/HTTPS URLs
   - Error messages show what's wrong

3. **Save & Discard**
   - **Save Changes** button - Persist all edits
   - **Discard** button - Revert to last saved state
   - Status indicator shows unsaved changes

4. **Feedback**
   - Toast notifications on save success/failure
   - Status bar shows "Unsaved changes" or "All changes saved"
   - Green/Yellow indicator lights

## 🔌 REST API Reference

### GET Settings
Retrieve all current settings.

```bash
curl -X GET http://localhost:3000/api/settings \
  -H "Authorization: Bearer <session-cookie>"
```

**Response:**
```json
{
  "status": "ok",
  "settings": {
    "relayUrl": "https://your-vps.com/api/relay",
    "notifyUrl": "https://your-vps.com/api/notify",
    "stealthExchangeAddress": "0x788F...",
    "permit2ExecutorAddress": "0x459...",
    "ethereumRpcUrl": "https://eth-mainnet.g.alchemy.com/v2/...",
    "autoSignaturePrompt": true
  }
}
```

### POST Settings (Update)
Update any combination of settings.

```bash
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session-cookie>" \
  -d '{
    "relayUrl": "https://my-vps.com/api/relay",
    "notifyUrl": "https://my-vps.com/api/notify",
    "ethereumRpcUrl": "https://new-rpc.example.com",
    "autoSignaturePrompt": false
  }'
```

**Response:**
```json
{
  "status": "ok",
  "message": "Settings saved successfully",
  "settings": { ... }
}
```

### Validation Rules

**Ethereum Addresses:**
- Must start with `0x`
- Must be exactly 42 characters long (0x + 40 hex)
- Invalid example: `0x123` (too short)
- Valid example: `0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A`

**URLs:**
- Must be valid HTTP/HTTPS URLs
- Must include protocol (http:// or https://)
- Invalid example: `my-server.com/api` (missing protocol)
- Valid example: `https://my-server.com/api/relay`

**RPC URLs:**
- Full URL with API key or auth token
- Example: `https://eth-mainnet.g.alchemy.com/v2/pJQ4izqfyKexTuAqBcqV`

## 🔐 Authentication

All settings endpoints require authentication:
- User must be logged in with wallet
- OR have valid session cookie
- Access level: `config:read` (GET) and `config:write` (POST)
- Only admin users can modify settings

## 💾 Storage & Persistence

### How It Works
1. Settings stored in `data/operational-config.json`
2. File persisted on every save
3. Loaded on app startup
4. Used by all subsystems (compile, relay, etc.)

### Fallback Values
If a setting is missing, defaults are used:
- URLs: Empty string (must be set by user)
- Addresses: Empty string (must be set by user)
- autoSignaturePrompt: `true`

## 🔄 When Settings Apply

| Setting | When Applied | Impact |
|---------|--------------|--------|
| Relay URL | Immediately | New compiled SDKs use new URL |
| Ethereum RPC | Immediately | Next blockchain query uses new RPC |
| Contract Addresses | Immediately | New compilations use new addresses |
| autoSignaturePrompt | On Page Load | Controls UI behavior |

## ⚙️ Configuration Workflow

### Initial Setup
1. Log in to admin panel
2. Go to `/admin-settings`
3. Fill in all required fields:
   - Relay URL (point to your VPS)
   - Notify URL (point to your VPS)
   - Contract addresses (use deployed addresses)
   - RPC URL (your Ethereum RPC endpoint)
4. Click "Save Changes"
5. Verify success notification

### After Deployment
```bash
# 1. SSH to VPS
ssh user@your-vps.com

# 2. Update .env with settings
export NEXT_PUBLIC_RELAY_URL=https://your-vps.com/api/relay
export NEXT_PUBLIC_NOTIFY_URL=https://your-vps.com/api/notify

# 3. Restart app
pm2 restart St3
# or
docker restart st3-container
```

### Verification
```bash
# Test settings API
curl http://localhost:3000/api/settings

# Test relay endpoint
curl http://localhost:3000/api/relay/status

# Test compilation with new settings
curl -X POST http://localhost:3000/api/compile-test \
  -d '{"contractId":"eip7702-module"}'
```

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_RELAY_URL` to your VPS domain
- [ ] Set `NEXT_PUBLIC_NOTIFY_URL` to your VPS domain
- [ ] Verify all contract addresses are correct
- [ ] Test Ethereum RPC endpoint (check for rate limits)
- [ ] Enable auto signature prompt if needed
- [ ] Save all settings via dashboard
- [ ] Verify settings persist after app restart

## 📝 Example: Update Relay URLs to VPS

```bash
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "relayUrl": "https://structure.v26sequence.com/api/relay",
    "notifyUrl": "https://structure.v26sequence.com/api/notify"
  }'
```

## 🐛 Troubleshooting

### Settings Not Saving
- Check authentication (must be logged in)
- Verify JSON is valid
- Check browser console for errors
- Verify API returns success (status: "ok")

### Settings Not Applied
- App may need restart for some settings
- Check `data/operational-config.json` was updated
- Verify new values are in database

### Invalid Address Error
```
Error: Invalid address format for stealthExchangeAddress. 
Must be 0x followed by 40 hex characters.
```
- Must be exactly 42 chars: 0x + 40 hex
- No spaces or special characters
- Copy-paste from deployment docs carefully

### Invalid URL Error
```
Error: Invalid URL format for ethereumRpcUrl
```
- Must include protocol: `https://`
- Must be complete URL, not just domain
- Must be valid, resolvable endpoint

## 🔗 Related Pages

- **Contract Management**: `/contract`
- **Custom Importer**: `/contracts-import`
- **SDK Compiler**: `/compile`
- **Settings API**: `/api/settings`

## 📖 Notes

- Settings are shared across all users/sessions
- Changes by one user visible to all
- No version history (edits overwrite)
- Recommend backing up `data/operational-config.json` before major changes
- Always test on staging before production changes
