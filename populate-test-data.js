// Comprehensive Office Test Data Generator
// Node.js script to populate your accounting system with realistic data

const fs = require('fs');
const https = require('https');

const BASE_URL = 'http://localhost:3004';
const SESSION_COOKIE = ''; // You'll need to get this from browser after logging in

// Helper function to make HTTP requests
function makeRequest(method, url, data = null, sessionId = '') {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 3004,
            path: url,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionId ? `next-auth.session-token=${sessionId}` : ''
            }
        };

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Complete Chart of Accounts
const chartOfAccounts = [
    // ASSETS (1000-1999)
    { code: "1010", name: "Cash on Hand", type: "asset", description: "Physical cash for small expenses" },
    { code: "1020", name: "Business Checking Account", type: "asset", description: "Primary business checking account" },
    { code: "1030", name: "Business Savings Account", type: "asset", description: "Emergency business savings" },
    { code: "1040", name: "PayPal Account", type: "asset", description: "PayPal business account" },
    { code: "1110", name: "Trade Receivables", type: "asset", description: "Accounts receivable from clients" },
    { code: "1120", name: "Other Receivables", type: "asset", description: "Miscellaneous receivables" },
    { code: "1210", name: "Office Equipment", type: "asset", description: "Computers, printers, and equipment" },
    { code: "1220", name: "Computers & Software", type: "asset", description: "IT equipment and software licenses" },
    { code: "1230", name: "Office Furniture", type: "asset", description: "Desks, chairs, and office furniture" },
    { code: "1240", name: "Leasehold Improvements", type: "asset", description: "Office renovations and improvements" },

    // LIABILITIES (2000-2999)
    { code: "2010", name: "Trade Payables", type: "liability", description: "Accounts payable to vendors" },
    { code: "2020", name: "Office Supplies Payable", type: "liability", description: "Outstanding office supply bills" },
    { code: "2030", name: "Utilities Payable", type: "liability", description: "Unpaid utility bills" },
    { code: "2110", name: "Credit Card Payable", type: "liability", description: "Business credit card balance" },
    { code: "2120", name: "Line of Credit", type: "liability", description: "Business line of credit" },
    { code: "2210", name: "Business Loan", type: "liability", description: "Long-term business loan" },
    { code: "2220", name: "Equipment Loan", type: "liability", description: "Equipment financing loan" },

    // EQUITY (3000-3999)
    { code: "3010", name: "Owner Capital", type: "equity", description: "Owner's initial and additional capital" },
    { code: "3020", name: "Owner Drawings", type: "equity", description: "Owner withdrawals and distributions" },
    { code: "3030", name: "Retained Earnings", type: "equity", description: "Accumulated retained earnings" },

    // REVENUE (4000-4999)
    { code: "4010", name: "Consulting Services", type: "revenue", description: "Business consulting revenue" },
    { code: "4020", name: "Design Services", type: "revenue", description: "Graphic and web design services" },
    { code: "4030", name: "Development Services", type: "revenue", description: "Software development services" },
    { code: "4110", name: "Software Sales", type: "revenue", description: "Software product sales" },
    { code: "4120", name: "Hardware Sales", type: "revenue", description: "Hardware and equipment sales" },
    { code: "4210", name: "Late Fees", type: "revenue", description: "Late payment fees collected" },
    { code: "4220", name: "Interest Income", type: "revenue", description: "Bank and investment interest" },

    // EXPENSES (5000-5999)
    { code: "5010", name: "Rent Expense", type: "expense", description: "Monthly office rent" },
    { code: "5020", name: "Utilities Expense", type: "expense", description: "Electricity, water, gas" },
    { code: "5030", name: "Office Supplies", type: "expense", description: "Office supplies and materials" },
    { code: "5040", name: "Internet & Phone", type: "expense", description: "Internet and telephone services" },
    { code: "5110", name: "Salaries & Wages", type: "expense", description: "Employee salaries and wages" },
    { code: "5120", name: "Payroll Taxes", type: "expense", description: "Employer payroll taxes" },
    { code: "5130", name: "Employee Benefits", type: "expense", description: "Health insurance and benefits" },
    { code: "5140", name: "Training & Development", type: "expense", description: "Employee training programs" },
    { code: "5210", name: "Digital Marketing", type: "expense", description: "Online advertising and marketing" },
    { code: "5220", name: "Print Advertising", type: "expense", description: "Print and traditional advertising" },
    { code: "5230", name: "Trade Shows", type: "expense", description: "Trade show and conference expenses" },
    { code: "5310", name: "Legal Fees", type: "expense", description: "Legal consultation and services" },
    { code: "5320", name: "Accounting Services", type: "expense", description: "External accounting services" },
    { code: "5330", name: "Consulting Fees", type: "expense", description: "Business consulting fees" },
    { code: "5410", name: "Software Subscriptions", type: "expense", description: "Monthly software subscriptions" },
    { code: "5420", name: "Cloud Services", type: "expense", description: "Cloud hosting and services" },
    { code: "5430", name: "IT Support", type: "expense", description: "IT maintenance and support" },
    { code: "5510", name: "Business Travel", type: "expense", description: "Business travel expenses" },
    { code: "5520", name: "Client Entertainment", type: "expense", description: "Client entertainment and meals" },
    { code: "5530", name: "Mileage Expense", type: "expense", description: "Vehicle mileage reimbursement" },
    { code: "5610", name: "Business Insurance", type: "expense", description: "Business liability insurance" },
    { code: "5620", name: "Professional Licenses", type: "expense", description: "Professional and business licenses" },
    { code: "5710", name: "Bank Fees", type: "expense", description: "Bank service fees" },
    { code: "5720", name: "Credit Card Fees", type: "expense", description: "Credit card processing fees" },
    { code: "5730", name: "Loan Interest", type: "expense", description: "Interest on business loans" }
];

