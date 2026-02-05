# Zerion API x402 Integration - Proof of Concept

> **Goal**: Enable frictionless, pay-per-request access to Zerion API via x402 protocol

## What is x402?

x402 is a payment protocol for HTTP APIs that allows users to pay for API usage on a per-request basis using cryptocurrency (USDC). No API keys needed - just pay and access.

**Benefits:**
- **Frictionless**: No signup, no API key management
- **Agent-native**: AI agents can autonomously pay for data
- **Usage-based**: Only pay for what you query ($0.001/request)
- **Instant**: Payment and access in a single round-trip

## Architecture

```
┌─────────────┐
│   Client    │
│   /Agent    │
└──────┬──────┘
       │
       │ 1. GET /v1/x402/wallets/{address}/transactions
       │    (no Authorization header)
       ↓
┌──────────────────┐
│  x402 Middleware │
│                  │
│  Check payment?  │
└──────┬───────────┘
       │
       │ 2. No payment → 402 Payment Required
       │    + Payment schemes (Base/Polygon/Avalanche)
       │
       ↓
┌─────────────┐
│   Client    │
│             │
│ Creates &   │
│ signs       │
│ payment     │
└──────┬──────┘
       │
       │ 3. Retry with x-402-payment header
       ↓
┌──────────────────┐
│  x402 Middleware │
│                  │
│  Verify payment ✓│
└──────┬───────────┘
       │
       │ 4. Payment valid → Forward to endpoint
       ↓
┌──────────────────┐
│  Transactions    │
│  Endpoint        │
│                  │
│  Return data     │
└──────┬───────────┘
       │
       │ 5. 200 OK + { data: [...] }
       ↓
┌─────────────┐
│   Client    │
└─────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd ~/projects/zerion-x402-poc
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add:
# - ZERION_PAYMENT_WALLET (your wallet to receive payments)
# - WALLET_PRIVATE_KEY (for testing client)
```

### 3. Run Server

```bash
pnpm dev
```

Server runs on http://localhost:3000

### 4. Test x402 Flow

```bash
# In another terminal
pnpm test-client
```

This will:
1. Make request without payment → Get 402 error
2. Create payment header
3. Retry with payment → Get data

## Files Overview

```
zerion-x402-poc/
├── x402-middleware.js    # Core x402 middleware (~80 lines)
├── server.js             # Express server with x402 endpoints
├── test-client.js        # Example client demonstrating flow
├── package.json
├── .env.example
└── README.md
```

## Key Concepts

### 1. x402 Middleware

Located in `x402-middleware.js`:

- Checks for `x-402-payment` header
- If missing: Returns 402 with payment schemes
- If present: Verifies payment, then continues to endpoint

### 2. Payment Schemes

Supports USDC payments on:
- Base (Chain ID: 8453)
- Polygon (Chain ID: 137)
- Avalanche (Chain ID: 43114)

### 3. Pricing

```javascript
{
  transactions: '1000',  // 0.001 USDC
  portfolio: '1000',
  positions: '1000',
  charts: '2000',        // More expensive
}
```

## Integration into Zerion API

### Option A: New Routes (Recommended)

Add x402 versions alongside existing endpoints:

```javascript
// Existing (API key)
app.get('/v1/wallets/:address/transactions', requireApiKey, handler);

// New (x402 payment)
app.get('/v1/x402/wallets/:address/transactions', x402Middleware, handler);
```

Benefits:
- Clean separation
- Easy rollback
- Can test without affecting existing users

### Option B: Dual Auth

Single endpoint accepts both:

```javascript
app.get('/v1/wallets/:address/transactions', dualAuth, handler);
// Accepts: API key OR x402 payment
```

## Deployment Checklist

### Code Changes (5%)
- [x] Create x402 middleware
- [x] Add x402 routes
- [ ] Integrate payment verification with real `@coinbase/x402`
- [ ] Add payment logging/tracking
- [ ] Error handling and edge cases

### Infrastructure (95%)
- [ ] Set `ZERION_PAYMENT_WALLET` in k8s secrets
- [ ] Add `@coinbase/x402` to dependencies
- [ ] Configure monitoring for 402 responses
- [ ] Set up payment tracking dashboard
- [ ] Add Sentry/Datadog for payment errors
- [ ] Load testing for payment verification latency
- [ ] Deploy to staging first
- [ ] Create runbook for payment issues

## Testing Plan

### Local Testing
1. ✓ Run server locally
2. ✓ Test 402 response without payment
3. ✓ Test with mock payment
4. ⏸ Test with real payment on testnet

### Staging
1. Deploy to staging environment
2. Test with real USDC on Base Sepolia (testnet)
3. Verify payment receipt in wallet
4. Load test: 100 requests/sec
5. Verify error handling (invalid payments, expired, etc.)

### Production
1. Start with 1-2 endpoints (transactions + portfolio)
2. Monitor for 24 hours
3. Gradually roll out to more endpoints
4. Monitor: payment success rate, latency, errors

## Next Steps

### For Product Lead (You!)

**Demo to Team:**
```bash
# Show this running
pnpm dev

# In another terminal
curl http://localhost:3000/v1/x402/wallets/0x123.../transactions
# → Shows 402 Payment Required response

# Run test client
pnpm test-client
# → Shows full payment flow
```

**Present:**
1. "I built a working x402 PoC"
2. Show code structure (x402-middleware.js is only ~80 lines)
3. Show test client working
4. Present deployment checklist
5. "Ready for engineering to integrate with real @coinbase/x402"

### For Engineering Team

1. Review `x402-middleware.js` - suggest improvements
2. Replace mock payment verification with real `@coinbase/x402`
3. Add payment tracking/logging
4. Set up k8s configuration
5. Deploy to staging

## Resources

- [Coinbase x402 Docs](https://docs.cdp.coinbase.com/x402/welcome)
- [Zapper x402 Implementation](https://public.zapper.xyz/docs/x402)
- [x402 Protocol Spec](https://github.com/coinbase/x402)

## Questions?

- How do we track x402 payments in our DB?
- Do we want payment history visible in dashboard?
- Should we support more chains? (Arbitrum, Optimism?)
- Pricing per endpoint or flat rate?

---

Built with ❤️ by Abi (Product Lead, Zerion API)
