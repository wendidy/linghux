# 🚀 Quick Reference: GitHub Actions Test Pipeline

## What's New

Your repository now automatically runs tests on every commit! Here's what changed:

### Files Created/Modified
- ✅ **`.github/workflows/test.yml`** - Automated test workflow
- ✅ **`.gitignore`** - Added coverage directories
- 📖 **`GITHUB_ACTIONS_SETUP.md`** - Full setup documentation

---

## 3-Minute Setup

### Step 1: Commit the Workflow
```bash
git add .github/workflows/test.yml .gitignore
git commit -m "Add automated test workflow"
git push origin main
```

### Step 2: View Results
1. Go to your GitHub repository
2. Click the **Actions** tab
3. Find your commit in the list
4. Click to see test results

### Step 3: That's It! ✅
Your tests now run automatically on every commit.

---

## How It Works

Every time you push code or create a PR:

```
1. Your commit arrives
   ↓
2. GitHub detects changes to /site-react/api/
   ↓
3. Workflow triggers automatically
   ↓
4. Tests run on Node 18 and 20
   ↓
5. Results posted in Actions tab
   ↓
6. (Optional) Comments posted on PR
```

---

## Test Before You Push (Recommended)

```bash
cd site-react

# Run tests locally
npm test -- --run

# If ✅ all pass → push
git push

# If ❌ some fail → fix them → test again → push
```

---

## View Test Results

### In GitHub (After Push)
1. Click **Actions** tab
2. Find workflow run
3. Click to see details
4. Drill into specific test failures

### On Your Machine
```bash
cd site-react

# Run tests
npm test

# Watch mode (re-runs on file changes)
npm test -- --watch

# Coverage report
npm run test:coverage
open coverage/index.html
```

---

## What Tests Are Running

Your workflow tests:

| Service | Tests |
|---------|-------|
| Resend (Email) | `orderNotifications.test.js` |
| Orders Database | `orders.test.js` |
| Stripe Products | `stripeProducts.test.js` |
| Inventory | `inventory.test.js` |
| Prices API | `prices.test.js` |
| Availability API | `availability.test.js` |
| Checkout API | `checkout.test.js` |
| Stripe Webhooks | `stripe-webhook.test.js` |

**Total: 100+ tests** ✓

---

## Workflow Details

### When It Triggers
- ✅ Push to `main` or `develop` branches
- ✅ Pull requests to `main` or `develop`
- ✅ Changes to API code or dependencies
- ✅ Manual trigger via Actions tab

### What It Does
- ✅ Tests on Node 18.x and Node 20.x
- ✅ Installs dependencies
- ✅ Runs all tests
- ✅ Generates coverage report
- ✅ (Optional) Uploads to Codecov
- ✅ (Optional) Comments on PR

### How Long
- **~2-3 minutes** per workflow run
- Runs in parallel with your work

---

## Enable Branch Protection (Optional)

Prevent merging if tests fail:

1. **Settings** → **Branches**
2. **Add rule** for `main` branch
3. Check **Require status checks to pass**
4. Select `test / Run Tests`
5. Check **Dismiss stale PR approvals** (optional)

Now tests must pass before merging! 🛡️

---

## Common Tasks

### Run Tests Only (No Coverage)
```bash
npm test -- --run
```

### Run Specific Test File
```bash
npm test -- api/__tests__/orderNotifications.test.js --run
```

### Run Tests Matching a Pattern
```bash
npm test -- --grep "should send" --run
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Interactive Test UI (Local Only)
```bash
npm run test:ui
# Opens http://localhost:51204
```

---

## If Tests Fail

### Find the Error
1. Check GitHub Actions tab
2. Click on failed workflow
3. Scroll to see error message
4. Note which test and why it failed

### Fix and Retry
```bash
# Fix the issue in your code

# Test locally
cd site-react
npm test -- --run

# If passing, push again
git push
```

### Force Skip (Not Recommended)
```bash
# Emergency push (skips checks)
git push --no-verify
# ⚠️ Only for emergencies - fix tests when possible!
```

---

## Workflow Triggers

The workflow triggers when these files change:
- `site-react/api/**` (any API file)
- `site-react/package.json`
- `site-react/package-lock.json`
- `.github/workflows/test.yml`

Changes to other files won't trigger tests (saves time/cost).

---

## Pricing

GitHub includes **2000 free Actions minutes/month**

Your tests use ~30 minutes/month (plenty of room).

---

## Next Steps

### ✅ Immediate
1. Push the workflow file
2. Check Actions tab for results
3. Test locally before each push

### 📈 Soon
1. Configure Codecov for coverage reports
2. Enable branch protection rules
3. Set up Slack notifications (optional)

### 📚 Reference
- Full guide: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)
- Test docs: [site-react/api/__tests__/README.md](site-react/api/__tests__/README.md)
- Quick start: [site-react/api/__tests__/QUICK_START.md](site-react/api/__tests__/QUICK_START.md)

---

## Need Help?

### Test failures after push?
→ See [GITHUB_ACTIONS_SETUP.md - Troubleshooting](GITHUB_ACTIONS_SETUP.md#troubleshooting)

### Want different Node versions?
→ Edit `.github/workflows/test.yml` line 35

### Need simpler setup?
→ See [GITHUB_ACTIONS_SETUP.md - Simpler Workflow](GITHUB_ACTIONS_SETUP.md#alternative-simpler-single-node-workflow)

### Questions?
→ Check [site-react/api/__tests__/QUICK_START.md](site-react/api/__tests__/QUICK_START.md)

---

**You're all set!** 🎉 Your tests now run automatically on every commit.
