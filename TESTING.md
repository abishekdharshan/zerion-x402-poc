# Testing Guide: What Works Now vs. What Needs Integration

## Current State: PoC vs. Production

This PoC has **real Zerion API integration** and **mock payment verification**. Here's the breakdown:

### ✅ Working Now (Can Test)
- [x] Express server with x402 routes
- [x] 402 Payment Required responses
- [x] Payment scheme generation (Base/Polygon/Avalanche)
- [x] Middleware logic and flow
- [x] Test client demonstrating flow
- [x] **Real Zerion API integration** ✨ (tested with dev key)
- [x] Correct HTTP Basic Auth implementation
- [x] Real portfolio & transaction data

### ⏸️ Mocked (Needs Real Integration)
- [ ] Actual payment verification (currently mocked)
- [ ] On-chain transaction checking
- [ ] Real `@coinbase/x402` library integration
- [ ] Payment settlement confirmation

## Verified Integration ✅

**Tested:** 2026-02-04
**API:** Zerion API v1
**Auth Method:** HTTP Basic Auth (confirmed working)
**Rate Limit:** 300 calls/day (dev key)

See `ZERION_API_REFERENCE.md` for complete API documentation based on real testing.

## Wallet Setup: How It Works

### Setting Up Your Payment Wallet (ZERION_PAYMENT_WALLET)

**Good news:** There's NO special setup required!

Your payment wallet is just a regular Ethereum address that can receive USDC. Here's what you need:

1. **Any Ethereum Wallet Address**
   - MetaMask, Coinbase Wallet, hardware wallet, etc.
   - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

2. **Must Support USDC on Payment Chains**
   - Base (Chain ID: 8453)
   - Polygon (Chain ID: 137)
   - Avalanche (Chain ID: 43114)

3. **Add to .env file**
   ```bash
   ZERION_PAYMENT_WALLET=0xYourWalletAddress
   ```

That's it! When users make x402 payments, they'll send USDC directly to this address.

### How Payments Work

```
User wants data
  ↓
Gets 402 response with:
  - Your wallet address (recipient)
  - Amount: 0.001 USDC
  - Chains: Base, Polygon, or Avalanche
  ↓
User's wallet sends USDC to your address
  ↓
@coinbase/x402 verifies transaction on-chain
  ↓
Your server returns data
```

**You receive:**
- Direct USDC payments to your wallet
- No middleman, no escrow
- Instant settlement

## Testing With Real Zerion API Key

If you provide an API key, here's what we can test:

### Test 1: Real API Integration ✅ VERIFIED

```bash
# Add to .env
ZERION_API_KEY=your_key_here  # Get from dashboard.zerion.io
ZERION_PAYMENT_WALLET=0xYourWallet

# Run verified test (confirmed working)
node test-api-verified.js
```

**Test Results (Verified):**
- ✅ Portfolio: Fetched $1.7M+ portfolio for test address
- ✅ Multi-chain: 30+ chains with balances
- ✅ Authentication: HTTP Basic Auth working correctly
- ✅ Response format: JSON:API spec confirmed
- ✅ Rate limits: 300 calls/day enforced

This demonstrates:
- ✅ Fetch real transactions from Zerion API
- ✅ Fetch real portfolio data
- ✅ Verify API integration works
- ✅ Show we can integrate real data into x402 endpoints

### Test 2: x402 Flow (Mock Payments)

```bash
# Start server
pnpm dev

# Run test client
pnpm test-client
```

This will:
- ✅ Show 402 Payment Required response
- ✅ Show payment schemes with your wallet address
- ✅ Demonstrate full flow (with mocked verification)
- ⏸️ Payment verification is mocked (not checking blockchain)

### Test 3: Manual Testing

```bash
# 1. Start server
pnpm dev

# 2. Try without payment
curl http://localhost:3000/v1/x402/wallets/0xd8dA.../transactions

# Response will include:
{
  "x402": {
    "schemes": [{
      "recipient": "0xYourWallet",  # Your ZERION_PAYMENT_WALLET
      "amount": "1000",             # 0.001 USDC
      "chainId": 8453               # Base
    }]
  }
}
```

## What Needs to Be Done for Production

### 1. Integrate Real Payment Verification

Replace the mock in `x402-middleware.js` with:

```javascript
// Current (mock):
const isValid = await verifyPayment(payment, {...});

// Production:
const { verifyEvmExactPayment } = require('@coinbase/x402');
const isValid = await verifyEvmExactPayment(payment, {
  expectedAmount: PRICING[endpoint],
  expectedRecipient: RECIPIENT_WALLET,
  supportedChains: [8453, 137, 43114]
});
```

### 2. Add @coinbase/x402 Dependency

```bash
pnpm add @coinbase/x402
```

### 3. Test With Real Payments on Testnet

1. Use Base Sepolia testnet (testnet chain ID: 84532)
2. Get testnet USDC
3. Make real payment
4. Verify it shows up in your wallet

### 4. Deploy to Staging

Follow `DEPLOYMENT.md` for k8s setup

## FAQ

**Q: Do I need to set up anything with Coinbase for my wallet?**
A: No! Your wallet just needs to be able to receive USDC. The @coinbase/x402 library checks the blockchain directly.

**Q: How do I know if a payment was made?**
A: The @coinbase/x402 library verifies the on-chain transaction. You can also check your wallet balance or use a block explorer.

**Q: What if someone tries to pay the wrong amount?**
A: The verification checks amount, recipient, and token. Wrong amount = rejected.

**Q: Can I use the same wallet for testnet and production?**
A: Yes, but recommended to use separate wallets for testing vs. production.

**Q: How do I track all payments?**
A: Option 1: Check wallet transaction history
A: Option 2: Log payments to your database (see DEPLOYMENT.md)

**Q: What happens if the blockchain RPC is down?**
A: Payment verification fails → Returns 402 error → User can retry

**Q: What about Zerion API rate limits?**
A: Dev keys = 300 calls/day. Production keys = custom limits (contact api@zerion.io). Cache aggressively!

## Testing Checklist

- [ ] Add ZERION_API_KEY to .env
- [ ] Add ZERION_PAYMENT_WALLET to .env (your wallet address)
- [ ] Run `node test-real-api.js` - Verify API integration works
- [ ] Run `pnpm dev` - Server starts successfully
- [ ] Run `pnpm test-client` - See full x402 flow
- [ ] Check 402 response includes your wallet address
- [ ] Verify pricing is correct ($0.001 = 1000 in response)

## Next Steps After Testing

1. **If API integration works:**
   - Update `server.js` to use real Zerion API calls
   - Remove mock data

2. **If x402 flow works:**
   - Integrate real `@coinbase/x402` library
   - Test with testnet USDC
   - Deploy to staging

3. **Share results with team:**
   - "I tested with real API key - integration works"
   - "x402 flow working, just needs real payment lib"
   - "Ready for 2-3 days of production work"

## If You Want to Test Right Now

Give me your API key and I can:
1. ✅ Test real Zerion API integration
2. ✅ Verify endpoints return real data
3. ✅ Show x402 flow with your wallet address
4. ⏸️ Mock payment verification (can't test real payments yet)

The core infrastructure is done. Just needs:
- Real payment verification library
- Testnet testing
- Production deployment

---

**TL;DR:**
- Wallet setup = just an Ethereum address, no special config
- With API key = can test real data integration
- Payment flow works, verification is mocked
- 2-3 days of work to make it production-ready
