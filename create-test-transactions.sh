#!/bin/bash

echo "=== Accounting Transaction Testing Script ==="
echo ""

# Get current accounts first
echo "1. Getting current accounts..."
ACCOUNTS=$(curl -s http://localhost:3003/api/accounts)
echo "Available accounts:"
echo "$ACCOUNTS" | jq '.[] | {code, name, type, id}'
echo ""

# Extract account IDs for use in transactions
CASH_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.code == "1000") | .id')
AR_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.code == "1200") | .id')
AP_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.code == "2000") | .id')

echo "Using Account IDs:"
echo "Cash ID: $CASH_ID"
echo "AR ID: $AR_ID"
echo "AP ID: $AP_ID"
echo ""

# Check if we have all necessary accounts
if [ -z "$CASH_ID" ] || [ -z "$AR_ID" ] || [ -z "$AP_ID" ]; then
    echo "❌ Missing required accounts. Creating them first..."

    # Create missing accounts
    if [ -z "$AP_ID" ]; then
        echo "Creating Accounts Payable account..."
        AP_RESPONSE=$(curl -s -X POST http://localhost:3003/api/accounts \
            -H "Content-Type: application/json" \
            -d '{
                "code": "2001",
                "name": "Operating Expenses",
                "type": "expense",
                "description": "Operating expenses for the business"
            }')
        AP_ID=$(echo "$AP_RESPONSE" | jq -r '.id')
        echo "✅ Created Operating Expenses account: $AP_ID"
    fi

    if [ -z "$AP_ID" ]; then
        echo "Creating Service Revenue account..."
        REV_RESPONSE=$(curl -s -X POST http://localhost:3003/api/accounts \
            -H "Content-Type: application/json" \
            -d '{
                "code": "4001",
                "name": "Service Revenue",
                "type": "revenue",
                "description": "Revenue from services provided"
            }')
        echo "✅ Created Service Revenue account"
    fi

    if [ -z "$AP_ID" ]; then
        echo "Creating Owner Equity account..."
        EQUITY_RESPONSE=$(curl -s -X POST http://localhost:3003/api/accounts \
            -H "Content-Type: application/json" \
            -d '{
                "code": "3001",
                "name": "Owner Equity",
                "type": "equity",
                "description": "Owner''s equity in the business"
            }')
        echo "✅ Created Owner Equity account"
    fi
fi

# Refresh accounts
ACCOUNTS=$(curl -s http://localhost:3003/api/accounts)
CASH_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.code == "1000") | .id')
AR_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.code == "1200") | .id')
AP_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.code == "2000") | .id')
REV_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.type == "revenue") | .id')
EXP_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.type == "expense") | .id')
EQUITY_ID=$(echo "$ACCOUNTS" | jq -r '.[] | select(.type == "equity") | .id')

echo ""
echo "📊 Account IDs for transactions:"
echo "Cash (1000): $CASH_ID"
echo "Accounts Receivable (1200): $AR_ID"
echo "Accounts Payable (2000): $AP_ID"
echo "Revenue Account: $REV_ID"
echo "Expense Account: $EXP_ID"
echo "Equity Account: $EQUITY_ID"
echo ""

echo "2. Creating test transactions..."

# Transaction 1: Initial Investment
echo "Creating Transaction 1: Initial Investment..."
INV_TX=$(curl -s -X POST http://localhost:3003/api/transactions \
    -H "Content-Type: application/json" \
    -d "{
        \"date\": \"2024-01-15\",
        \"description\": \"Initial cash investment by owner\",
        \"status\": \"draft\",
        \"lines\": [
            {
                \"accountId\": \"$CASH_ID\",
                \"description\": \"Cash deposit\",
                \"debit\": 5000,
                \"credit\": 0
            },
            {
                \"accountId\": \"$EQUITY_ID\",
                \"description\": \"Owner equity contribution\",
                \"debit\": 0,
                \"credit\": 5000
            }
        ]
    }")

INV_TX_ID=$(echo "$INV_TX" | jq -r '.id')
echo "✅ Created transaction: $INV_TX_ID"

# Transaction 2: Office Supplies Purchase
echo "Creating Transaction 2: Office Supplies Purchase..."
SUPPLY_TX=$(curl -s -X POST http://localhost:3003/api/transactions \
    -H "Content-Type: application/json" \
    -d "{
        \"date\": \"2024-01-16\",
        \"description\": \"Office supplies purchase\",
        \"status\": \"draft\",
        \"lines\": [
            {
                \"accountId\": \"$EXP_ID\",
                \"description\": \"Office supplies and materials\",
                \"debit\": 250,
                \"credit\": 0
            },
            {
                \"accountId\": \"$AP_ID\",
                \"description\": \"Office supplies on credit\",
                \"debit\": 0,
                \"credit\": 250
            }
        ]
    }")

SUPPLY_TX_ID=$(echo "$SUPPLY_TX" | jq -r '.id')
echo "✅ Created transaction: $SUPPLY_TX_ID"

# Transaction 3: Service Revenue
echo "Creating Transaction 3: Service Revenue..."
REVENUE_TX=$(curl -s -X POST http://localhost:3003/api/transactions \
    -H "Content-Type: application/json" \
    -d "{
        \"date\": \"2024-01-17\",
        \"description\": \"Consulting services provided\",
        \"status\": \"draft\",
        \"lines\": [
            {
                \"accountId\": \"$AR_ID\",
                \"description\": \"Accounts receivable - Consulting services\",
                \"debit\": 1500,
                \"credit\": 0
            },
            {
                \"accountId\": \"$REV_ID\",
                \"description\": \"Service revenue earned\",
                \"debit\": 0,
                \"credit\": 1500
            }
        ]
    }")

REVENUE_TX_ID=$(echo "$REVENUE_TX" | jq -r '.id')
echo "✅ Created transaction: $REVENUE_TX_ID"

# Transaction 4: Partial Payment Received
echo "Creating Transaction 4: Partial Payment Received..."
PAYMENT_TX=$(curl -s -X POST http://localhost:3003/api/transactions \
    -H "Content-Type: application/json" \
    -d "{
        \"date\": \"2024-01-18\",
        \"description\": \"Partial payment received from client\",
        \"status\": \"draft\",
        \"lines\": [
            {
                \"accountId\": \"$CASH_ID\",
                \"description\": \"Cash received - Partial payment\",
                \"debit\": 800,
                \"credit\": 0
            },
            {
                \"accountId\": \"$AR_ID\",
                \"description\": \"Payment applied to invoice\",
                \"debit\": 0,
                \"credit\": 800
            }
        ]
    }")

PAYMENT_TX_ID=$(echo "$PAYMENT_TX" | jq -r '.id')
echo "✅ Created transaction: $PAYMENT_TX_ID"

echo ""
echo "🎯 Summary of Transactions Created:"
echo "1. Initial Investment: $INV_TX_ID ($5,000)"
echo "2. Office Supplies: $SUPPLY_TX_ID ($250)"
echo "3. Service Revenue: $REVENUE_TX_ID ($1,500)"
echo "4. Partial Payment: $PAYMENT_TX_ID ($800)"
echo ""

echo "3. Checking transactions..."
curl -s http://localhost:3003/api/transactions | jq '.transactions[] | {id, reference, description, status, totalDebit, totalCredit}'

echo ""
echo "✅ Test transactions created successfully!"
echo "You can now:"
echo "- Visit http://localhost:3003/transactions to view them"
echo "- Update transaction status (draft → posted → approved)"
echo "- Test the double-entry validation"
echo "- Generate financial reports"