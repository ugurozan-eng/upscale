# UPSCALE SAAS - SYSTEM ARCHITECTURE

## Project Overview

**Name**: Upscale SaaS  
**Type**: Multi-model AI image upscaling platform  
**Pricing Model**: Credit-based with subscription tiers  
**Target**: Creators, designers, photographers needing high-quality upscaling

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                  │
│  ┌─────────────┬──────────────┬─────────────────────┐  │
│  │ Upload UI   │ Before/After │ Job Status Tracking │  │
│  └─────────────┴──────────────┴─────────────────────┘  │
│  ┌─────────────┬──────────────┬─────────────────────┐  │
│  │ Auth Flow   │ Credit Mgmt  │ Payment Flow        │  │
│  └─────────────┴──────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▼ HTTPS/REST
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python 3.13)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Routes: /api/upscale, /api/webhooks, /api/auth│   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────┬──────────────┬─────────────────────┐  │
│  │Auth Guard   │ Rate Limiter │ Error Handler       │  │
│  └─────────────┴──────────────┴─────────────────────┘  │
│  ┌─────────────┬──────────────┬─────────────────────┐  │
│  │Replicate    │ Supabase     │ DO Spaces           │  │
│  │Service      │ Client       │ Client              │  │
│  └─────────────┴──────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ▼             ▼              ▼
┌──────────────┬──────────────┬──────────────┐
│  Supabase    │  Replicate   │  DO Spaces   │
│  (Auth+DB)   │  (AI Models) │  (Storage)   │
│              │              │              │
│ - Auth       │ - Recraft    │ - Images     │
│ - PostgreSQL │ - GFPGAN     │ - CDN        │
│ - Realtime   │ - CodeFormer │              │
│              │ - RealESRGAN │              │
└──────────────┴──────────────┴──────────────┘
         ▼
┌──────────────┬──────────────┐
│    Redis     │   Celery     │
│  (Queue)     │  (Workers)   │
└──────────────┴──────────────┘
```

## Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.13.1 | Runtime |
| FastAPI | 0.115+ | Web framework |
| Uvicorn | 0.32+ | ASGI server |
| Replicate | 1.0.4 | AI model API |
| Supabase | 2.9+ | Auth + Database |
| Boto3 | 1.35+ | S3/DO Spaces client |
| Celery | 5.4+ | Task queue |
| Redis | 5.2+ | Queue backend |
| Pillow | 10.4.0 | Image processing |
| Pydantic | 2.10+ | Data validation |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool |
| TailwindCSS | 3+ | Styling |
| React Query | 5+ | Server state |
| Zustand | 4+ | Client state |
| Axios | 1+ | HTTP client |

### Infrastructure
| Service | Purpose | Cost |
|---------|---------|------|
| DigitalOcean App Platform | Backend hosting | $5-12/mo |
| DigitalOcean Spaces | File storage | $5/mo |
| Supabase | Auth + Database | Free tier |
| Redis Cloud | Queue (dev) | Free tier |
| Replicate | AI processing | Pay-per-use |
| Lemon Squeezy | Payments | 5% + $0.50 |

## Database Schema (PostgreSQL via Supabase)

### Users Table
*Managed by Supabase Auth*
```sql
-- auth.users (built-in)
id                UUID PRIMARY KEY
email             TEXT UNIQUE
created_at        TIMESTAMP
email_confirmed   BOOLEAN
```

### User Credits Table
```sql
CREATE TABLE user_credits (
    user_id           UUID PRIMARY KEY REFERENCES auth.users(id),
    credits_remaining INT NOT NULL DEFAULT 10,
    credits_total     INT NOT NULL DEFAULT 10,
    subscription_type TEXT NOT NULL DEFAULT 'free',
                      -- ENUM: 'free', 'basic', 'pro'
    subscription_expires_at TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);

-- RLS (Row Level Security)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
    ON user_credits FOR SELECT
    USING (auth.uid() = user_id);
```

### Upscale Jobs Table
```sql
CREATE TABLE upscale_jobs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES auth.users(id),
    model_key         TEXT NOT NULL, -- 'recraft-crisp', 'gfpgan', etc.
    status            TEXT NOT NULL DEFAULT 'pending',
                      -- ENUM: 'pending', 'processing', 'completed', 'failed'
    input_image_url   TEXT NOT NULL,
    output_image_url  TEXT,
    prediction_id     TEXT, -- Replicate prediction ID
    credits_used      INT NOT NULL,
    error_message     TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMP
);