// Comprehensive transaction scenarios
const transactions = [
    // January 2024 - Startup Month
    {
        date: "2024-01-05",
        description: "Initial Owner Investment",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 50000, credit: 0 },
            { accountId: "3010", debit: 0, credit: 50000 }
        ]
    },
    {
        date: "2024-01-10",
        description: "Office Rent Deposit",
        status: "approved",
        lines: [
            { accountId: "5010", debit: 2500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2500 }
        ]
    },
    {
        date: "2024-01-12",
        description: "Office Equipment Purchase",
        status: "approved",
        lines: [
            { accountId: "1210", debit: 8500, credit: 0 },
            { accountId: "2110", debit: 0, credit: 8500 }
        ]
    },
    {
        date: "2024-01-15",
        description: "Office Furniture Setup",
        status: "approved",
        lines: [
            { accountId: "1230", debit: 3200, credit: 0 },
            { accountId: "2210", debit: 0, credit: 3200 }
        ]
    },
    {
        date: "2024-01-20",
        description: "First Client Payment - Consulting Project",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 8000, credit: 0 },
            { accountId: "4010", debit: 0, credit: 8000 }
        ]
    },
    {
        date: "2024-01-25",
        description: "Software Subscriptions Setup",
        status: "approved",
        lines: [
            { accountId: "5410", debit: 450, credit: 0 },
            { accountId: "1020", debit: 0, credit: 450 }
        ]
    },
    {
        date: "2024-01-30",
        description: "Monthly Utilities",
        status: "approved",
        lines: [
            { accountId: "5020", debit: 280, credit: 0 },
            { accountId: "1020", debit: 0, credit: 280 }
        ]
    },

    // February 2024 - Growth Month
    {
        date: "2024-02-01",
        description: "Office Rent February",
        status: "approved",
        lines: [
            { accountId: "5010", debit: 2500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2500 }
        ]
    },
    {
        date: "2024-02-05",
        description: "Hiring First Employee - Salary",
        status: "approved",
        lines: [
            { accountId: "5110", debit: 4000, credit: 0 },
            { accountId: "1020", debit: 0, credit: 4000 }
        ]
    },
    {
        date: "2024-02-10",
        description: "Digital Marketing Campaign",
        status: "approved",
        lines: [
            { accountId: "5210", debit: 1200, credit: 0 },
            { accountId: "2110", debit: 0, credit: 1200 }
        ]
    },
    {
        date: "2024-02-12",
        description: "Web Design Project Payment",
        status: "approved",
        lines: [
            { accountId: "1110", debit: 5500, credit: 0 },
            { accountId: "4020", debit: 0, credit: 5500 }
        ]
    },
    {
        date: "2024-02-15",
        description: "Office Supplies Restock",
        status: "approved",
        lines: [
            { accountId: "5030", debit: 320, credit: 0 },
            { accountId: "2020", debit: 0, credit: 320 }
        ]
    },
    {
        date: "2024-02-20",
        description: "Software Development Project",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 12000, credit: 0 },
            { accountId: "4030", debit: 0, credit: 12000 }
        ]
    },
    {
        date: "2024-02-25",
        description: "Payroll Taxes February",
        status: "approved",
        lines: [
            { accountId: "5120", debit: 600, credit: 0 },
            { accountId: "1020", debit: 0, credit: 600 }
        ]
    },

    // March 2024 - Expansion Month
    {
        date: "2024-03-01",
        description: "Office Rent March",
        status: "approved",
        lines: [
            { accountId: "5010", debit: 2500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2500 }
        ]
    },
    {
        date: "2024-03-05",
        description: "Professional Consulting Services",
        status: "approved",
        lines: [
            { accountId: "5330", debit: 1500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 1500 }
        ]
    },
    {
        date: "2024-03-10",
        description: "Large Client Project - Development",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 18000, credit: 0 },
            { accountId: "4030", debit: 0, credit: 18000 }
        ]
    },
    {
        date: "2024-03-15",
        description: "New Computer Equipment",
        status: "approved",
        lines: [
            { accountId: "1220", debit: 6500, credit: 0 },
            { accountId: "2220", debit: 0, credit: 6500 }
        ]
    },
    {
        date: "2024-03-20",
        description: "Trade Show Participation",
        status: "approved",
        lines: [
            { accountId: "5230", debit: 2800, credit: 0 },
            { accountId: "2110", debit: 0, credit: 2800 }
        ]
    },
    {
        date: "2024-03-25",
        description: "Cloud Services Setup",
        status: "approved",
        lines: [
            { accountId: "5420", debit: 350, credit: 0 },
            { accountId: "1020", debit: 0, credit: 350 }
        ]
    },
    {
        date: "2024-03-30",
        description: "Client Entertainment - Business Dinner",
        status: "approved",
        lines: [
            { accountId: "5520", debit: 280, credit: 0 },
            { accountId: "1020", debit: 0, credit: 280 }
        ]
    },

    // April 2024 - Peak Season
    {
        date: "2024-04-01",
        description: "Office Rent April",
        status: "approved",
        lines: [
            { accountId: "5010", debit: 2500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2500 }
        ]
    },
    {
        date: "2024-04-05",
        description: "Employee Bonuses",
        status: "approved",
        lines: [
            { accountId: "5110", debit: 2000, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2000 }
        ]
    },
    {
        date: "2024-04-10",
        description: "Major Software Sale",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 25000, credit: 0 },
            { accountId: "4110", debit: 0, credit: 25000 }
        ]
    },
    {
        date: "2024-04-15",
        description: "Tax Preparation Services",
        status: "approved",
        lines: [
            { accountId: "5310", debit: 800, credit: 0 },
            { accountId: "1020", debit: 0, credit: 800 }
        ]
    },
    {
        date: "2024-04-20",
        description: "Business Insurance Premium",
        status: "approved",
        lines: [
            { accountId: "5610", debit: 450, credit: 0 },
            { accountId: "1020", debit: 0, credit: 450 }
        ]
    },
    {
        date: "2024-04-25",
        description: "IT Support Contract",
        status: "approved",
        lines: [
            { accountId: "5430", debit: 600, credit: 0 },
            { accountId: "1020", debit: 0, credit: 600 }
        ]
    },
    {
        date: "2024-04-30",
        description: "Late Fees from Client",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 150, credit: 0 },
            { accountId: "4210", debit: 0, credit: 150 }
        ]
    },

    // May 2024 - Stabilization
    {
        date: "2024-05-01",
        description: "Office Rent May",
        status: "approved",
        lines: [
            { accountId: "5010", debit: 2500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2500 }
        ]
    },
    {
        date: "2024-05-05",
        description: "Loan Payment",
        status: "approved",
        lines: [
            { accountId: "2210", debit: 1000, credit: 0 },
            { accountId: "1020", debit: 0, credit: 1000 }
        ]
    },
    {
        date: "2024-05-10",
        description: "Regular Consulting Client",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 6500, credit: 0 },
            { accountId: "4010", debit: 0, credit: 6500 }
        ]
    },
    {
        date: "2024-05-15",
        description: "Equipment Maintenance",
        status: "approved",
        lines: [
            { accountId: "5410", debit: 200, credit: 0 },
            { accountId: "1020", debit: 0, credit: 200 }
        ]
    },
    {
        date: "2024-05-20",
        description: "Business Travel",
        status: "approved",
        lines: [
            { accountId: "5510", debit: 1200, credit: 0 },
            { accountId: "2110", debit: 0, credit: 1200 }
        ]
    },
    {
        date: "2024-05-25",
        description: "Mileage Reimbursement",
        status: "approved",
        lines: [
            { accountId: "5530", debit: 150, credit: 0 },
            { accountId: "1020", debit: 0, credit: 150 }
        ]
    },

    // June 2024 - Review Month
    {
        date: "2024-06-01",
        description: "Office Rent June",
        status: "approved",
        lines: [
            { accountId: "5010", debit: 2500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2500 }
        ]
    },
    {
        date: "2024-06-05",
        description: "Financial Audit Services",
        status: "approved",
        lines: [
            { accountId: "5320", debit: 1200, credit: 0 },
            { accountId: "1020", debit: 0, credit: 1200 }
        ]
    },
    {
        date: "2024-06-10",
        description: "Strategic Planning Consulting",
        status: "approved",
        lines: [
            { accountId: "5330", debit: 2500, credit: 0 },
            { accountId: "1020", debit: 0, credit: 2500 }
        ]
    },
    {
        date: "2024-06-15",
        description: "Professional License Renewal",
        status: "approved",
        lines: [
            { accountId: "5620", debit: 300, credit: 0 },
            { accountId: "1020", debit: 0, credit: 300 }
        ]
    },
    {
        date: "2024-06-20",
        description: "Bank Service Fees",
        status: "approved",
        lines: [
            { accountId: "5710", debit: 25, credit: 0 },
            { accountId: "1020", debit: 0, credit: 25 }
        ]
    },
    {
        date: "2024-06-25",
        description: "Interest Income",
        status: "approved",
        lines: [
            { accountId: "1020", debit: 45, credit: 0 },
            { accountId: "4220", debit: 0, credit: 45 }
        ]
    },
    {
        date: "2024-06-30",
        description: "Loan Interest Payment",
        status: "approved",
        lines: [
            { accountId: "5730", debit: 180, credit: 0 },
            { accountId: "1020", debit: 0, credit: 180 }
        ]
    }
];

