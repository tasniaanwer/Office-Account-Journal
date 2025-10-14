# Transaction Testing Scripts

## Prerequisites

Make sure you're logged in as the admin user:
- Email: admin@accounting.com
- Password: admin123

## Step 1: Get Authentication Token

First, you need to get a session by logging in through the browser or use these scripts with authentication.

## Step 2: Create Revenue & Equity Accounts (if not exists)

```bash
# Create Revenue Account
curl -X POST http://localhost:3003/api/accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "code": "4000",
    "name": "Service Revenue",
    "type": "revenue",
    "description": "Income from services provided"
  }'

# Create Equity Account
curl -X POST http://localhost:3003/api/accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "code": "3000",
    "name": "Owner Equity",
    "type": "equity",
    "description": "Owner''s equity in the business"
  }'

# Create Office Expense Account
curl -X POST http://localhost:3003/api/accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "code": "5000",
    "name": "Office Expenses",
    "type": "expense",
    "description": "General office operating expenses"
  }'
```

## Step 3: Sample Transactions

### Transaction 1: Cash Investment
```bash
curl -X POST http://localhost:3003/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "date": "2024-01-15",
    "description": "Initial cash investment by owner",
    "status": "draft",
    "lines": [
      {
        "accountId": "9oqiKU2f-BToB4ua5v_xE",
        "description": "Cash deposit",
        "debit": 10000,
        "credit": 0
      },
      {
        "accountId": "PASTE_EQUITY_ACCOUNT_ID_HERE",
        "description": "Owner equity contribution",
        "debit": 0,
        "credit": 10000
      }
    ]
  }'
```

### Transaction 2: Office Rent Expense
```bash
curl -X POST http://localhost:3003/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "date": "2024-01-16",
    "description": "Monthly office rent payment",
    "status": "draft",
    "lines": [
      {
        "accountId": "PASTE_OFFICE_EXPENSE_ACCOUNT_ID_HERE",
        "description": "Office rent - January",
        "debit": 2000,
        "credit": 0
      },
      {
        "accountId": "9oqiKU2f-BToB4ua5v_xE",
        "description": "Cash payment for rent",
        "debit": 0,
        "credit": 2000
      }
    ]
  }'
```

### Transaction 3: Client Service Revenue
```bash
curl -X POST http://localhost:3003/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "date": "2024-01-17",
    "description": "Website development services for Client A",
    "status": "draft",
    "lines": [
      {
        "accountId": "8Po-vRw5PFNp9R-R_FFVq",
        "description": "Accounts receivable - Client A",
        "debit": 5000,
        "credit": 0
      },
      {
        "accountId": "PASTE_REVENUE_ACCOUNT_ID_HERE",
        "description": "Service revenue - Client A project",
        "debit": 0,
        "credit": 5000
      }
    ]
  }'
```

### Transaction 4: Client Payment Received
```bash
curl -X POST http://localhost:3003/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "date": "2024-01-18",
    "description": "Payment received from Client A",
    "status": "draft",
    "lines": [
      {
        "accountId": "9oqiKU2f-BToB4ua5v_xE",
        "description": "Cash received from Client A",
        "debit": 3000,
        "credit": 0
      },
      {
        "accountId": "8Po-vRw5PFNp9R-R_FFVq",
        "description": "Partial payment received",
        "debit": 0,
        "credit": 3000
      }
    ]
  }'
```

## Step 4: Test Transaction Workflow

### Post a Transaction
```bash
curl -X PUT http://localhost:3003/api/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "status": "posted"
  }'
```

### Approve a Transaction (Admin/Accountant only)
```bash
curl -X PUT http://localhost:3003/api/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "status": "approved"
  }'
```

## Step 5: View All Transactions
```bash
curl -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  http://localhost:3003/api/transactions
```

## Debugging Tips

1. **Check for authentication errors** - Make sure you're logged in
2. **Verify account IDs** - Get the correct account IDs from `/api/accounts`
3. **Check balance** - Total debits must equal total credits
4. **Review server logs** - Look for detailed error messages
5. **Test with browser first** - Create a transaction through the UI first

## Common Issues

- **Authentication Required**: All API calls need authentication
- **Account Not Found**: Make sure the account ID exists and is active
- **Balance Error**: Total debits must equal total credits (within 0.01)
- **Invalid Date**: Use proper date format (YYYY-MM-DD)
- **Missing Fields**: All required fields must be present