-- Indexes
CREATE INDEX idx_jobs_user_id ON upscale_jobs(user_id);
CREATE INDEX idx_jobs_status ON upscale_jobs(status);
CREATE INDEX idx_jobs_created_at ON upscale_jobs(created_at DESC);
CREATE INDEX idx_jobs_prediction_id ON upscale_jobs(prediction_id);

-- RLS
ALTER TABLE upscale_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
    ON upscale_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
    ON upscale_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES auth.users(id),
    type          TEXT NOT NULL, -- 'purchase', 'subscription', 'usage'
    credits       INT NOT NULL,  -- Positive for add, negative for usage
    amount_usd    DECIMAL(10, 2),
    description   TEXT,
    metadata      JSONB, -- Payment details, invoice URL, etc.
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);
```

## API Endpoints

### Health & Info
```
GET  /                    - Health check
GET  /health             - Detailed health status
```

### Upscale Operations
```
POST /api/upscale                 - Create upscale job
  Body: { file: File, model_key: string, scale?: number }
  Response: { job_id, status, model, message }

GET  /api/upscale/{job_id}        - Get job status
  Response: { job_id, status, input_url, output_url, ... }

GET  /api/upscale/models/list     - List available models
  Response: { models: {...} }

GET  /api/upscale/history         - Get user's job history
  Query: ?limit=50&offset=0
  Response: { jobs: [...], total }
```

### Webhooks
```
POST /api/webhooks/replicate/{job_id}  - Replicate callback
  Body: { id, status, output, error }

POST /api/webhooks/lemonsqueezy        - Payment webhook
  Body: Lemon Squeezy event payload
```

### Credits & Billing
```
GET  /api/credits                 - Get user credits
  Response: { credits_remaining, subscription_type, ... }

POST /api/credits/purchase        - Buy credits (redirect to LS)
  Body: { amount: number }
  Response: { checkout_url }
```

### Auth (via Supabase)
```
POST /api/auth/signup             - Sign up (email + password)
POST /api/auth/login              - Log in
POST /api/auth/logout             - Log out
GET  /api/auth/google             - Google OAuth
GET  /api/auth/me                 - Get current user
```

## AI Models & Pricing

| Model Key | Display Name | Scale | Speed | Cost/Run | Credits | Tier | Status |
|-----------|--------------|-------|-------|----------|---------|------|--------|
| `recraft-crisp` | Recraft Crisp Upscale | 4x | 3-5s | $0.05 | 5 | Premium | ✅ Tested |
| `gfpgan` | GFPGAN Face Restore | 2x | 5-10s | $0.02 | 2 | Standard | ⏳ TODO |
| `codeformer` | CodeFormer Face Enhance | 2x | 5-10s | $0.03 | 3 | Standard | ⏳ TODO |
| `realesrgan` | RealESRGAN | 4x | 5-10s | $0.02 | 2 | Standard | ⏳ TODO |

## Subscription Tiers

| Tier | Price | Credits/Month | Models | Support | API |
|------|-------|---------------|--------|---------|-----|
| **Free** | $0 | 10 | Recraft Crisp only | Community | ❌ |
| **Basic** | $9.99 | 100 | All models | Email | ❌ |
| **Pro** | $29.99 | 500 | All models | Priority | ✅ |

### Credit Packages (One-time Purchase)
- 25 credits → $4.99
- 50 credits → $8.99
- 100 credits → $14.99
- 250 credits → $29.99

## File Upload/Download Flow

### Upload Process
```
1. User selects file in frontend
2. Frontend validates (type, size < 10MB)
3. POST to /api/upscale with multipart/form-data
4. Backend validates file
5. Backend uploads to DO Spaces: /uploads/{user_id}/{job_id}_original.{ext}
6. Backend gets public URL from DO Spaces (CDN)
7. Backend creates job in database (status: pending)
8. Backend creates Replicate prediction with webhook
9. Backend returns job_id to frontend
10. Frontend polls /api/upscale/{job_id} or uses Supabase Realtime
```

### Webhook Process
```
1. Replicate completes upscale
2. Replicate POSTs to /api/webhooks/replicate/{job_id}
3. Backend receives output URL
4. Backend downloads from Replicate URL
5. Backend uploads to DO Spaces: /results/{user_id}/{job_id}_upscaled.{ext}
6. Backend updates job in database (status: completed, output_url)
7. Backend triggers Supabase Realtime update
8. Frontend receives update, displays result
```

### File Storage Structure (DO Spaces)
```
bucket: upscale-saas/
├── uploads/
│   └── {user_id}/
│       └── {job_id}_original.jpg
└── results/
    └── {user_id}/
        └── {job_id}_upscaled.jpg