// Main execution function
async function populateTestData() {
    console.log('🏢 Creating Comprehensive Office Test Data');
    console.log('==========================================\n');

    if (!SESSION_COOKIE) {
        console.error('❌ ERROR: Please set your SESSION_COOKIE variable first!');
        console.log('💡 Instructions:');
        console.log('1. Log in to your app at http://localhost:3004');
        console.log('2. Open browser developer tools (F12)');
        console.log('3. Go to Application > Cookies > localhost:3004');
        console.log('4. Copy the value of "next-auth.session-token"');
        console.log('5. Update the SESSION_COOKIE variable in this script\n');
        process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;

    try {
        console.log('📋 Step 1: Creating Complete Chart of Accounts');
        console.log('===============================================\n');

        // Create accounts
        for (const account of chartOfAccounts) {
            try {
                const accountData = {
                    ...account,
                    normalBalance: (account.type === 'asset' || account.type === 'expense') ? 'debit' : 'credit'
                };

                const response = await makeRequest('POST', '/api/accounts', accountData, SESSION_COOKIE);

                if (response.status === 201 || response.status === 200) {
                    console.log(`✅ Created account: ${account.code} - ${account.name} (${account.type})`);
                    successCount++;
                } else {
                    console.log(`⚠️  Account ${account.code} may already exist or failed: ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Failed to create account ${account.code}: ${error.message}`);
                errorCount++;
            }
        }

        console.log('\n⏳ Waiting 2 seconds for accounts to be processed...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('📊 Step 2: Creating Realistic Office Transactions');
        console.log('===============================================\n');

        // Create transactions by month
        const months = ['January', 'February', 'March', 'April', 'May', 'June'];
        let currentMonth = -1;

        for (const transaction of transactions) {
            try {
                const response = await makeRequest('POST', '/api/transactions', transaction, SESSION_COOKIE);

                if (response.status === 201 || response.status === 200) {
                    const monthIndex = new Date(transaction.date).getMonth();
                    if (monthIndex !== currentMonth) {
                        currentMonth = monthIndex;
                        console.log(`📅 Creating ${months[currentMonth]} 2024 transactions...`);
                    }
                    console.log(`💰 Created transaction: ${transaction.description}`);
                    successCount++;
                } else {
                    console.log(`❌ Failed to create transaction: ${response.status} - ${JSON.stringify(response.data)}`);
                    errorCount++;
                }
            } catch (error) {
                console.log(`❌ Failed to create transaction: ${error.message}`);
                errorCount++;
            }
        }

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }

    console.log('\n🎉 Test Data Creation Complete!');
    console.log('==============================');
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    console.log('\n📈 Summary of Created Data:');
    console.log('• 32+ Accounts covering all business aspects');
    console.log('• 35+ Transactions over 6 months');
    console.log('• Realistic business scenarios');
    console.log('• Proper double-entry accounting');
    console.log('• Diverse revenue and expense categories');
    console.log('\n🔍 Next Steps:');
    console.log(`1. Check your accounts at: ${BASE_URL}/accounts`);
    console.log(`2. View transactions at: ${BASE_URL}/transactions`);
    console.log(`3. See beautiful reports at: ${BASE_URL}/reports`);
    console.log('\n💡 Your reports will now show:');
    console.log('• Revenue growth from startup to peak season');
    console.log('• Diverse expense categories (salaries, marketing, tech, etc.)');
    console.log('• Cash flow progression over time');
    console.log('• Balanced account distribution across all types');
    console.log('\nEnjoy your professional-looking accounting dashboard! 🚀');
}

// Run the script
if (require.main === module) {
    populateTestData().catch(console.error);
}

module.exports = { populateTestData, chartOfAccounts, transactions };