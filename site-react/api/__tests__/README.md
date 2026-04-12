# API Tests

Comprehensive test suite for all integrated services including Stripe, Resend, and PostgreSQL.

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Watch mode
npm test -- --watch

# UI mode
npm run test:ui

# Coverage report
npm run test:coverage
```

## Test Files

### Order Notifications (`orderNotifications.test.js`)
Tests for Resend email notification service.

**Coverage:**
- Email configuration validation (enabled/disabled)
- Partial configuration error handling
- Successful email sending via Resend API
- Order details formatting in email body
- API error handling
- Network failure handling
- Currency formatting (USD, other currencies)
- Address formatting (complete, partial, missing)
- Multiple items in single order
- Unavailable prices

**Key Tests:**
```javascript
// Configuration tests
- Returns disabled status when no env vars set
- Throws error when partially configured
- Successfully sends notification with all env vars

// Email formatting tests
- Formats currency correctly ($100.00)
- Handles missing address fields
- Handles null/empty addresses
- Formats multiple items properly
```

### Orders (`orders.test.js`)
Tests for order creation and normalization from Stripe sessions.

**Coverage:**
- Order creation from Stripe checkout sessions
- Address normalization (handling null/missing fields)
- Line item normalization
- Payment status tracking
- Customer information parsing
- Database transaction handling

**Key Tests:**
```javascript
// Order creation tests
- Creates order with all session data
- Normalizes shipping and billing addresses
- Handles missing address fields gracefully
- Defaults to null for missing addresses

// Line item tests
- Normalizes product and price information
- Handles string price references
- Defaults quantity to 1 for invalid values
- Extracts product metadata

// Address handling tests
- Normalizes complete addresses
- Handles partial addresses
- Handles null addresses
```

### Stripe Products (`stripeProducts.test.js`)
Tests for fetching and serializing Stripe products and prices.

**Coverage:**
- Product search by item IDs
- Price resolution (object, string reference, listing)
- Product deduplication
- Search value escaping (prevent injection)
- Error handling (missing products, API errors)

**Key Tests:**
```javascript
// Product fetching tests
- Fetches products by item IDs
- Returns empty map for no IDs
- Deduplicates item IDs
- Escapes search values properly

// Price resolution tests
- Resolves price from default_price object
- Retrieves price by string ID
- Lists prices when no default_price
- Handles missing price scenarios

// Error handling tests
- Handles product not found
- Handles Stripe API errors
- Handles price retrieval errors
```

### Inventory (`inventory.test.js`)
Tests for inventory reservation and management.

**Coverage:**
- Inventory reservation for limited editions
- Reservation finalization (completing orders)
- Reservation release (expired checkout sessions)
- Inventory validation (sufficient stock)
- Invalid request filtering
- Database transaction handling

**Key Tests:**
```javascript
// Reservation tests
- Reserves inventory for products
- Generates unique reservation IDs
- Validates quantity and cap values
- Handles insufficient inventory

// Release tests
- Finalizes reservations after purchase
- Releases reservations on session expiration
- Deduplicates reservation IDs
- Handles empty ID lists
```

### Prices API (`prices.test.js`)
Tests for the `/api/prices` endpoint.

**Coverage:**
- HTTP method validation (POST only)
- Input validation (item IDs required)
- Price fetching and serialization
- Error handling
- Response formatting

**Key Tests:**
```javascript
// Endpoint tests
- Rejects non-POST requests
- Returns 400 for empty item IDs
- Fetches and serializes prices

// Serialization tests
- Filters out null prices
- Maintains currency formatting
- Includes price metadata
```

### Availability API (`availability.test.js`)
Tests for the `/api/availability` endpoint.

**Coverage:**
- HTTP method validation
- Input validation
- Availability status determination
- Limited edition vs. unlimited products
- Inventory calculations (cap, sold, reserved)
- Error handling

**Key Tests:**
```javascript
// Status determination tests
- Returns 'missing' for products not found
- Returns 'unlimited' for products without edition_cap
- Returns 'available' when stock exists
- Returns 'sold_out' when inventory depleted

