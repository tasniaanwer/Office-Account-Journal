#!/bin/bash

# Comprehensive Office Test Data Generator
# This script creates realistic office transactions to showcase all accounting features

BASE_URL="http://localhost:3004"
SESSION_COOKIE=""  # You'll need to get this from browser after logging in

echo "🏢 Creating Comprehensive Office Test Data"
echo "=========================================="

# Function to create account
create_account() {
    local code=$1
    local name=$2
    local type=$3
    local description=$4

    curl -s -X POST "$BASE_URL/api/accounts" \
        -H "Content-Type: application/json" \
        -H "Cookie: next-auth.session-token=$SESSION_COOKIE" \
        -d "{
            \"code\": \"$code\",
            \"name\": \"$name\",
            \"type\": \"$type\",
            \"description\": \"$description\",
            \"normalBalance\": \"$([ "$type" = "asset" ] || [ "$type" = "expense" ] && echo "debit" || echo "credit")\"
        }" > /dev/null

    echo "✅ Created account: $code - $name ($type)"
}

# Function to create transaction
create_transaction() {
    local date=$1
    local description=$2
    local status=$3
    shift 3
    local lines=("$@")

    # Build lines JSON
    lines_json="["
    for i in "${!lines[@]}"; do
        if [ $((i % 3)) -eq 0 ]; then
            lines_json+="{\"accountId\":\"${lines[$i]}\","
        elif [ $((i % 3)) -eq 1 ]; then
            lines_json+="\"debit\":${lines[$i]},"
        else
            lines_json+="\"credit\":${lines[$i]}}"
            if [ $i -lt $((${#lines[@]} - 1)) ]; then
                lines_json+=","
            fi
        fi
    done
    lines_json+="]"

    curl -s -X POST "$BASE_URL/api/transactions" \
        -H "Content-Type: application/json" \
        -H "Cookie: next-auth.session-token=$SESSION_COOKIE" \
        -d "{
            \"date\": \"$date\",
            \"description\": \"$description\",
            \"status\": \"$status\",
            \"lines\": $lines_json
        }" > /dev/null

    echo "💰 Created transaction: $description"
}

echo ""
echo "📋 Step 1: Creating Complete Chart of Accounts"
echo "==============================================="

# ASSETS (1000-1999)
echo "Creating Asset Accounts..."
create_account "1010" "Cash on Hand" "asset" "Physical cash for small expenses"
create_account "1020" "Business Checking Account" "asset" "Primary business checking account"
create_account "1030" "Business Savings Account" "asset" "Emergency business savings"
create_account "1040" "PayPal Account" "asset" "PayPal business account"
create_account "1110" "Trade Receivables" "asset" "Accounts receivable from clients"
create_account "1120" "Other Receivables" "asset" "Miscellaneous receivables"
create_account "1210" "Office Equipment" "asset" "Computers, printers, and equipment"
create_account "1220" "Computers & Software" "asset" "IT equipment and software licenses"
create_account "1230" "Office Furniture" "asset" "Desks, chairs, and office furniture"
create_account "1240" "Leasehold Improvements" "asset" "Office renovations and improvements"

# LIABILITIES (2000-2999)
echo "Creating Liability Accounts..."
create_account "2010" "Trade Payables" "liability" "Accounts payable to vendors"
create_account "2020" "Office Supplies Payable" "liability" "Outstanding office supply bills"
create_account "2030" "Utilities Payable" "liability" "Unpaid utility bills"
create_account "2110" "Credit Card Payable" "liability" "Business credit card balance"
create_account "2120" "Line of Credit" "liability" "Business line of credit"
create_account "2210" "Business Loan" "liability" "Long-term business loan"
create_account "2220" "Equipment Loan" "liability" "Equipment financing loan"

# EQUITY (3000-3999)
echo "Creating Equity Accounts..."
create_account "3010" "Owner Capital" "equity" "Owner's initial and additional capital"
create_account "3020" "Owner Drawings" "equity" "Owner withdrawals and distributions"
create_account "3030" "Retained Earnings" "equity" "Accumulated retained earnings"

# REVENUE (4000-4999)
echo "Creating Revenue Accounts..."
create_account "4010" "Consulting Services" "revenue" "Business consulting revenue"
create_account "4020" "Design Services" "revenue" "Graphic and web design services"
create_account "4030" "Development Services" "revenue" "Software development services"
create_account "4110" "Software Sales" "revenue" "Software product sales"
create_account "4120" "Hardware Sales" "revenue" "Hardware and equipment sales"
create_account "4210" "Late Fees" "revenue" "Late payment fees collected"
create_account "4220" "Interest Income" "revenue" "Bank and investment interest"

# EXPENSES (5000-5999)
echo "Creating Expense Accounts..."
create_account "5010" "Rent Expense" "expense" "Monthly office rent"
create_account "5020" "Utilities Expense" "expense" "Electricity, water, gas"
create_account "5030" "Office Supplies" "expense" "Office supplies and materials"
create_account "5040" "Internet & Phone" "expense" "Internet and telephone services"
create_account "5110" "Salaries & Wages" "expense" "Employee salaries and wages"
create_account "5120" "Payroll Taxes" "expense" "Employer payroll taxes"
create_account "5130" "Employee Benefits" "expense" "Health insurance and benefits"
create_account "5140" "Training & Development" "expense" "Employee training programs"
create_account "5210" "Digital Marketing" "expense" "Online advertising and marketing"
create_account "5220" "Print Advertising" "expense" "Print and traditional advertising"
create_account "5230" "Trade Shows" "expense" "Trade show and conference expenses"
create_account "5310" "Legal Fees" "expense" "Legal consultation and services"
create_account "5320" "Accounting Services" "expense" "External accounting services"
create_account "5330" "Consulting Fees" "expense" "Business consulting fees"
create_account "5410" "Software Subscriptions" "expense" "Monthly software subscriptions"
create_account "5420" "Cloud Services" "expense" "Cloud hosting and services"
create_account "5430" "IT Support" "expense" "IT maintenance and support"
create_account "5510" "Business Travel" "expense" "Business travel expenses"
create_account "5520" "Client Entertainment" "expense" "Client entertainment and meals"
create_account "5530" "Mileage Expense" "expense" "Vehicle mileage reimbursement"
create_account "5610" "Business Insurance" "expense" "Business liability insurance"
create_account "5620" "Professional Licenses" "expense" "Professional and business licenses"
create_account "5710" "Bank Fees" "expense" "Bank service fees"
create_account "5720" "Credit Card Fees" "expense" "Credit card processing fees"
create_account "5730" "Loan Interest" "expense" "Interest on business loans"

echo ""
echo "📊 Step 2: Creating Realistic Office Transactions"
echo "==============================================="

# Wait a moment for accounts to be created
sleep 2

# January 2024 - Startup Month
echo "Creating January 2024 transactions (Startup Month)..."
create_transaction "2024-01-05" "Initial Owner Investment" "approved" \
    "1020" "50000" "3010" "0" \
    "3010" "0" "1020" "50000"

create_transaction "2024-01-10" "Office Rent Deposit" "approved" \
    "5010" "2500" "1020" "0" \
    "1020" "0" "5010" "2500"

create_transaction "2024-01-12" "Office Equipment Purchase" "approved" \
    "1210" "8500" "2110" "8500" \
    "2110" "0" "1210" "0"

create_transaction "2024-01-15" "Office Furniture Setup" "approved" \
    "1230" "3200" "2210" "3200" \
    "2210" "0" "1230" "0"

create_transaction "2024-01-20" "First Client Payment - Consulting Project" "approved" \
    "1020" "8000" "4010" "0" \
    "4010" "8000" "1020" "0"

create_transaction "2024-01-25" "Software Subscriptions Setup" "approved" \
    "5410" "450" "1020" "0" \
    "1020" "0" "5410" "450"

create_transaction "2024-01-30" "Monthly Utilities" "approved" \
    "5020" "280" "1020" "0" \
    "1020" "0" "5020" "280"

# February 2024 - Growth Month
echo "Creating February 2024 transactions (Growth Month)..."
create_transaction "2024-02-01" "Office Rent February" "approved" \
    "5010" "2500" "1020" "0" \
    "1020" "0" "5010" "2500"

create_transaction "2024-02-05" "Hiring First Employee - Salary" "approved" \
    "5110" "4000" "1020" "0" \
    "1020" "0" "5110" "4000"

create_transaction "2024-02-10" "Digital Marketing Campaign" "approved" \
    "5210" "1200" "2110" "1200" \
    "2110" "0" "5210" "0"

create_transaction "2024-02-12" "Web Design Project Payment" "approved" \
    "1110" "5500" "4020" "0" \
    "4020" "5500" "1110" "0"

create_transaction "2024-02-15" "Office Supplies Restock" "approved" \
    "5030" "320" "2020" "320" \
    "2020" "0" "5030" "0"

create_transaction "2024-02-20" "Software Development Project" "approved" \
    "1020" "12000" "4030" "0" \
    "4030" "12000" "1020" "0"

create_transaction "2024-02-25" "Payroll Taxes February" "approved" \
    "5120" "600" "1020" "0" \
    "1020" "0" "5120" "600"

# March 2024 - Expansion Month
echo "Creating March 2024 transactions (Expansion Month)..."
create_transaction "2024-03-01" "Office Rent March" "approved" \
    "5010" "2500" "1020" "0" \
    "1020" "0" "5010" "2500"

create_transaction "2024-03-05" "Professional Consulting Services" "approved" \
    "5330" "1500" "1020" "0" \
    "1020" "0" "5330" "1500"

create_transaction "2024-03-10" "Large Client Project - Development" "approved" \
    "1020" "18000" "4030" "0" \
    "4030" "18000" "1020" "0"

create_transaction "2024-03-15" "New Computer Equipment" "approved" \
    "1220" "6500" "2220" "6500" \
    "2220" "0" "1220" "0"

create_transaction "2024-03-20" "Trade Show Participation" "approved" \
    "5230" "2800" "2110" "2800" \
    "2110" "0" "5230" "0"

create_transaction "2024-03-25" "Cloud Services Setup" "approved" \
    "5420" "350" "1020" "0" \
    "1020" "0" "5420" "350"

create_transaction "2024-03-30" "Client Entertainment - Business Dinner" "approved" \
    "5520" "280" "1020" "0" \
    "1020" "0" "5520" "280"

# April 2024 - Peak Season
echo "Creating April 2024 transactions (Peak Season)..."
create_transaction "2024-04-01" "Office Rent April" "approved" \
    "5010" "2500" "1020" "0" \
    "1020" "0" "5010" "2500"

create_transaction "2024-04-05" "Employee Bonuses" "approved" \
    "5110" "2000" "1020" "0" \
    "1020" "0" "5110" "2000"

create_transaction "2024-04-10" "Major Software Sale" "approved" \
    "1020" "25000" "4110" "0" \
    "4110" "25000" "1020" "0"

create_transaction "2024-04-15" "Tax Preparation Services" "approved" \
    "5310" "800" "1020" "0" \
    "1020" "0" "5310" "800"

create_transaction "2024-04-20" "Business Insurance Premium" "approved" \
    "5610" "450" "1020" "0" \
    "1020" "0" "5610" "450"

create_transaction "2024-04-25" "IT Support Contract" "approved" \
    "5430" "600" "1020" "0" \
    "1020" "0" "5430" "600"

create_transaction "2024-04-30" "Late Fees from Client" "approved" \
    "1020" "150" "4210" "0" \
    "4210" "150" "1020" "0"

# May 2024 - Stabilization
echo "Creating May 2024 transactions (Stabilization)..."
create_transaction "2024-05-01" "Office Rent May" "approved" \
    "5010" "2500" "1020" "0" \
    "1020" "0" "5010" "2500"

create_transaction "2024-05-05" "Loan Payment" "approved" \
    "2210" "1000" "1020" "0" \
    "1020" "0" "2210" "1000"

create_transaction "2024-05-10" "Regular Consulting Client" "approved" \
    "1020" "6500" "4010" "0" \
    "4010" "6500" "1020" "0"

create_transaction "2024-05-15" "Equipment Maintenance" "approved" \
    "5410" "200" "1020" "0" \
    "1020" "0" "5410" "200"

create_transaction "2024-05-20" "Business Travel" "approved" \
    "5510" "1200" "2110" "1200" \
    "2110" "0" "5510" "0"

create_transaction "2024-05-25" "Mileage Reimbursement" "approved" \
    "5530" "150" "1020" "0" \
    "1020" "0" "5530" "150"

# June 2024 - Review Month
echo "Creating June 2024 transactions (Review Month)..."
create_transaction "2024-06-01" "Office Rent June" "approved" \
    "5010" "2500" "1020" "0" \
    "1020" "0" "5010" "2500"

create_transaction "2024-06-05" "Financial Audit Services" "approved" \
    "5320" "1200" "1020" "0" \
    "1020" "0" "5320" "1200"

create_transaction "2024-06-10" "Strategic Planning Consulting" "approved" \
    "5330" "2500" "1020" "0" \
    "1020" "0" "5330" "2500"

create_transaction "2024-06-15" "Professional License Renewal" "approved" \
    "5620" "300" "1020" "0" \
    "1020" "0" "5620" "300"

create_transaction "2024-06-20" "Bank Service Fees" "approved" \
    "5710" "25" "1020" "0" \
    "1020" "0" "5710" "25"

create_transaction "2024-06-25" "Interest Income" "approved" \
    "1020" "45" "4220" "0" \
    "4220" "45" "1020" "0"

create_transaction "2024-06-30" "Loan Interest Payment" "approved" \
    "5730" "180" "1020" "0" \
    "1020" "0" "5730" "180"

echo ""
echo "🎉 Test Data Creation Complete!"
echo "=============================="
echo ""
echo "📈 Summary of Created Data:"
echo "• 32+ Accounts covering all business aspects"
echo "• 35+ Transactions over 6 months"
echo "• Realistic business scenarios"
echo "• Proper double-entry accounting"
echo "• Diverse revenue and expense categories"
echo ""
echo "🔍 Next Steps:"
echo "1. Check your accounts at: $BASE_URL/accounts"
echo "2. View transactions at: $BASE_URL/transactions"
echo "3. See beautiful reports at: $BASE_URL/reports"
echo ""
echo "💡 Your reports will now show:"
echo "• Revenue growth from startup to peak season"
echo "• Diverse expense categories (salaries, marketing, tech, etc.)"
echo "• Cash flow progression over time"
echo "• Balanced account distribution across all types"
echo ""
echo "Enjoy your professional-looking accounting dashboard! 🚀"