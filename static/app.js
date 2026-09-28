// Bank Mock Data (Pakistani Banks)
const banks = [
    { id: 'hbl', name: 'HBL', type: 'Conventional', rate: 18.5, logo: 'static/logo/HBL-logo.webp', savingsRate: 14.0 },
    { id: 'ubl', name: 'UBL', type: 'Conventional', rate: 19.0, logo: 'static/logo/UBL-Bank-Logo.webp', savingsRate: 14.5 },
    { id: 'meezan', name: 'Meezan Bank', type: 'Islamic', rate: 17.5, logo: 'static/logo/meezan-bank-logo-04.webp', savingsRate: 13.5 },
    { id: 'alhabib', name: 'Bank AL Habib', type: 'Conventional', rate: 18.2, logo: 'static/logo/bank-al-habib-logo.webp', savingsRate: 14.2 },
    { id: 'allied', name: 'Allied Bank', type: 'Conventional', rate: 18.0, logo: 'static/logo/allied-bank-limited-logo.webp', savingsRate: 14.0 },
    { id: 'mcb', name: 'MCB Bank', type: 'Conventional', rate: 18.8, logo: 'static/logo/mcb-logo.webp', savingsRate: 14.3 },
    { id: 'faysal', name: 'Faysal Bank', type: 'Islamic', rate: 17.2, logo: 'static/logo/faysal-bank-islami-new-logo-png_seeklogo-613115.webp', savingsRate: 13.0 },
    { id: 'bankislami', name: 'BankIslami', type: 'Islamic', rate: 17.6, logo: 'static/logo/bank-islami-logo.webp', savingsRate: 13.2 },
    { id: 'albaraka', name: 'Al Baraka', type: 'Islamic', rate: 17.9, logo: 'static/logo/al-baraka-logo.webp', savingsRate: 13.4 }
];

// Global chart instances tracking isn't strictly necessary if using Chart.getChart(id), but we'll use it to be safe.

// Setup Chart.js Defaults
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";
}