// Inventory calculation tests
- Correctly calculates available = cap - sold - reserved
- Handles missing inventory records
- Handles default values (0 sold/reserved)
```

### Checkout API (`checkout.test.js`)
Tests for the `/api/checkout` endpoint.

**Coverage:**
- Cart validation
- Stripe checkout session creation
- Line item formatting
- Inventory reservation integration
- Limited edition vs. unlimited handling
- URL construction (success/cancel)
- Error handling

**Key Tests:**
```javascript
// Cart validation tests
- Rejects empty carts
- Accepts valid item IDs and quantities
- Defaults quantity to 1

// Checkout session tests
- Creates Stripe session with correct parameters
- Includes reserved inventory IDs in metadata
- Uses product prices from Stripe
- Constructs correct redirect URLs

// URL tests
- Uses SITE_URL environment variable if set
- Falls back to request headers
- Handles x-forwarded headers for proxies
```

### Stripe Webhook (`stripe-webhook.test.js`)
Tests for the `/api/stripe-webhook` endpoint.

**Coverage:**
- Webhook signature verification
- checkout.session.completed event handling
- checkout.session.expired event handling
- Order creation and notification flow
- Reservation finalization/release
- Error handling and recovery

**Key Tests:**
```javascript
// Authorization tests
- Returns 500 if STRIPE_WEBHOOK_SECRET not set
- Returns 400 for invalid signature

// Event handling tests
- Handles checkout completed (order + notification)
- Handles checkout expired (release reservations)
- Skips notification for already-notified orders
- Initializes reservations from metadata

// Error handling tests
- Marks notification as failed on error
- Handles lineup item fetch failures
- Handles invalid JSON in metadata
```

## Environment Variables

The tests mock external services, but these environment variables should be set for local testing:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Resend (for notification tests)
RESEND_API_KEY=re_...
ORDER_NOTIFICATION_EMAIL_TO=admin@example.com
ORDER_NOTIFICATION_EMAIL_FROM=orders@example.com

# Database
DATABASE_URL=postgresql://...

# Optional
SITE_URL=https://yourdomain.com
```

## Test Structure

Each test file follows this pattern:

```javascript
describe('Service/Endpoint Name', () => {
  describe('Feature Group', () => {
    beforeEach(() => {
      // Setup mocks and test data
    })

    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

## Mocking Strategy

### External Services
- **Stripe**: Mocked at module level with vi.mock()
- **Resend**: Global fetch is mocked
- **PostgreSQL**: Database client mocked with query responses

### Mock Factory Functions
Each test file includes factory functions for creating consistent test data:

```javascript
const createMockOrder = (overrides = {}) => ({
  id: 'order-123',
  customerEmail: 'test@example.com',
  // ... default values
  ...overrides, // Allow overriding specific fields
})
```

## Coverage

Current coverage includes:

- **Unit Tests**: All pure functions (formatting, normalization, parsing)
- **Integration Tests**: Service interactions with mocked dependencies
- **Error Cases**: All error types and edge cases
- **Edge Cases**: Empty values, null values, invalid formats

Run coverage report:
```bash
npm run test:coverage
```

## Debugging Tests

```bash
# Run a specific test file
npm test -- orderNotifications.test.js

# Run tests matching a pattern
npm test -- --grep "Configuration"

# Run single test
npm test -- -t "should send order notification"

# Watch mode on specific file
npm test -- --watch orderNotifications.test.js

# Interactive UI (helpful for debugging)
npm run test:ui
```

## Adding New Tests

1. Create test file in `api/__tests__/` directory
2. Follow naming convention: `{service}.test.js`
3. Import the service and create mocks
4. Use factory functions for test data
5. Group related tests with `describe()`
6. Write focused, independent tests

## Integration Testing

For testing the full flow with real services, you can:

1. Use a test Stripe account
2. Set up a test PostgreSQL database
3. Use Resend's preview inbox for email testing
4. Run tests with real environment variables

```bash
# Integration test (requires STRIPE_SECRET_KEY, DATABASE_URL, etc.)
npm test -- --integration
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```
