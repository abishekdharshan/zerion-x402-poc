# Demo Script: Present x402 PoC to Engineering Team

> **Goal**: Show working x402 implementation and get buy-in for production integration

## Setup (Do Before Meeting)

```bash
cd ~/projects/zerion-x402-poc
pnpm install
cp .env.example .env
# Add your wallet address to .env
pnpm dev  # Start in background
```

## Demo Flow (10 minutes)

### 1. Introduction (1 min)

**Say:**
> "I built a proof-of-concept for x402 payment integration. This would let users/agents access our API by paying per request, no API key needed. Similar to what Zapper just launched."

**Show:** Open README.md and scroll to architecture diagram

---

### 2. Show the Code (3 min)

**Open:** `x402-middleware.js`

**Say:**
> "The core middleware is ~80 lines. It does three things:
> 1. Checks for payment header
> 2. If missing → Returns 402 with payment options
> 3. If present → Verifies payment and continues"

**Highlight:**
- Line 40-55: The payment requirement response
- Line 58-75: Payment verification
- PRICING object: $0.001 per call

**Open:** `server.js`

**Say:**
> "Integration is simple - just add the middleware to new routes:
> - Existing endpoints keep using API keys
> - New `/v1/x402/` endpoints use payment
> - Same business logic, different auth"

**Show:** Line 52-68 (x402 transactions endpoint)

---

### 3. Live Demo (4 min)

**Terminal 1:** Show server running
```bash
# Already running from setup
```

**Terminal 2:** Test without payment
```bash
curl http://localhost:3000/v1/x402/wallets/0x123.../transactions
```

**Say:**
> "See - returns 402 Payment Required with payment schemes for Base, Polygon, and Avalanche"

**Show:** The JSON response with payment requirements

**Terminal 2:** Run test client
```bash
pnpm test-client
```

**Say:**
> "This simulates what an AI agent would do:
> 1. First request → Gets 402
> 2. Creates payment
> 3. Retries with payment header
> 4. Gets data back
>
> The whole flow takes ~2 seconds. No signup, no API key management."

---

### 4. Production Plan (2 min)

**Open:** `DEPLOYMENT.md`

**Say:**
> "I've mapped out the deployment. Based on Grayson's estimate:
> - 5% is code (✓ we have this)
> - 95% is config - k8s, monitoring, secrets
>
> Total: 2-3 days of engineering work"

**Highlight sections:**
- K8s configuration
- Monitoring setup
- Deployment steps
- Rollback plan

**Say:**
> "We'd start with 1-2 endpoints in staging, validate the flow, then gradual rollout to production."

---

### 5. Business Case (Quick)

**Say:**
> "Why this matters:
> - ClawHub has thousands of AI agent developers
> - Current friction: Sign up → Get API key → Configure
> - With x402: Just use it, pay as you go
> - At $0.001/call, if we get even 100K calls/day, that's $100/day from a new user segment we don't reach today"

---

## Questions to Expect

**Q: How does payment verification work?**
> A: Uses @coinbase/x402 library. They verify the on-chain transaction, confirm amount and recipient, then we return data. Takes ~1-2 seconds.

**Q: What if someone spams 402 requests without paying?**
> A: We add rate limiting on 402 responses. Plus 402 responses are cheap - no DB queries or indexing work.

**Q: What about payment tracking?**
> A: We can optionally log payments to DB for analytics. But not required - the blockchain is source of truth.

**Q: Why separate `/v1/x402/` endpoints?**
> A: Clean separation. Easy to test. Can measure adoption. Follows Zapper's pattern. Can rollback easily.

**Q: Timeline?**
> A: If we prioritize, 2-3 days to staging, 1 week to production with monitoring. Can ship first endpoint in 2 weeks.

---

## Closing

**Say:**
> "I know we're busy, but I think this is a 2-week project that could unlock a new distribution channel. Happy to pair with anyone on the team to get this production-ready.
>
> Next steps:
> 1. Review the code - suggest improvements
> 2. Decide: do we want this?
> 3. If yes, who can own the production integration?"

**Ask:** "What questions do you have?"

---

## Success Metrics

After demo, you've succeeded if:
- ✅ Team understands what x402 is
- ✅ Someone volunteers to help or gives timeline
- ✅ Engineering lead agrees it's feasible
- ✅ You get feedback on the code
- ✅ Team sees you as technically capable

---

## Backup: If Things Go Wrong

**Server won't start:**
```bash
# Check port isn't in use
lsof -i :3000
# Kill if needed
kill -9 <PID>
# Restart
pnpm dev
```

**Dependencies missing:**
```bash
rm -rf node_modules
pnpm install
```

**Can't demo live:**
> "Here's a video I recorded earlier..." (record a backup video!)

---

## After the Demo

**Send to team:**
> "Thanks for reviewing the x402 PoC! Code is here: ~/projects/zerion-x402-poc
>
> Key files:
> - x402-middleware.js - Core logic
> - DEPLOYMENT.md - Production plan
> - README.md - Full overview
>
> Happy to pair on next steps. LMK if you have questions!"

---

**Good luck! You've got this. 🚀**
