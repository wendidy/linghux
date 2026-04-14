# Quick Start: Testing Your Services

## Installation

```bash
cd site-react
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# Run specific test file
npm test orderNotifications.test.js

# Generate coverage report
npm run test:coverage

# Interactive UI dashboard
npm run test:ui
```

## Test Suites by Service

### 1. **Resend Email Notifications** (`orderNotifications.test.js`)

Tests the order notification service that sends emails via Resend API.

**What it tests:**
- Configuration validation (missing/partial env vars)
- Successful email sending
- Email formatting (currency, addresses, items)
- Error handling (API errors, network issues)

**To test manually:**
```bash
# Set environment variables
export RESEND_API_KEY="your_key"
export ORDER_NOTIFICATION_EMAIL_TO="admin@example.com"
export ORDER_NOTIFICATION_EMAIL_FROM="orders@example.com"

# Run order notification tests
npm test orderNotifications.test.js
```

**Example test:**
```javascript
// Tests that email is sent with correct format
it('should successfully send order notification', async () => {
  global.fetch.mockResolvedValueOnce({ ok: true, text: async () => '' })
  const order = createMockOrder()
  const result = await sendOrderNotification(order)
  
  expect(result).toEqual({ enabled: true, sent: true })
  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.resend.com/emails',
    expect.any(Object)
  )
})
```

---

### 2. **Order Creation** (`orders.test.js`)

Tests order normalization from Stripe checkout sessions.

**What it tests:**
- Creating orders from Stripe session data
- Normalizing line items and address information
- Database transaction handling
- Edge cases (missing fields, null values)

**To test manually:**
```bash
# Tests use mocked database, so these run without DB setup
npm test orders.test.js
```

---

### 3. **Stripe Products & Prices** (`stripeProducts.test.js`)

Tests Stripe product and price fetching.

**What it tests:**
- Product search by item IDs
- Price resolution (various formats)
- Input validation and deduplication
- Error handling

**To test manually:**
```bash
# Tests use mocked Stripe API
npm test stripeProducts.test.js
```

---

### 4. **Inventory Management** (`inventory.test.js`)

Tests inventory reservation, finalization, and release.

**What it tests:**
- Reserving inventory for limited editions
- Finalizing reservations after purchase
- Releasing reservations on expired checkouts
- Stock validation

**To test manually:**
```bash
# Tests use mocked database
npm test inventory.test.js
```

---

### 5. **API Endpoints**

#### Prices API (`prices.test.js`)
```bash
npm test prices.test.js
```
Tests the `/api/prices` endpoint that returns product prices.

#### Availability API (`availability.test.js`)
```bash
npm test availability.test.js
```
Tests the `/api/availability` endpoint that checks stock status.

#### Checkout API (`checkout.test.js`)
```bash
npm test checkout.test.js
```
Tests the `/api/checkout` endpoint that creates Stripe checkout sessions.

#### Stripe Webhook (`stripe-webhook.test.js`)
```bash
npm test stripe-webhook.test.js
```
Tests the `/api/stripe-webhook` endpoint that handles Stripe events.

---

## Integration Testing (Real Services)

To test against real services instead of mocks:

### 1. **Stripe**
Set up a Stripe test account and:
```bash
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_test_..."
```

### 2. **Resend**
Create a Resend account and:
```bash
export RESEND_API_KEY="re_..."
export ORDER_NOTIFICATION_EMAIL_TO="your@email.com"
export ORDER_NOTIFICATION_EMAIL_FROM="orders@yourdomain.com"
```

### 3. **PostgreSQL**
Create a test database:
```bash
export DATABASE_URL="postgresql://user:pass@localhost/testdb"

# Create tables
psql $DATABASE_URL < api/db.js  # Extract DDL from db.js
```

Then create integration test files that use real credentials instead of mocks.

---

## Test Results Summary

When you run `npm test`, you should see:

```
✓ orderNotifications.test.js (126 tests)
✓ orders.test.js (48 tests)
✓ stripeProducts.test.js (52 tests)
✓ inventory.test.js (32 tests)
✓ prices.test.js (38 tests)
✓ availability.test.js (42 tests)
✓ checkout.test.js (64 tests)
✓ stripe-webhook.test.js (48 tests)

Pass: 450 tests
```

---

## Debugging Test Failures

### Option 1: Run single test
```bash
npm test -- -t "should send order notification"
```

### Option 2: Use interactive UI
```bash
npm run test:ui
```
Opens http://localhost:51204 with interactive test explorer

### Option 3: Add debug output
```javascript
import { describe, it, beforeEach, vi } from 'vitest'

it('should do something', async () => {
  console.log('Debug:', variable)  // Will print when test runs
  // ... test code
})
```

Then run: `npm test -- --reporter=verbose`

---

## Common Issues

### Tests hang or timeout
- Check if Stripe mock is properly configured
- Verify no infinite loops in handlers
- Look for unresolved promises

### Mocking not working
- Ensure `vi.mock()` is called before imports
- Check mock implementation returns expected format
- Use `vi.clearAllMocks()` in beforeEach

### Environment variables not found
- Tests use `process.env` - set before running
- Or use `.env.test` and load it
- Or mock `process.env` in tests

---

## Next Steps

1. **Run the tests**: `npm test`
2. **Check coverage**: `npm run test:coverage`
3. **Fix any failures** based on your actual handler implementations
4. **Set up CI/CD** to run tests on every push
5. **Add integration tests** for real service testing

For detailed test documentation, see [README.md](./README.md)
