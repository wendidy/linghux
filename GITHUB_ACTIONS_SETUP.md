# GitHub Actions CI/CD Setup Guide

## What's Been Created

I've created a GitHub Actions workflow that automatically runs your tests on every commit. Here's what happens:

### Workflow File: `.github/workflows/test.yml`

This workflow:

1. **Triggers on:**
   - Push to **any branch**
   - **Any** pull request (to any branch)
   - Changes to API code, dependencies, or the workflow itself
   - Manual trigger (via GitHub Actions UI)

2. **Runs two jobs in parallel:**
   - **Test Job** - Tests on Node 18 and 20
   - **Linting Job** - Optional checks

3. **Steps in Test Job:**
   - ✅ Checkout your code
   - ✅ Setup Node.js (tests both 18.x and 20.x versions)
   - ✅ Install dependencies with `npm ci`
   - ✅ Run all tests with `npm test -- --run`
   - ✅ Generate coverage report
   - ✅ Upload coverage to Codecov (optional)
   - ✅ Comment on PR with results

---

## How It Works

### On Every Push to Any Branch:
```
Your Commit
    ↓
GitHub detects changes
    ↓
Workflow triggers
    ↓
Tests run (Node 18.x and 20.x)
    ↓
✅ Pass → Code is good to merge
❌ Fail → You get notified, can fix before merging
```

### On Every Pull Request:
```
Create PR
    ↓
Workflow runs automatically
    ↓
Tests execute
    ↓
Posts comment with results
    ↓
You can't merge until tests pass (if branch protection enabled)
```

### On Demand:
```
Actions tab → test.yml → Run workflow
    ↓
Choose branch
    ↓
Tests run
```

---

## How to Use

### View Test Results in GitHub

1. Go to your repository
2. Click the **Actions** tab
3. Find the workflow run (shows commit message)
4. Click to see detailed results:
   - ✅ Passed tests
   - ❌ Failed tests with error messages
   - Coverage reports

### Local Testing (Before Pushing)

```bash
cd site-react

# Run all tests once
npm test -- --run

# Run tests in watch mode (develop locally)
npm test

# Run specific test file
npm test -- api/__tests__/orderNotifications.test.js --run

# Generate coverage report locally
npm run test:coverage
```

### Prevent Broken Commits

Best practice: **Run tests locally before pushing**

```bash
# Before git push:
cd site-react
npm test -- --run

# If all pass ✅
git push

# If any fail ❌
# Fix the issues, re-run tests, then push
```

---

## Workflow Configuration Details

### Node Versions Tested
The workflow tests on:
- Node 18.x (legacy support)
- Node 20.x (current LTS)

This ensures compatibility. You can modify in `.github/workflows/test.yml`:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]  # Add or remove versions here
```

### Runs on All Branches & PRs
The workflow triggers on all branches and all pull requests when these files change:

```yaml
paths:
  - 'site-react/api/**'
  - 'site-react/package.json'
  - 'site-react/package-lock.json'
  - '.github/workflows/test.yml'
```

This ensures every feature branch, bug fix, and PR gets tested before merging. It only re-runs for relevant changes (saves GitHub Actions minutes).

---

## Setting Up Branch Protection (Optional)

Require tests to pass before merging:

1. Go to your repo **Settings**
2. Click **Branches**
3. Add rule for `main` branch
4. Enable "Require status checks to pass before merging"
5. Select `test / Run Tests` as required
6. Select `test / Lint & Format Check` as required

Now PRs can't be merged if tests fail! 🛡️

---

## Coverage Reports

### Codecov Integration

The workflow automatically uploads coverage to Codecov.io. To enable:

1. Go to [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Enable your repository
4. Coverage badges and reports appear automatically

### View Coverage Locally

```bash
npm run test:coverage

# Open the HTML report
open coverage/index.html
```

---

## Troubleshooting

### Tests Fail in Pipeline But Pass Locally

**Possible causes:**
- Different Node version (use `node --version` locally, check workflow)
- Missing environment variables
- Race conditions in async tests

**Solutions:**
```bash
# Test with same Node version as CI
nvm use 20  # if using nvm

# Run tests multiple times
npm test -- --run --repeat 5

# Run with verbose output
npm test -- --reporter=verbose --run
```

### Workflow Doesn't Trigger

**Check:**
1. Branch name matches (main/develop)
2. Changes are in `/site-react/api/**` path
3. Workflow file syntax is correct

**Debug:**
- Go to Actions tab
- Look for "disabled" warnings
- Check workflow syntax at [github.com/actions/starter-workflows](https://github.com/actions/starter-workflows)

### Need to Skip a Commit

```bash
git commit --message "Minor docs update" --no-verify
# (Not recommended - tests should always pass!)
```

Better: Fix the tests instead

---

## Next Steps

### 1. Push This Configuration
```bash
git add .github/workflows/test.yml
git commit -m "Add automated test workflow"
git push
```

### 2. Verify It Works
- Go to Actions tab
- You should see the workflow running
- Wait for it to complete

### 3. Set Up Codecov (Optional)
```bash
# Deploy the coverage report
npm run test:coverage
# Commit coverage/index.html if desired
```

### 4. Configure Branch Protection (Optional)
See "Setting Up Branch Protection" section above

---

## Alternative: Simpler Single-Node Workflow

If you want a simpler setup (only one Node version):

Create `.github/workflows/test-simple.yml`:
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
      - run: cd site-react && npm ci
      - run: cd site-react && npm test -- --run
```

Then delete the complex `test.yml`.

---

## Monitoring & Alerts

### Get Notified of Failures

GitHub can send:
- **Email notifications** when tests fail
- **Slack integration** (via GitHub App)
- **Discord webhook** (via custom action)

Configure in repo Settings → Notifications

## Example Test Run Output

```
✓ api/__tests__/orderNotifications.test.js (15)
✓ api/__tests__/orders.test.js (13)
✓ api/__tests__/stripeProducts.test.js (19)
✓ api/__tests__/inventory.test.js (11)
✓ api/__tests__/prices.test.js (14)
✓ api/__tests__/availability.test.js (12)
✓ api/__tests__/checkout.test.js (18)
✓ api/__tests__/stripe-webhook.test.js (16)

Test Files  8 passed (8)
     Tests  118 passed (118)
```

---

## FAQ

**Q: Will this slow down my commits?**
A: No. Tests run in the cloud, parallel to your work.

**Q: What if I need to skip tests temporarily?**
A: Don't. Fix the tests instead. If urgent, use environment variable to skip specific tests (not recommended).

**Q: Can I test on more Node versions?**
A: Yes, add to `matrix.node-version` in the workflow.

**Q: How long do tests take?**
A: ~1-2 minutes per Node version (depends on test count).

**Q: Does this cost money?**
A: GitHub provides 2000 free Actions minutes per month. Tests typically use 30 minutes/month.

---

## Files Updated

- ✅ Created: `.github/workflows/test.yml` - Main test workflow
- ✅ Already configured: `site-react/package.json` - Has test scripts
- ✅ Already configured: `vitest.config.js` - Test configuration

No additional changes needed! You're ready to go. 🚀