// Tab Switching Logic
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panels
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            const targetPanel = document.getElementById(`panel-${button.dataset.tab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
});

// Helper functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
};

const calculateEMI = (principal, annualRate, months) => {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

// ==================== TAB 1: LOAN ADVISOR ====================
document.getElementById('loan-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const income = parseFloat(document.getElementById('income').value);
        const creditScore = parseInt(document.getElementById('credit-score').value);
        const loanAmount = parseFloat(document.getElementById('loan-amount').value);
        const duration = parseInt(document.getElementById('duration').value);
        const existingDebt = parseFloat(document.getElementById('existing-debt').value) || 0;
        const pref = document.getElementById('banking-pref').value;

        generateLoanRecommendations(income, creditScore, loanAmount, duration, existingDebt, pref);
    } catch (err) {
        console.error("Error generating recommendations:", err);
        alert("An error occurred. Please check your inputs.");
    }
});

function generateLoanRecommendations(income, creditScore, loanAmount, duration, existingDebt, pref) {
    let filteredBanks = banks;
    if (pref === 'islamic') filteredBanks = banks.filter(b => b.type === 'Islamic');
    if (pref === 'conventional') filteredBanks = banks.filter(b => b.type === 'Conventional');

    if(filteredBanks.length === 0) filteredBanks = banks; // fallback if no banks match

    const bankResults = filteredBanks.map(bank => {
        let dynamicRate = bank.rate;
        
        // --- Smart AI Pricing Logic ---
        // Excellent Credit Score gets discount
        if (creditScore >= 750) {
            dynamicRate -= 0.5;
        } else if (creditScore < 600) {
            // Poor credit score gets premium
            dynamicRate += 1.0;
        }
        
        // Large loans carry slight premium for risk
        if (loanAmount > 5000000) {
            dynamicRate += 0.25;
        }

        const emi = calculateEMI(loanAmount, dynamicRate, duration);
        const totalRepayment = emi * duration;
        const totalInterest = totalRepayment - loanAmount;
        return { ...bank, rate: dynamicRate, emi, totalRepayment, totalInterest };
    });

    bankResults.sort((a, b) => a.emi - b.emi);
    const bestBank = bankResults[0];
    const worstBank = bankResults[bankResults.length - 1];

    // Analytics Calculation
    const totalMonthlyDebt = bestBank.emi + existingDebt;
    const dtiRatio = ((totalMonthlyDebt / income) * 100).toFixed(1);
    const interestSaved = worstBank.totalInterest - bestBank.totalInterest;
    
    // Eligibility Score (0-100)
    let score = 100;
    // DTI Penalty
    if (dtiRatio > 40) score -= (dtiRatio - 40) * 1.5;
    // Credit Score Penalty
    if (creditScore < 700) score -= (700 - creditScore) / 4;
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Smart Advisor Logic Messages
    let riskLevel = '';
    let riskClass = '';
    let icon = '';
    
    if (dtiRatio > 50) {
        riskLevel = "High Risk: Total debt consumes >50% of your income. Likelihood of default is high.";
        riskClass = "text-danger";
        icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else if (dtiRatio > 35) {
        riskLevel = "Moderate Risk: Debt-to-Income ratio is elevated. Ensure stable income.";
        riskClass = "text-warning";
        icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    } else {
        riskLevel = "Low Risk: Comfortable repayment capacity based on stated income.";
        riskClass = "text-success";
        icon = '<i class="fa-solid fa-circle-check"></i>';
    }

    if (creditScore < 600) {
        riskLevel += " Note: Your low credit score may result in application rejection.";
        riskClass = "text-danger";
        icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }

    const emiDifference = (((worstBank.emi - bestBank.emi) / worstBank.emi) * 100).toFixed(1);

    document.getElementById('advisor-message').innerHTML = `Algorithm recommends <strong>${bestBank.name}</strong>. The EMI is <strong>${emiDifference}% lower</strong> than the most expensive alternative, saving substantial capital over ${duration} months.`;
    document.getElementById('risk-message').className = `risk-message ${riskClass}`;
    document.getElementById('risk-message').innerHTML = `${icon} ${riskLevel}`;

    // Score UI update
    document.getElementById('score-value').textContent = `${score}`;
    const fillElement = document.getElementById('score-fill');
    if(fillElement) {
        fillElement.style.strokeDashoffset = 264 - (264 * score / 100);
        // Change color based on score
        if(score < 50) fillElement.style.stroke = "var(--danger)";
        else if (score < 75) fillElement.style.stroke = "var(--warning)";
        else fillElement.style.stroke = "var(--accent)";
    }

    // Key Metrics Update
    document.getElementById('dti-ratio').textContent = `${dtiRatio}%`;
    document.getElementById('dti-ratio').style.color = dtiRatio > 40 ? 'var(--danger)' : 'var(--text-main)';
    
    document.getElementById('interest-saved').textContent = formatCurrency(interestSaved);
    
    // Max Eligible Loan heuristic: (40% of income - existing debt) * duration * 0.8
    const maxMonthlyPaymentAllowed = (income * 0.4) - existingDebt;
    let maxLoanStr = "None";
    if(maxMonthlyPaymentAllowed > 0) {
        // Reverse EMI formula approximation
        const monthlyRate = bestBank.rate / 12 / 100;
        const maxLoanApprox = maxMonthlyPaymentAllowed * ((Math.pow(1 + monthlyRate, duration) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, duration)));
        maxLoanStr = formatCurrency(maxLoanApprox);
    }
    document.getElementById('max-loan').textContent = maxLoanStr;

    // Best/Worst Cards UI
    const createBankCard = (bank, isBest) => `
        <div class="bank-header-flex">
            <div class="bank-logo-container"><img src="${bank.logo}" alt="${bank.name}" class="bank-logo-img"></div>
            <div class="bank-details">
                <div class="bank-name">${bank.name}</div>
                <div class="bank-type"><i class="fa-solid ${bank.type === 'Islamic' ? 'fa-star-and-crescent' : 'fa-building-columns'}"></i> ${bank.type} Banking</div>
            </div>
        </div>
        <div class="bank-metric"><span>Algorithm Adjusted Rate:</span> <span>${bank.rate.toFixed(2)}%</span></div>
        <div class="bank-metric"><span>Monthly EMI:</span> <span style="color: ${isBest ? 'var(--accent)' : 'var(--danger)'}">${formatCurrency(bank.emi)}</span></div>
        <div class="bank-metric"><span>Total Repayment:</span> <span>${formatCurrency(bank.totalRepayment)}</span></div>
    `;

    document.getElementById('top-bank-details').innerHTML = createBankCard(bestBank, true);
    document.getElementById('worst-bank-details').innerHTML = createBankCard(worstBank, false);

    // Table Generation
    const tbody = document.getElementById('comparison-table-body');
    tbody.innerHTML = '';
    bankResults.forEach((b, index) => {
        let dotClass = 'dot-blue'; // default
        if (b.id === bestBank.id) dotClass = 'dot-green';
        else if (b.id === worstBank.id) dotClass = 'dot-red';
        
        let eligibilityStr = '<span style="color:var(--accent)">High</span>';
        if(score < 40) eligibilityStr = '<span style="color:var(--danger)">Low</span>';
        else if(score < 70) eligibilityStr = '<span style="color:var(--warning)">Medium</span>';

        tbody.innerHTML += `
            <tr>
                <td>${index + 1} <span class="dot ${dotClass}" style="display:inline-block; margin-left:5px;"></span></td>
                <td>
                    <div class="table-logo-cell">
                        <div class="table-logo"><img src="${b.logo}" alt="${b.name}"></div>
                        <strong>${b.name}</strong>
                    </div>
                </td>
                <td>${b.type}</td>
                <td>${b.rate.toFixed(2)}%</td>
                <td style="font-weight:600">${formatCurrency(b.emi)}</td>
                <td>${formatCurrency(b.totalRepayment)}</td>
                <td>${formatCurrency(b.totalInterest)}</td>
                <td>${eligibilityStr}</td>
            </tr>
        `;
    });

    // Render Insights Grid
    document.getElementById('insights-grid').innerHTML = `
        <div class="insight-card">
            <h4><i class="fa-solid fa-chart-area"></i> Long-term Capital Impact</h4>
            <p>Over ${duration} months, you will pay <strong>${formatCurrency(bestBank.totalInterest)}</strong> in pure interest with ${bestBank.name}. This represents <strong>${((bestBank.totalInterest/loanAmount)*100).toFixed(1)}%</strong> of your principal amount being lost to financing costs.</p>
        </div>
        <div class="insight-card">
            <h4><i class="fa-solid fa-scale-unbalanced"></i> Debt-to-Income Analysis</h4>
            <p>With a proposed EMI of ${formatCurrency(bestBank.emi)} and existing debt of ${formatCurrency(existingDebt)}, your total debt exposure is <strong>${dtiRatio}%</strong> of your gross income. Pakistani banks generally mandate DTI limits under 40% to 50%.</p>
        </div>
        <div class="insight-card">
            <h4><i class="fa-solid fa-sack-dollar"></i> Opportunity Cost</h4>
            <p>By optimizing your choice away from ${worstBank.name}, you retain <strong>${formatCurrency(interestSaved)}</strong>. If reinvested in a mutual fund yielding 15% annually over the same ${duration/12} year period, this capital could grow significantly.</p>
        </div>
    `;

    // Render Charts
    renderCharts(bankResults, bestBank, worstBank, loanAmount, duration);
    
    const resultsSec = document.getElementById('results-section');
    resultsSec.classList.remove('hidden');
    
    // Slight delay to allow render before scroll
    setTimeout(() => {
        resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function renderCharts(bankResults, bestBank, worstBank, principal, duration) {
    if (typeof Chart === 'undefined') return;

    // Helper to safely destroy existing chart on a canvas
    const destroyChart = (id) => {
        let chart = Chart.getChart(id);
        if (chart) chart.destroy();
    };

    destroyChart('emiChart');
    destroyChart('interestPieChart');
    destroyChart('timelineChart');
    destroyChart('interestCompareChart');

    // 1. EMI Bar Chart
    const emiCtx = document.getElementById('emiChart');
    if(emiCtx) {
        new Chart(emiCtx, {
            type: 'bar',
            data: {
                labels: bankResults.map(b => b.name),
                datasets: [{
                    label: 'Monthly EMI (PKR)',
                    data: bankResults.map(b => b.emi),
                    backgroundColor: bankResults.map(b => {
                        if(b.id === bestBank.id) return 'rgba(16, 185, 129, 0.9)';
                        if(b.id === worstBank.id) return 'rgba(239, 68, 68, 0.9)';
                        return 'rgba(59, 130, 246, 0.7)';
                    }),
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } }
                } 
            }
        });
    }

    // 2. Interest Pie Chart
    const pieCtx = document.getElementById('interestPieChart');
    if(pieCtx) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Principal Loan', 'Total Interest'],
                datasets: [{
                    data: [principal, bestBank.totalInterest],
                    backgroundColor: ['rgba(59, 130, 246, 0.9)', 'rgba(245, 158, 11, 0.9)'],
                    borderWidth: 2,
                    borderColor: '#1e293b',
                    hoverOffset: 4
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } }
            }
        });
    }

    // 3. Timeline Chart (Amortization Schedule)
    const timelineCtx = document.getElementById('timelineChart');
    if(timelineCtx) {
        const timelineLabels = []; const timelineData = [];
        let remainingBalance = principal; 
        const monthlyRate = bestBank.rate / 12 / 100;
        const step = Math.max(1, Math.ceil(duration / 24)); // Limit data points for performance

        for (let i = 0; i <= duration; i++) {
            if(i % step === 0 || i === duration) {
                timelineLabels.push(`M ${i}`);
                timelineData.push(Math.max(0, remainingBalance));
            }
            if (remainingBalance > 0 && i < duration) {
                const intM = remainingBalance * monthlyRate;
                const prinM = bestBank.emi - intM;
                remainingBalance -= prinM;
            }
        }

        new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [{
                    label: 'Remaining Principal (PKR)',
                    data: timelineData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    fill: true, 
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 10
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 4. Compare Chart
    const compareCtx = document.getElementById('interestCompareChart');
    if(compareCtx) {
        new Chart(compareCtx, {
            type: 'bar',
            data: {
                labels: [bestBank.name, worstBank.name],
                datasets: [
                    { 
                        label: 'Principal Amount', 
                        data: [principal, principal], 
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: {bottomLeft: 6, bottomRight: 6}
                    },
                    { 
                        label: 'Total Interest', 
                        data: [bestBank.totalInterest, worstBank.totalInterest], 
                        backgroundColor: ['rgba(16, 185, 129, 0.9)', 'rgba(239, 68, 68, 0.9)'],
                        borderRadius: {topLeft: 6, topRight: 6}
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { 
                    x: { stacked: true, grid: { display: false } }, 
                    y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' } } 
                },
                plugins: { legend: { labels: { color: '#f8fafc' } } }
            }
        });
    }
}

// ==================== TAB 2: INVESTMENT ADVISOR ====================
document.getElementById('invest-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('invest-amount').value);
    const horizon = parseInt(document.getElementById('invest-horizon').value);
    const risk = document.getElementById('risk-tolerance').value;
    
    generateInvestmentRecommendations(amount, horizon, risk);
});

function generateInvestmentRecommendations(amount, horizon, risk) {
    const resultsDiv = document.getElementById('invest-results');
    
    let portfolio = [];
    let expectedReturn = 0;
    
    if (risk === 'conservative') {
        portfolio = [
            { name: 'Government T-Bills / Bonds', alloc: 60, return: 16.5, icon: 'fa-landmark' },
            { name: 'Fixed Deposits (TDR)', alloc: 30, return: 14.5, icon: 'fa-piggy-bank' },
            { name: 'Income Mutual Funds', alloc: 10, return: 17.0, icon: 'fa-chart-pie' }
        ];
        expectedReturn = 15.95;
    } else if (risk === 'moderate') {
        portfolio = [
            { name: 'Balanced Mutual Funds', alloc: 50, return: 19.5, icon: 'fa-scale-balanced' },
            { name: 'Government Bonds', alloc: 20, return: 16.5, icon: 'fa-landmark' },
            { name: 'Blue-chip Equities (KSE-100)', alloc: 30, return: 23.0, icon: 'fa-arrow-trend-up' }
        ];
        expectedReturn = 19.95;
    } else {
        portfolio = [
            { name: 'Growth Equities (KSE-100)', alloc: 70, return: 26.0, icon: 'fa-arrow-trend-up' },
            { name: 'Equity Mutual Funds', alloc: 20, return: 22.0, icon: 'fa-chart-pie' },
            { name: 'High-Yield Assets / Crypto', alloc: 10, return: 35.0, icon: 'fa-bolt' }
        ];
        expectedReturn = 26.1;
    }

    const futureValue = amount * Math.pow(1 + (expectedReturn/100), horizon);
    const profit = futureValue - amount;
    
    resultsDiv.innerHTML = `
        <div class="advisor-banner">
            <div class="banner-avatar"><i class="fa-solid fa-seedling" style="color:var(--accent)"></i></div>
            <div class="banner-content">
                <h3>Investment Strategy: ${risk.charAt(0).toUpperCase() + risk.slice(1)} Profile</h3>
                <p>Based on algorithmic asset allocation, a diversified portfolio targets a <strong>~${expectedReturn.toFixed(2)}% annualized return</strong>.</p>
                <div class="risk-message ${risk === 'aggressive' ? 'text-danger' : 'text-success'}">
                    <i class="fa-solid fa-bullseye"></i> Estimated Future Value in ${horizon} years: <strong>${formatCurrency(futureValue)}</strong>
                </div>
            </div>
        </div>
        
        <div class="metrics-strip">
            <div class="metric-card glass-panel">
                <div class="metric-icon"><i class="fa-solid fa-wallet" style="color: #60a5fa;"></i></div>
                <div class="metric-data">
                    <span class="metric-value">${formatCurrency(amount)}</span>
                    <span class="metric-label">Initial Investment</span>
                </div>
            </div>
            <div class="metric-card glass-panel">
                <div class="metric-icon"><i class="fa-solid fa-money-bill-trend-up" style="color: #10b981;"></i></div>
                <div class="metric-data">
                    <span class="metric-value" style="color: #10b981;">+${formatCurrency(profit)}</span>
                    <span class="metric-label">Estimated Profit</span>
                </div>
            </div>
        </div>

        <h3 style="margin-bottom: 1.5rem;"><i class="fa-solid fa-diagram-project"></i> Recommended Asset Allocation</h3>
        <div class="dashboard-grid">
            ${portfolio.map(p => `
                <div class="card glass-panel">
                    <h3><i class="fa-solid ${p.icon}" style="margin-right:8px; color:var(--primary)"></i>${p.name}</h3>
                    <div class="bank-metric"><span>Capital Allocation:</span> <span>${p.alloc}%</span></div>
                    <div class="bank-metric"><span>Deployed Amount:</span> <span>${formatCurrency(amount * p.alloc / 100)}</span></div>
                    <div class="bank-metric"><span>Target CAGR:</span> <span style="color:var(--accent)">${p.return.toFixed(1)}%</span></div>
                </div>
            `).join('')}
        </div>
    `;
    
    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// ==================== TAB 3: SAVINGS PLANNER ====================
document.getElementById('savings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('savings-amount').value);
    const tenure = parseInt(document.getElementById('savings-tenure').value);
    const inflation = parseFloat(document.getElementById('inflation-rate').value);
    
    const resultsDiv = document.getElementById('savings-results');
    
    // Sort banks by savings rate
    let topBanks = [...banks].sort((a,b) => b.savingsRate - a.savingsRate);
    const bestBank = topBanks[0];
    
    const nominalReturn = amount * Math.pow(1 + (bestBank.savingsRate/100), tenure);
    
    // Real return using Fisher Equation approximation (1+r) = (1+i)/(1+pi) - 1
    // Simplified: Real Rate ~ Nominal Rate - Inflation Rate
    const realReturnRate = bestBank.savingsRate - inflation;
    
    // Purchasing power projection: Value of nominal return discounted by inflation
    const realPurchasingPower = nominalReturn / Math.pow(1 + (inflation/100), tenure);
    
    let advice = '';
    let adviceClass = '';
    let icon = '';

    if(realReturnRate < 0) {
        advice = `Wealth Erosion Warning: Inflation (${inflation}%) is outpacing your bank rate (${bestBank.savingsRate}%). You are losing purchasing power over time. Consider investing instead of saving.`;
        adviceClass = 'text-danger';
        icon = '<i class="fa-solid fa-arrow-trend-down"></i>';
    } else {
        advice = `Positive Real Yield: Your money is successfully outperforming inflation by an estimated ${realReturnRate.toFixed(1)}% annually.`;
        adviceClass = 'text-success';
        icon = '<i class="fa-solid fa-shield-halved"></i>';
    }

    resultsDiv.innerHTML = `
        <div class="advisor-banner">
            <div class="banner-avatar"><i class="fa-solid fa-piggy-bank" style="color:var(--primary)"></i></div>
            <div class="banner-content">
                <h3>Macroeconomic Savings Analysis</h3>
                <p>Top Available Rate: <strong>${bestBank.name} at ${bestBank.savingsRate}%</strong></p>
                <div class="risk-message ${adviceClass}">${icon} ${advice}</div>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <div class="card glass-panel recommendation-card">
                <h3><i class="fa-solid fa-money-bill-1-wave"></i> Nominal Future Value</h3>
                <h2 style="color:var(--primary); font-size: 2.2rem; margin: 1rem 0;">${formatCurrency(nominalReturn)}</h2>
                <p>Profit Earned on Paper: <strong>${formatCurrency(nominalReturn - amount)}</strong></p>
            </div>
            <div class="card glass-panel avoid-card">
                <h3><i class="fa-solid fa-cart-shopping"></i> Real Purchasing Power</h3>
                <h2 style="color:var(--warning); font-size: 2.2rem; margin: 1rem 0;">${formatCurrency(realPurchasingPower)}</h2>
                <p>Actual value in today's money after ${inflation}% annual inflation.</p>
            </div>
        </div>
    `;
    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
});

// ==================== TAB 4: ISLAMIC VS CONVENTIONAL ====================
document.getElementById('islamic-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('islamic-amount').value);
    const tenure = parseInt(document.getElementById('islamic-tenure').value);
    
    const resultsDiv = document.getElementById('islamic-results');
    
    const islamicBanks = banks.filter(b => b.type === 'Islamic').sort((a,b) => a.rate - b.rate);
    const convBanks = banks.filter(b => b.type === 'Conventional').sort((a,b) => a.rate - b.rate);
    
    const bestIslamic = islamicBanks[0];
    const bestConv = convBanks[0];
    
    const islamicEMI = calculateEMI(amount, bestIslamic.rate, tenure);
    const convEMI = calculateEMI(amount, bestConv.rate, tenure);
    
    const islamicTotal = islamicEMI * tenure;
    const convTotal = convEMI * tenure;
    const diff = Math.abs(islamicTotal - convTotal);

    let conclusion = '';
    if (islamicTotal < convTotal) {
        conclusion = `<strong>${bestIslamic.name} (Islamic)</strong> is currently offering a more competitive rate structure than conventional alternatives, saving you <strong>${formatCurrency(diff)}</strong> over the tenure while remaining Shariah-compliant.`;
    } else {
        conclusion = `<strong>${bestConv.name} (Conventional)</strong> is mathematically cheaper by <strong>${formatCurrency(diff)}</strong>. However, if Shariah compliance (avoiding Riba) is a priority, ${bestIslamic.name} represents the best Islamic option.`;
    }

    resultsDiv.innerHTML = `
        <div class="dashboard-grid">
            <div class="card glass-panel" style="border-top: 4px solid var(--accent)">
                <div class="card-badge best" style="background:var(--accent)"><i class="fa-solid fa-star-and-crescent"></i> Islamic</div>
                <div class="bank-header-flex" style="margin-top:1.5rem">
                    <div class="bank-logo-container"><img src="${bestIslamic.logo}" alt="${bestIslamic.name}" class="bank-logo-img"></div>
                    <div class="bank-details">
                        <div class="bank-name">${bestIslamic.name}</div>
                    </div>
                </div>
                <p style="color:var(--text-muted); margin-bottom: 1.5rem; font-size:0.9rem;">
                    <strong>Structure:</strong> Diminishing Musharakah / Murabaha<br>
                    Profit is generated through asset sale/lease, avoiding interest (Riba).
                </p>
                <div class="bank-metric"><span>Bank Profit Rate:</span> <span>${bestIslamic.rate}%</span></div>
                <div class="bank-metric"><span>Monthly Rental/Installment:</span> <span style="font-weight:bold; color:var(--accent)">${formatCurrency(islamicEMI)}</span></div>
                <div class="bank-metric"><span>Total Paid:</span> <span>${formatCurrency(islamicTotal)}</span></div>
            </div>
            
            <div class="card glass-panel" style="border-top: 4px solid var(--primary)">
                <div class="card-badge" style="background:var(--primary); color:white;"><i class="fa-solid fa-building-columns"></i> Conventional</div>
                <div class="bank-header-flex" style="margin-top:1.5rem">
                    <div class="bank-logo-container"><img src="${bestConv.logo}" alt="${bestConv.name}" class="bank-logo-img"></div>
                    <div class="bank-details">
                        <div class="bank-name">${bestConv.name}</div>
                    </div>
                </div>
                <p style="color:var(--text-muted); margin-bottom: 1.5rem; font-size:0.9rem;">
                    <strong>Structure:</strong> Standard Amortization Loan<br>
                    Based on KIBOR + Bank Margin Interest.
                </p>
                <div class="bank-metric"><span>Interest Rate:</span> <span>${bestConv.rate}%</span></div>
                <div class="bank-metric"><span>Monthly EMI:</span> <span style="font-weight:bold; color:var(--primary)">${formatCurrency(convEMI)}</span></div>
                <div class="bank-metric"><span>Total Paid:</span> <span>${formatCurrency(convTotal)}</span></div>
            </div>
        </div>
        <div class="glass-panel" style="margin-top: 1rem; border-left: 4px solid #60a5fa;">
            <h3 style="color: #60a5fa;"><i class="fa-solid fa-scale-balanced"></i> Advisory Conclusion</h3>
            <p style="font-size: 1.1rem; line-height: 1.6;">${conclusion}</p>
        </div>
    `;
    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
});
