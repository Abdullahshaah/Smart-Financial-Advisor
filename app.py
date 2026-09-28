"""
Smart Financial Advisor System
=============================
A Flask-based web application that helps users choose the best loan option
based on their financial situation. It reads bank data from a CSV file,
calculates EMI, total payment, interest, and debt-to-income ratio,
and provides intelligent recommendations.
"""

import csv
import math
from flask import Flask, render_template, request, jsonify

# ─── Initialize Flask App ───
app = Flask(__name__)

# ─── Path to the bank data CSV file ───
CSV_FILE = "data/banks.csv"


# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def load_banks(csv_path):
    """
    Read all bank records from the CSV file and return as a list of dicts.
    Each dict has keys like 'Bank Name', 'Interest Rate (%)', 'Type', etc.
    """
    banks = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert numeric fields from strings to floats
            row["Interest Rate (%)"] = float(row["Interest Rate (%)"])
            row["Min Loan (PKR)"] = float(row["Min Loan (PKR)"])
            row["Max Loan (PKR)"] = float(row["Max Loan (PKR)"])
            row["Processing Fee (%)"] = float(row["Processing Fee (%)"])
            row["Min Duration (Years)"] = int(row["Min Duration (Years)"])
            row["Max Duration (Years)"] = int(row["Max Duration (Years)"])
            banks.append(row)
    return banks


def calculate_emi(principal, annual_rate, duration_years):
    """
    Calculate Equated Monthly Installment (EMI) using the standard formula:
        EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    Where:
        P = principal loan amount
        r = monthly interest rate (annual / 12 / 100)
        n = total number of months
    Returns EMI rounded to 2 decimal places.
    """
    # Monthly interest rate
    r = annual_rate / 12 / 100

    # Total number of monthly payments
    n = duration_years * 12

    # Handle zero interest rate edge case
    if r == 0:
        return round(principal / n, 2)

    # EMI formula
    emi = principal * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)
    return round(emi, 2)


def calculate_total_payment(emi, duration_years):
    """Total amount paid = EMI * total months"""
    return round(emi * duration_years * 12, 2)


def calculate_total_interest(total_payment, principal):
    """Total interest = total paid - original loan amount"""
    return round(total_payment - principal, 2)


def calculate_dti(emi, monthly_income):
    """
    Debt-to-Income ratio = (EMI / Monthly Income) * 100
    Used to assess how risky a loan is for the borrower.
    """
    if monthly_income <= 0:
        return 100.0
    return round((emi / monthly_income) * 100, 2)


def assess_risk(dti):
    """
    Determine risk level based on Debt-to-Income ratio:
      - Low:    DTI <= 30%
      - Medium: 30% < DTI <= 40%
      - High:   DTI > 40%
    """
    if dti <= 30:
        return "Low"
    elif dti <= 40:
        return "Medium"
    else:
        return "High"


def generate_amortization_schedule(principal, annual_rate, duration_years):
    """
    Build a full amortization (payment schedule) table.
    Each row contains:
      - Month number
      - EMI
      - Principal paid this month
      - Interest paid this month
      - Remaining balance after payment
    """
    r = annual_rate / 12 / 100
    n = duration_years * 12
    emi = calculate_emi(principal, annual_rate, duration_years)

    schedule = []
    balance = principal

    for month in range(1, n + 1):
        # Interest for this month
        interest_paid = round(balance * r, 2)

        # Principal portion for this month
        principal_paid = round(emi - interest_paid, 2)

        # Update remaining balance
        balance = round(balance - principal_paid, 2)

        # Fix floating-point issues on last payment
        if month == n:
            principal_paid = round(principal_paid + balance, 2)
            balance = 0.0

        schedule.append({
            "month": month,
            "emi": emi,
            "principal_paid": principal_paid,
            "interest_paid": interest_paid,
            "remaining_balance": max(balance, 0)
        })

    return schedule


def generate_advice(results, monthly_income, monthly_expenses, repayment_capability):
    """
    Generate intelligent advisor messages based on the analysis.
    Returns a list of advice strings.
    """
    advice = []
    disposable_income = monthly_income - monthly_expenses

    # Find the best (lowest EMI) bank
    if results:
        best = results[0]  # Already sorted by EMI ascending
        best_name = best["bank_name"]

        advice.append(
            f"⭐ {best_name} is recommended because it offers the lowest EMI "
            f"of PKR {best['emi']:,.0f} per month."
        )

        # Risk warnings
        if best["risk_level"] == "High":
            advice.append(
                "⚠️ Warning: Even the best option has a HIGH risk level. "
                "The EMI exceeds 40% of your monthly income. "
                "Consider reducing the loan amount or increasing the duration."
            )
        elif best["risk_level"] == "Medium":
            advice.append(
                "🟡 The recommended loan has a MEDIUM risk level. "
                "The EMI is between 30-40% of your income. Proceed with caution."
            )
        else:
            advice.append(
                "✅ The recommended loan has a LOW risk level. "
                "The EMI is well within your comfortable repayment range."
            )

    # Check repayment capability vs. best EMI
    if results and repayment_capability < results[0]["emi"]:
        advice.append(
            f"💡 Your stated repayment capability (PKR {repayment_capability:,.0f}) is "
            f"lower than the best EMI (PKR {results[0]['emi']:,.0f}). "
            "Consider increasing loan duration to reduce monthly payments."
        )

    # Disposable income check
    if results and disposable_income < results[0]["emi"]:
        advice.append(
            "🚨 Critical: Your disposable income (income minus expenses) is "
            "less than the EMI. This loan may not be affordable."
        )

    # General tips
    if monthly_expenses > monthly_income * 0.7:
        advice.append(
            "📊 Your expenses consume over 70% of your income. "
            "Try to reduce expenses before taking a loan."
        )

    return advice