CDN URL: https://upscale-saas.fra1.cdn.digitaloceanspaces.com/...
```

## Error Handling Strategy

### HTTP Status Codes
- `200` - Success
- `201` - Created (new job)
- `400` - Bad request (validation error)
- `401` - Unauthorized (no token)
- `403` - Forbidden (insufficient credits)
- `404` - Not found
- `429` - Too many requests (rate limit)
- `500` - Internal server error
- `503` - Service unavailable (external API down)

### Error Response Format
```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You need 5 credits but have 2 remaining",
    "details": {
      "required": 5,
      "available": 2
    }
  }
}
```

### Retry Strategy
- Replicate API: 3 retries with exponential backoff (1s, 2s, 4s)
- DO Spaces: 2 retries
- Supabase: 2 retries
- Max total wait: 30 seconds

## Security Measures

### Authentication
- JWT tokens from Supabase (1 hour expiry)
- Refresh tokens (30 days)
- OAuth2 for Google sign-in

### Authorization
- Row Level Security (RLS) in Supabase
- User can only access own jobs/credits/transactions
- Admin role for dashboard access

### Input Validation
- File type: JPEG, PNG, WebP only
- File size: Max 10MB
- Image dimensions: Max 4096x4096px
- Filename sanitization

### Rate Limiting (Redis)
- Free tier: 10 requests/hour
- Basic tier: 50 requests/hour
- Pro tier: 200 requests/hour
- Webhook endpoints: No limit (verified by signature)

### CORS
- Production: Only frontend domain
- Development: localhost:5173

## Monitoring & Logging

### Logs (Structured JSON)
```python
{
  "timestamp": "2025-01-21T10:30:00Z",
  "level": "INFO",
  "service": "backend",
  "message": "Job created",
  "context": {
    "job_id": "123e4567-e89b...",
    "user_id": "456e7890-e12b...",
    "model": "recraft-crisp"
  }
}
```

### Metrics to Track
- Total jobs created
- Jobs by status (pending, processing, completed, failed)
- Average processing time per model
- Credit usage per user
- API response times
- Error rates
- Payment conversion rate

### Alerts
- Replicate API failures > 5% (last hour)
- DO Spaces upload failures > 3% (last hour)
- Job processing time > 2 minutes
- Server error rate > 1% (last 5 minutes)

## Scaling Strategy

### Phase 1: MVP (0-100 users)
- Single DO App instance ($5/mo)
- Supabase free tier
- Redis Cloud free tier
- Handle ~1000 jobs/day

### Phase 2: Growth (100-1K users)
- Scale DO App to 2-3 instances ($12/mo)
- Upgrade Redis to $15/mo
- Add Sentry for error tracking
- Handle ~10K jobs/day

### Phase 3: Scale (1K+ users)
- Move to DO Kubernetes
- Separate Celery workers
- CDN for frontend
- Database read replicas
- Handle ~100K jobs/day

## Development Workflow

### Local Development
```bash
# Backend
cd backend
source venv/Scripts/activate  # Windows
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev

# Celery (when implemented)
celery -A app.tasks worker --loglevel=info
```

### Git Workflow
```
main (production)
  └── develop (staging)
       └── feature/user-auth
       └── feature/payment-integration
       └── bugfix/webhook-retry
```

### Deployment
- Push to GitHub
- GitHub Actions runs tests
- Auto-deploy to DO App Platform (main branch)
- Frontend auto-deploy to Vercel (main branch)

## Future Enhancements (Post-MVP)

### Features
- [ ] Batch upload (multiple images)
- [ ] Image comparison tool
- [ ] Custom model training
- [ ] API for developers
- [ ] Mobile app (React Native)
- [ ] Referral program
- [ ] Team/enterprise plans

### Technical
- [ ] GraphQL API option
- [ ] WebSocket for real-time updates
- [ ] Image optimization before upscale
- [ ] Smart cropping recommendations
- [ ] A/B testing framework

---

**Last Updated**: 2025-01-21  
**Status**: Phase 1 - Backend Core Development  
**Next Review**: After MVP launch
