# Zerion API Reference

> Based on real testing with production API

## Authentication

**Method:** HTTP Basic Auth
- **Username:** Your API key (`zk_dev_...` or `zk_prod_...`)
- **Password:** Empty string
- **Get Keys:** https://dashboard.zerion.io

### Example (curl)
```bash
curl --user "zk_dev_YOUR_KEY:" https://api.zerion.io/v1/wallets/{address}/portfolio
```

### Example (axios)
```javascript
axios.get('https://api.zerion.io/v1/wallets/{address}/portfolio', {
  auth: {
    username: 'zk_dev_YOUR_KEY',
    password: ''
  }
})
```

## Rate Limits

| Key Type | Daily Limit | Where to Get |
|----------|-------------|--------------|
| Development | 300 calls/day | dashboard.zerion.io (free) |
| Production | Custom | Contact api@zerion.io |

## Base URL

```
https://api.zerion.io/v1
```

## Endpoints Tested

### 1. Portfolio

**Endpoint:** `GET /v1/wallets/{address}/portfolio`

**Parameters:**
- `currency` (optional): Default `usd`

**Response Schema:**
```json
{
  "links": {
    "self": "..."
  },
  "data": {
    "type": "portfolio",
    "id": "{address}",
    "attributes": {
      "positions_distribution_by_type": {
        "wallet": 1728147.34,
        "deposited": 0,
        "borrowed": 0,
        "locked": 0,
        "staked": 0
      },
      "positions_distribution_by_chain": {
        "ethereum": 1381466.17,
        "binance-smart-chain": 331606.28,
        "base": 10577.26,
        "arbitrum": 1598.46,
        "polygon": 633.90,
        "optimism": 610.23,
        "zksync-era": 38.23,
        "...": "..."
      }
    }
  }
}
```

**Tested With:**
- Address: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` (Vitalik)
- Total Value: $1.7M+
- Chains: 30+ supported chains

### 2. Transactions

**Endpoint:** `GET /v1/wallets/{address}/transactions`

**Parameters:**
- `page[size]` (optional): Number of transactions to return
- `page[cursor]` (optional): Pagination cursor

**Response Schema:**
```json
{
  "links": {
    "self": "...",
    "next": "..."
  },
  "data": [
    {
      "type": "transaction",
      "id": "{tx_hash}",
      "attributes": {
        "hash": "0x...",
        "mined_at": "2024-01-15T10:30:00Z",
        "operation_type": "transfer",
        "...": "..."
      }
    }
  ]
}
```

### 3. Positions (DeFi)

**Endpoint:** `GET /v1/wallets/{address}/positions`

Returns DeFi positions across protocols.

### 4. Charts

**Endpoint:** `GET /v1/wallets/{address}/charts`

Historical portfolio value over time.

## Chain Support

**EVM Chains (40+):**
- ethereum, arbitrum, optimism, base, polygon
- binance-smart-chain, avalanche, fantom
- zksync-era, linea, scroll, zora
- blast, mantle, polygon-zkevm
- ...and more

**Non-EVM:**
- solana (limited endpoints)

## Response Format

All responses follow JSON:API specification:
- `data`: Main response data
- `links`: Navigation links (pagination, self)
- `included`: Related resources (if requested)

## Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Wallet not found"
}
```

**429 Rate Limited:**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```

## Testing Notes

### What Works ✅
- Portfolio fetching with real-time values
- Multi-chain aggregation
- Value calculation in USD
- Transaction history
- HTTP Basic Auth

### Dev Key Limits ⚠️
- **300 calls/day** - Plan accordingly for testing
- No per-second rate limit (but be reasonable)
- Resets at midnight UTC

### Best Practices
1. **Cache responses** - Don't refetch same data repeatedly
2. **Use pagination** - Limit page size for transactions
3. **Error handling** - Always handle 401, 404, 429
4. **Address format** - Lowercase checksummed addresses work best
5. **HTTPS only** - HTTP requests will fail

## Integration Tips

### For x402 Integration

When integrating with x402:
1. **Authentication** - Use Basic Auth (not Bearer)
2. **Error passthrough** - Pass Zerion errors to client
3. **Rate limiting** - Track usage to avoid hitting limits
4. **Caching** - Cache portfolio data (updates ~30s anyway)
5. **Fallback** - Handle API downtime gracefully

### Example Integration

```javascript
async function fetchPortfolio(address) {
  try {
    const response = await axios.get(
      `https://api.zerion.io/v1/wallets/${address}/portfolio`,
      {
        auth: {
          username: process.env.ZERION_API_KEY,
          password: '',
        },
        params: { currency: 'usd' },
      }
    );
    return response.data;
  } catch (error) {
    // Handle rate limits
    if (error.response?.status === 429) {
      throw { error: 'Rate limit exceeded', retry_after: 3600 };
    }
    throw error;
  }
}
```

## Verified Test Results

**Test Date:** 2026-02-04
**API Key:** `zk_dev_c4a3fb29e7fa40568d8c621f4bf4d822` (dev key)

**Test Address:** `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`

**Results:**
- ✅ Portfolio: $1,724,002.96 total
- ✅ Top chains: Ethereum ($1.38M), BSC ($331K), Base ($10.6K)
- ✅ 30+ chains with balances
- ✅ Response time: ~500-800ms
- ✅ Authentication: Working with Basic Auth

## Next Steps for Production

1. **Get Production Key** - Contact api@zerion.io
2. **Set Higher Limits** - Negotiate based on usage
3. **Monitor Usage** - Track API calls per day
4. **Add Caching** - Redis for frequently accessed wallets
5. **Error Tracking** - Sentry/Datadog for API errors

---

**Official Docs:** https://developers.zerion.io
**Dashboard:** https://dashboard.zerion.io
**Support:** api@zerion.io
