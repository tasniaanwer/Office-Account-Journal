# Comprehensive Office Test Data

This package contains everything you need to populate your accounting system with realistic office transactions that will showcase your reporting capabilities.

## 📋 What's Included

### Chart of Accounts (32+ Accounts)
**Assets (1000-1999):**
- Cash & Bank Accounts (Checking, Savings, PayPal)
- Accounts Receivable (Trade, Other)
- Fixed Assets (Equipment, Furniture, Computers)

**Liabilities (2000-2999):**
- Accounts Payable (Trade, Supplies, Utilities)
- Short-term Debt (Credit Cards, Line of Credit)
- Long-term Liabilities (Business Loans, Equipment Loans)

**Equity (3000-3999):**
- Owner's Equity (Capital, Drawings, Retained Earnings)

**Revenue (4000-4999):**
- Service Revenue (Consulting, Design, Development)
- Product Sales (Software, Hardware)
- Other Revenue (Late Fees, Interest Income)

**Expenses (5000-5999):**
- Office Expenses (Rent, Utilities, Supplies)
- Employee Expenses (Salaries, Taxes, Benefits)
- Marketing & Advertising (Digital, Print, Trade Shows)
- Professional Services (Legal, Accounting, Consulting)
- Technology Expenses (Software, Cloud, IT Support)
- Travel & Entertainment (Business Travel, Client Meals)
- Insurance & Compliance (Business Insurance, Licenses)
- Financial Expenses (Bank Fees, Credit Card Fees, Loan Interest)

### Realistic Transactions (35+ over 6 months)
- **January 2024**: Startup month with initial investment and setup costs
- **February 2024**: Growth month with first employees and marketing
- **March 2024**: Expansion month with large projects and equipment
- **April 2024**: Peak season with maximum revenue and bonuses
- **May 2024**: Stabilization with consistent operations
- **June 2024**: Review month with audit and compliance costs

## 🚀 How to Use

### Option 1: Easy Windows Batch File
1. Double-click `RUN-TEST-DATA.bat`
2. Follow the on-screen instructions
3. View your beautiful reports!

### Option 2: Node.js Script
1. **Get your session token:**
   - Log in to http://localhost:3004
   - Open F12 Developer Tools
   - Go to Application > Cookies
   - Copy the `next-auth.session-token` value

2. **Edit the script:**
   - Open `populate-test-data.js`
   - Replace the empty `SESSION_COOKIE` value with your token

3. **Run the script:**
   ```bash
   node populate-test-data.js
   ```

### Option 3: Manual Shell Script
1. Edit `create-comprehensive-test-data.sh`
2. Add your session token
3. Run with bash or Git Bash

## 📊 Expected Results

After running the test data, your reports will show:

### 📈 Revenue vs Expenses Chart
- Starting with small revenue in January
- Growth through February-March
- Peak in April ($25k+ software sale)
- Stabilization in May-June

### 🥧 Account Balance Pie Chart
- Diverse mix of assets, liabilities, equity
- Realistic business financial structure
- Color-coded by account type

### 💰 Cash Flow Analysis
- Initial negative cash flow (startup costs)
- Break-even around March
- Positive cash flow in peak season
- Stabilized cash flow in later months

### 📊 Top Expense Categories
- Salaries & Wages (largest expense)
- Rent (consistent monthly expense)
- Marketing & Advertising (growth investment)
- Technology & Software (modern business expenses)
- Professional Services (consulting, legal, accounting)

## 🎯 Business Story Told by Data

1. **January**: New business with $50k investment, office setup costs
2. **February**: First employee hired, marketing campaigns begin
3. **March**: Large client projects, new equipment purchases
4. **April**: Peak performance with major software sale, employee bonuses
5. **May**: Stable operations, loan payments begin
6. **June**: Professional review, audit, compliance costs

## 🔧 Troubleshooting

### "Session Cookie Required" Error
- Make sure you're logged in to the application
- Check that your session token is current
- Copy the exact token value from browser cookies

### "Server Not Running" Error
- Start your development server: `npm run dev`
- Ensure it's running on port 3004
- Wait for the server to fully start

### "Account Already Exists" Messages
- This is normal! The script will continue
- Existing accounts won't be overwritten
- New transactions will still be created

## 🎉 Enjoy Your Professional Dashboard!

Once the data is loaded, navigate to:
- **Accounts**: http://localhost:3004/accounts
- **Transactions**: http://localhost:3004/transactions
- **Reports**: http://localhost:3004/reports

Your reports dashboard will now display beautiful, professional charts showing a complete business story with diverse financial data!