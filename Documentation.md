# Smart Financial Advisor System — Manual Documentation

## 1. Project Overview
The **Smart Financial Advisor** is an intelligent, web-based software application designed to assist users in comparing financial products across major Pakistani banks. It replaces traditional, manual spreadsheet comparisons with dynamic, data-driven recommendations. The system encompasses four core modules:
- 🏦 **Loan Advisor**
- 📈 **Investment Advisor**
- 💰 **Savings Planner**
- ☪️ **Islamic vs Conventional Comparison**

## 2. Technology Stack
- **Backend/Framework:** Python, Flask (`app.py`)
- **Frontend Core:** HTML5, CSS3, JavaScript (Vanilla ES6)
- **Data Visualization:** Chart.js (Dynamic rendering of Canvas elements)
- **Styling:** Custom Vanilla CSS with CSS Variables, Glassmorphism design principles, Google Fonts (Inter & Outfit), and FontAwesome icons.

## 3. Core Modules & Algorithmic Logic

### A. Loan Advisor
The Loan Advisor calculates Equated Monthly Installment (EMI), evaluates the user's financial health, and recommends the best banking product.

**Key Inputs:**
- Monthly Income (PKR)
- Credit Score (300-850)
- Desired Loan Amount (PKR)
- Duration (Months)
- Existing Monthly Debt

**Algorithmic Engine:**
1. **Dynamic Risk Pricing:** 
   - Base interest rates are adjusted based on the user's credit score. A high score (≥ 750) receives a 0.5% rate discount, while a poor score (< 600) incurs a 1.0% penalty premium.
   - High-volume loans (> 5M PKR) receive a 0.25% premium adjustment.
2. **EMI Calculation:** Standard amortization formula: `P * r * (1+r)^n / ((1+r)^n - 1)`
3. **Debt-to-Income (DTI) Ratio:** Evaluated as `(EMI + Existing Debt) / Gross Income`. If DTI > 40%, the algorithm flags the application as High/Moderate Risk.
4. **Eligibility Score:** Calculated dynamically (0-100) by applying weighted penalties for poor credit scores and high DTI.

**Visualizations Output:**
- EMI Comparison Bar Chart
- Principal vs Interest Pie Chart
- Amortization Timeline (Area Line Chart)
- Side-by-Side Interest Comparison

### B. Investment Advisor
Generates portfolio allocation recommendations based on the user's selected Risk Tolerance.

**Algorithmic Engine:**
- **Conservative:** 60% T-Bills, 30% TDRs, 10% Mutual Funds (Target CAGR: ~15.95%)
- **Moderate:** 50% Balanced Funds, 20% Bonds, 30% Blue-chip Equities (Target CAGR: ~19.95%)
- **Aggressive:** 70% Growth Equities, 20% Equity Funds, 10% High-Yield Assets (Target CAGR: ~26.1%)
- Calculates the estimated future value over the selected horizon `Value = P * (1 + R)^n`.

### C. Savings Planner
Calculates real returns against the current inflation rate, providing a reality check on purchasing power.

**Algorithmic Engine:**
- **Nominal Return:** Standard compound interest formula.
- **Real Rate (Fisher Equation Approximation):** `Real Rate ≈ Nominal Bank Rate - Inflation Rate`.
- **Real Purchasing Power:** Future Nominal Value discounted backward by inflation: `Nominal Value / (1 + Inflation)^n`.

### D. Islamic vs Conventional
Provides an objective, side-by-side breakdown between Islamic financing (Murabaha / Diminishing Musharakah) and Conventional Interest (KIBOR-based) products. Automatically identifies the cheapest option but provides qualitative advice if Shariah compliance is required.

## 4. UI/UX Design Principles
- **Aesthetics:** Deep dark mode (`#0b1120`), vibrant accent colors (emerald, sapphire), and `backdrop-filter: blur(16px)` to achieve a premium "Glassmorphism" effect.
- **Tooltips:** Implementation of interactive hover-tooltips (`?` icons) to explain complex financial jargon (e.g., Amortization, DTI, Inflation).
- **Responsive Handling:** CSS Grid and Flexbox are used heavily, alongside media queries to ensure mobile-readiness.

## 5. Development & Execution
To run the project locally:
1. Ensure Python 3.x is installed.
2. Install Flask: `pip install flask`
3. Run the application: `python app.py`
4. Access via browser: `http://localhost:5000`

---
*Developed by Daniyal Naeem, Abdullah, and Yahya — Department of BS FinTech.*
