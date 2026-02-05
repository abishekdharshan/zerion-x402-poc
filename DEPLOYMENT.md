# Deployment Guide: Zerion API x402 Integration

This guide covers the 95% of work that Grayson mentioned: config, deployment, and k8s setup.

## Prerequisites

- [ ] Zerion payment wallet address created
- [ ] Access to k8s cluster
- [ ] Access to secrets management (kubectl or similar)
- [ ] @coinbase/x402 package published or accessible

## 1. Kubernetes Configuration

### Secret Management

Create a k8s secret for the payment wallet:

```bash
kubectl create secret generic zerion-x402-config \
  --from-literal=ZERION_PAYMENT_WALLET=0x... \
  --namespace=production
```

### Deployment YAML

Update your existing API deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zerion-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zerion-api
  template:
    metadata:
      labels:
        app: zerion-api
    spec:
      containers:
      - name: api
        image: zerion/api:latest
        env:
        - name: ZERION_PAYMENT_WALLET
          valueFrom:
            secretKeyRef:
              name: zerion-x402-config
              key: ZERION_PAYMENT_WALLET
        - name: NODE_ENV
          value: "production"
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 2. Service Configuration

Ensure your k8s service exposes x402 endpoints:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: zerion-api
  namespace: production
spec:
  selector:
    app: zerion-api
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 3. Ingress Configuration

Add x402 routes to your ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: zerion-api-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: api.zerion.io
    http:
      paths:
      # Existing API key routes
      - path: /v1/wallets
        pathType: Prefix
        backend:
          service:
            name: zerion-api
            port:
              number: 80
      # New x402 routes
      - path: /v1/x402
        pathType: Prefix
        backend:
          service:
            name: zerion-api
            port:
              number: 80
```

## 4. Monitoring & Logging

### Prometheus Metrics

Add custom metrics for x402 tracking:

```javascript
// In your Express app
const prometheus = require('prom-client');

const x402RequestsTotal = new prometheus.Counter({
  name: 'x402_requests_total',
  help: 'Total number of x402 payment requests',
  labelNames: ['endpoint', 'status']
});

const x402PaymentAmount = new prometheus.Counter({
  name: 'x402_payment_amount_total',
  help: 'Total payment amount received via x402',
  labelNames: ['chain', 'endpoint']
});

// In middleware
x402RequestsTotal.inc({ endpoint: 'transactions', status: 'success' });
```

### Datadog Dashboard

Create dashboard to track:
- 402 responses per minute
- Payment success rate
- Average payment verification latency
- Failed payment attempts
- Revenue per endpoint

## 5. Environment Variables Checklist

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `ZERION_PAYMENT_WALLET` | Yes | `0xYourWallet...` | Receives x402 payments |
| `NODE_ENV` | Yes | `production` | Environment |
| `X402_ENABLED` | No | `true` | Feature flag |
| `X402_CHAINS` | No | `8453,137,43114` | Supported chain IDs |
| `SENTRY_DSN` | No | `https://...` | Error tracking |

## 6. Database Schema (Optional)

If tracking payments in database:

```sql
CREATE TABLE x402_payments (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  chain_id INT NOT NULL,
  amount VARCHAR(50) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  payer_address VARCHAR(42) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  wallet_address VARCHAR(42),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT false,

  INDEX idx_tx_hash (tx_hash),
  INDEX idx_payer (payer_address),
  INDEX idx_endpoint (endpoint),
  INDEX idx_timestamp (timestamp)
);
```

## 7. Rate Limiting

Configure rate limits for x402 endpoints:

```javascript
const rateLimit = require('express-rate-limit');

const x402RateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Much higher than API key endpoints
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/v1/x402', x402RateLimiter);
```

## 8. Deployment Steps

### Staging

```bash
# 1. Build and push Docker image
docker build -t zerion/api:x402-v1 .
docker push zerion/api:x402-v1

# 2. Apply to staging
kubectl apply -f k8s/staging/deployment.yaml -n staging

# 3. Create secrets
kubectl create secret generic zerion-x402-config \
  --from-literal=ZERION_PAYMENT_WALLET=0xYourStagingWallet \
  --namespace=staging

# 4. Verify deployment
kubectl get pods -n staging
kubectl logs -f deployment/zerion-api -n staging

# 5. Test endpoint
curl https://api-staging.zerion.io/v1/x402/wallets/0x.../transactions
# Should return 402 Payment Required
```

### Production

```bash
# 1. Tag production image
docker tag zerion/api:x402-v1 zerion/api:x402-prod

# 2. Deploy with gradual rollout
kubectl set image deployment/zerion-api \
  api=zerion/api:x402-prod \
  -n production \
  --record

# 3. Watch rollout
kubectl rollout status deployment/zerion-api -n production

# 4. Verify health
kubectl get pods -n production | grep zerion-api

# 5. Monitor metrics
# Check Datadog dashboard for errors
```

## 9. Rollback Plan

If issues arise:

```bash
# Immediate rollback
kubectl rollout undo deployment/zerion-api -n production

# Or rollback to specific revision
kubectl rollout history deployment/zerion-api -n production
kubectl rollout undo deployment/zerion-api --to-revision=<N> -n production
```

## 10. Post-Deployment Checklist

- [ ] Verify 402 responses for unauthenticated requests
- [ ] Test successful payment flow on each supported chain
- [ ] Check Prometheus metrics are reporting
- [ ] Verify logs are being collected
- [ ] Test rate limiting
- [ ] Confirm payment wallet is receiving funds
- [ ] Monitor error rates for 24 hours
- [ ] Update documentation with new endpoints
- [ ] Announce on X / Discord / Blog

## 11. Troubleshooting

### Issue: 402 not returning payment schemes

```bash
# Check environment variable is set
kubectl exec -it deployment/zerion-api -n production -- env | grep ZERION_PAYMENT

# Check middleware is loaded
kubectl logs deployment/zerion-api -n production | grep x402
```

### Issue: Payment verification failing

```bash
# Check @coinbase/x402 version
kubectl exec -it deployment/zerion-api -n production -- npm list @coinbase/x402

# Check logs for verification errors
kubectl logs deployment/zerion-api -n production --tail=100 | grep "verification error"
```

### Issue: High latency

```bash
# Check pod resources
kubectl top pods -n production | grep zerion-api

# Scale up if needed
kubectl scale deployment/zerion-api --replicas=5 -n production
```

## 12. Monitoring Alerts

Set up alerts for:

```yaml
alerts:
  - name: X402HighFailureRate
    condition: x402_payment_failures > 10%
    action: Page on-call engineer

  - name: X402PaymentWalletLowBalance
    condition: wallet_balance < 100 USDC
    action: Notify finance team

  - name: X402HighLatency
    condition: p99_latency > 5s
    action: Notify engineering
```

## Questions for Engineering Team

1. **Payment Tracking**: Do we store all payments in DB or just for compliance?
2. **Chain Selection**: Which chains should we prioritize? (Base recommended)
3. **Failure Handling**: What happens if payment verification RPC is down?
4. **Scaling**: Do we need dedicated payment verification workers?
5. **Dashboard**: Should users see payment history in dashboard.zerion.io?

---

**Estimated Time:**
- Code integration: 4 hours
- K8s config: 2 hours
- Staging deployment & testing: 4 hours
- Production deployment: 2 hours
- Monitoring setup: 2 hours

**Total: ~2-3 days** (matches Grayson's estimate)