def filter_and_analyze_banks(
    banks, loan_amount, duration_years, banking_preference,
    monthly_income, monthly_expenses, repayment_capability
):
    """
    Main processing function:
      1. Filter banks by Islamic/Conventional preference
      2. Calculate EMI, total payment, interest, DTI for each bank
      3. Sort by EMI (lowest first)
      4. Generate advice
    Returns (results_list, advice_list, best_bank_dict)
    """
    results = []

    for bank in banks:
        # ── Filter by banking preference ──
        if banking_preference != "Both":
            if bank["Type"].strip() != banking_preference:
                continue

        # ── Calculate financials ──
        rate = bank["Interest Rate (%)"]
        emi = calculate_emi(loan_amount, rate, duration_years)
        total_payment = calculate_total_payment(emi, duration_years)
        total_interest = calculate_total_interest(total_payment, loan_amount)
        dti = calculate_dti(emi, monthly_income)
        risk = assess_risk(dti)
        processing_fee = round(loan_amount * bank["Processing Fee (%)"] / 100, 2)

        results.append({
            "bank_name": bank["Bank Name"],
            "interest_rate": rate,
            "bank_type": bank["Type"].strip(),
            "emi": emi,
            "total_payment": total_payment,
            "total_interest": total_interest,
            "dti": dti,
            "risk_level": risk,
            "processing_fee": processing_fee,
        })

    # ── Sort by EMI ascending (best deal first) ──
    results.sort(key=lambda x: x["emi"])

    # ── Generate intelligent advice ──
    advice = generate_advice(results, monthly_income, monthly_expenses, repayment_capability)

    # ── Identify best bank ──
    best_bank = results[0] if results else None

    return results, advice, best_bank


# ═══════════════════════════════════════════════════════════════
# FLASK ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/")
def index():
    """Render the main dashboard / input form page."""
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Receive the form data, run the analysis, and return the results page.
    """
    # ── Collect form inputs ──
    client_name = request.form.get("client_name", "User")
    job_type = request.form.get("job_type", "Salaried")
    monthly_income = float(request.form.get("monthly_income", 0))
    monthly_expenses = float(request.form.get("monthly_expenses", 0))
    loan_purpose = request.form.get("loan_purpose", "Car")
    loan_amount = float(request.form.get("loan_amount", 0))
    duration_years = int(request.form.get("duration_years", 1))
    repayment_capability = float(request.form.get("repayment_capability", 0))
    banking_preference = request.form.get("banking_preference", "Both")

    # ── Load bank data from CSV ──
    banks = load_banks(CSV_FILE)

    # ── Run filtering and analysis ──
    results, advice, best_bank = filter_and_analyze_banks(
        banks, loan_amount, duration_years, banking_preference,
        monthly_income, monthly_expenses, repayment_capability
    )

    # ── Generate amortization schedule for the best bank ──
    amortization = []
    if best_bank:
        amortization = generate_amortization_schedule(
            loan_amount, best_bank["interest_rate"], duration_years
        )

    # ── Render results template ──
    return render_template(
        "results.html",
        client_name=client_name,
        job_type=job_type,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        loan_purpose=loan_purpose,
        loan_amount=loan_amount,
        duration_years=duration_years,
        repayment_capability=repayment_capability,
        banking_preference=banking_preference,
        results=results,
        advice=advice,
        best_bank=best_bank,
        amortization=amortization,
    )


@app.route("/api/amortization", methods=["POST"])
def api_amortization():
    """
    API endpoint to get amortization schedule for a specific bank.
    Accepts JSON with: loan_amount, interest_rate, duration_years
    Returns JSON amortization schedule.
    """
    data = request.get_json()
    loan_amount = float(data.get("loan_amount", 0))
    interest_rate = float(data.get("interest_rate", 0))
    duration_years = int(data.get("duration_years", 1))

    schedule = generate_amortization_schedule(loan_amount, interest_rate, duration_years)
    return jsonify(schedule)


# ─── Run the Application ───
if __name__ == "__main__":
    app.run(debug=True, port=5000)
