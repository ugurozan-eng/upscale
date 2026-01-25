# CLAUDE CODE - PROJECT RULES

## CRITICAL RULES - ALWAYS FOLLOW

### 1. NEVER Change Core Decisions Without Asking
- ❌ NEVER switch Replicate model without approval
- ❌ NEVER change database schema without approval
- ❌ NEVER modify payment logic without approval
- ❌ ALWAYS ask before major architectural changes

### 2. Replicate Integration
- Model: `recraft-ai/recraft-crisp-upscale` (PRIMARY)
- Python version: 3.13
- ALWAYS use webhook, NEVER polling
- Retry failed calls max 3 times with exponential backoff
- Test script already working: `scripts/test_replicate.py`
- API connection verified: 3.9s processing time, $0.01 cost

### 3. Documentation
- ALWAYS update `docs/PROGRESS.md` after each feature
- ALWAYS update `docs/ARCHITECTURE.md` when structure changes
- Keep docs/ folder current with latest decisions
- Document all API endpoints
- Document all environment variables

### 4. Testing
- ALWAYS run tests before marking task complete
- Create test for each new feature
- Use pytest for backend tests
- Test error cases, not just happy path
- Integration tests for external services (Replicate, Supabase, DO Spaces)

### 5. Version Control
- Commit after each working feature
- Use descriptive commit messages
- Don't commit .env files
- Don't commit venv/ folder

### 6. Error Handling
- ALWAYS log errors with context
- NEVER expose internal errors to users
- Use proper HTTP status codes
- Provide helpful error messages to users
- Implement retry logic for external API calls

### 7. Security
- NEVER store sensitive data in code
- Validate all user inputs
- Sanitize file uploads
- Use Row Level Security (RLS) in Supabase
- Implement rate limiting
- Use HTTPS in production

## TECH STACK (CONFIRMED)

### Backend
- **FastAPI** (Python 3.13) - REST API framework
- **Replicate API** - AI upscale models
- **Supabase** - Auth (Google/Email) + PostgreSQL database
- **DigitalOcean Spaces** - S3-compatible object storage
- **Celery** - Async job queue
- **Redis** - Queue backend + rate limiting

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Server state management
- **Zustand** - Client state management
- **react-image-crop** - Before/after slider component

### External Services
- **Replicate** - AI model hosting
- **Supabase** - Backend-as-a-Service
- **DigitalOcean** - Infrastructure (App Platform + Spaces)
- **Lemon Squeezy** - Payment processing

### DevOps
- **DigitalOcean App Platform** - Backend hosting
- **Vercel/Netlify** - Frontend hosting (optional)
- **GitHub Actions** - CI/CD
- **Sentry** - Error tracking

## CURRENT STATUS

### Completed ✅
- Project structure created (`upscale-saas/`)
- Python 3.13 virtual environment
- Replicate API connection tested successfully
- `recraft-crisp` model verified (3.9s, $0.01 per run)
- Environment variables configured (`.env`)
- FastAPI basic structure running on port 8000
- Basic routes created (health, models list)
- Test script working (`scripts/test_replicate.py`)

### In Progress 🚧
- Supabase integration
- DigitalOcean Spaces file upload/download
- Webhook handler completion
- Database schema creation

### Not Started ❌
- React frontend
- Auth flow (Google + Email)
- Payment integration (Lemon Squeezy)
- Credit management system
- Job queue (Celery)
- Admin panel
- Testing suite

## NEXT STEPS (YOUR TASKS)

### Phase 1: Backend Core (Priority: HIGH)
1. **Supabase Integration**
   - Install `supabase` package
   - Create database connection
   - Implement auth middleware
   - Set up database schema

2. **DigitalOcean Spaces**
   - Install `boto3` package
   - Implement file upload function
   - Implement file download function
   - Generate signed URLs

3. **Complete Webhook Handler**
   - Download result from Replicate
   - Upload to DO Spaces
   - Update database
   - Handle errors

4. **Database Schema**
   - Create tables in Supabase
   - Set up Row Level Security (RLS)
   - Create indexes
   - Add foreign keys

### Phase 2: Job Queue (Priority: HIGH)
5. **Celery Setup**
   - Install Celery + Redis
   - Configure worker
   - Create upscale task
   - Implement retry logic

### Phase 3: Frontend (Priority: MEDIUM)
6. **React App**
   - Create Vite project
   - Set up TailwindCSS
   - Build upload UI
   - Implement before/after slider

7. **Auth Flow**
   - Supabase Auth integration
   - Google OAuth
   - Email/password signup
   - Protected routes

### Phase 4: Payment (Priority: MEDIUM)
8. **Lemon Squeezy**
   - Webhook handler
   - Credit purchase flow
   - Subscription management
   - Usage tracking

### Phase 5: Testing (Priority: HIGH)
9. **Test Suite**
   - Unit tests (pytest)
   - Integration tests
   - E2E tests
   - Load testing

## ENVIRONMENT VARIABLES

```bash
# Already configured in .env
REPLICATE_API_TOKEN=r8_xxx...

# Need to add:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

DO_SPACES_KEY=xxx
DO_SPACES_SECRET=xxx
DO_SPACES_REGION=fra1
DO_SPACES_BUCKET=upscale-saas
DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com

REDIS_URL=redis://localhost:6379

LEMONSQUEEZY_API_KEY=xxx
LEMONSQUEEZY_WEBHOOK_SECRET=xxx

BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

## IMPORTANT NOTES

- **User Profile**: Turkish developer, comfortable with English, experienced with web development
- **Environment**: Windows 11, Python 3.13.1
- **Resources**: DigitalOcean $200 credit available (February), Supabase free tier
- **Focus**: Scalability from day 1, clean code, proper error handling
- **Goal**: Launch MVP quickly, iterate based on user feedback

## QUALITY STANDARDS

### Code Quality
- Type hints for all functions
- Docstrings for all public functions
- No hardcoded values
- DRY principle
- SOLID principles

### API Design
- RESTful conventions
- Proper HTTP status codes
- Consistent response format
- Pagination for lists
- Proper error messages

### Performance
- Async/await for I/O operations
- Database query optimization
- CDN for static assets
- Image optimization
- Caching where appropriate

## COMMUNICATION

### When to Ask User
- Major architectural decisions
- Changing confirmed models/services
- Security-critical implementations
- Pricing/credit logic
- UI/UX decisions
- Breaking changes

### When to Proceed
- Bug fixes
- Code refactoring
- Adding tests
- Documentation updates
- Minor improvements
- Error handling

## DEBUGGING

### Common Issues
- **Replicate rate limit**: User has <$5 credit, limited to 6 req/min
- **Python 3.14**: Some packages don't support yet, use 3.13
- **Windows paths**: Use forward slashes or Path objects
- **CORS**: Remember to add frontend URL to allowed origins

### Logs
- Log all external API calls
- Log all errors with stack traces
- Log job status changes
- Don't log sensitive data (tokens, passwords)

## SUCCESS CRITERIA

### For Each Feature
- ✅ Code works as expected
- ✅ Tests pass
- ✅ Documentation updated
- ✅ Error handling implemented
- ✅ Logs added
- ✅ No hardcoded values
- ✅ User informed of completion

### For MVP Launch
- ✅ Users can sign up (Google + Email)
- ✅ Users can upload images
- ✅ Upscale works (Recraft Crisp)
- ✅ Users can download results
- ✅ Before/after comparison works
- ✅ Credit system works
- ✅ Payment works (buy credits)
- ✅ Admin can see metrics

---

**Remember: When in doubt, ASK THE USER first!** 🚀
