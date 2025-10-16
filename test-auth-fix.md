# Transaction Authorization Fix Verification

## Issues Fixed

### 1. Session Access Pattern & NextAuth Configuration
**Problem**: The original code used `getServerSession()` without passing the authOptions, and the session object structure wasn't matching expectations.

**Fix**:
- Created a separate auth configuration file (`src/lib/auth.ts`) with proper exports
- Updated all session calls to use `getServerSession(authOptions)`
- Proper session validation structure:
```typescript
// Before
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// After
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);
if (!session || !session.user || !session.user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Role-Based Authorization
**Problem**: Transaction creation endpoint didn't check user roles, allowing any authenticated user to create transactions.

**Fix**: Added proper role-based access control:
```typescript
// Added to POST /api/transactions
const userRole = session.user.role;
if (!['admin', 'accountant'].includes(userRole)) {
  console.error(`Unauthorized transaction creation attempt - user role: ${userRole}`);
  return NextResponse.json({
    error: 'Forbidden - Only admin and accountant roles can create transactions'
  }, { status: 403 });
}
```

### 3. Database Query Logic
**Problem**: Account validation query wasn't properly filtering by the provided account IDs.

**Fix**: Used `inArray` operator to properly validate account IDs:
```typescript
// Before
const existingAccounts = await db
  .select({ id: accounts.id, isActive: accounts.isActive })
  .from(accounts)
  .where(eq(accounts.isActive, true));

// After
const existingAccounts = await db
  .select({ id: accounts.id, isActive: accounts.isActive })
  .from(accounts)
  .where(and(
    inArray(accounts.id, accountIds),
    eq(accounts.isActive, true)
  ));
```

### 4. Better Error Handling
**Problem**: Generic error messages made debugging difficult.

**Fix**: Added detailed error logging and more specific error messages.

## Files Modified

1. `src/lib/auth.ts` (NEW FILE)
   - Extracted NextAuth configuration with proper exports
   - Centralized auth configuration for reuse across API routes

2. `src/app/api/auth/[...nextauth]/route.ts`
   - Updated to use the centralized auth configuration

3. `src/app/api/transactions/route.ts`
   - Fixed session calls to use `getServerSession(authOptions)`
   - Added role-based authorization for POST requests
   - Fixed account validation query using `inArray` operator
   - Improved error handling

4. `src/app/api/transactions/[id]/route.ts`
   - Fixed session calls for GET, PUT, DELETE operations
   - Consistent session validation across all endpoints

## Testing the Fixes

### Prerequisites
1. Make sure your application server is running
2. Log in as admin user:
   - Email: admin@accounting.com
   - Password: admin123

### Test Transaction Creation
Use your browser or curl to create a transaction:

```bash
# First, get your session token from browser developer tools
# Application -> Cookies -> next-auth.session-token

# Then create a transaction
curl -X POST http://localhost:3003/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "date": "2024-01-15",
    "description": "Test transaction after authorization fix",
    "status": "draft",
    "lines": [
      {
        "accountId": "9oqiKU2f-BToB4ua5v_xE",
        "description": "Test debit line",
        "debit": 100,
        "credit": 0
      },
      {
        "accountId": "PASTE_VALID_ACCOUNT_ID_HERE",
        "description": "Test credit line",
        "debit": 0,
        "credit": 100
      }
    ]
  }'
```

### Expected Results
- ✅ Admin users should be able to create transactions
- ✅ Accountant users should be able to create transactions
- ❌ Viewer users should get a 403 Forbidden error
- ❌ Unauthenticated users should get a 401 Unauthorized error

## Debugging

If you still encounter issues:

1. **Check the server console** - Look for the detailed error logs we added
2. **Verify your session** - Make sure you're properly logged in
3. **Check user role** - Verify your user has the correct role in the database
4. **Validate account IDs** - Make sure you're using valid, active account IDs

The fixes address the core authorization issue by ensuring:
- Proper session validation
- Role-based access control
- Correct database queries
- Better error reporting