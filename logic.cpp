#include <iostream>
#include <iomanip>
#include <limits>
#include <cmath>
#include <string>

using namespace std;

// ============================================================
// Constants
// ============================================================

constexpr double DAYS_PER_YEAR  = 365.0;
constexpr double WEEKS_PER_YEAR = 52.0;
constexpr double MONTHS_PER_YEAR = 12.0;
constexpr double DAYS_PER_WEEK  = 7.0;

// Your fixed weekly bank closing-balance pattern
constexpr double WEEKDAY_BALANCE = 600000.0; // Monday-Friday
constexpr double SATURDAY_BALANCE = 840000.0;
constexpr double SUNDAY_BALANCE = 936000.0;

// ============================================================
// Input validation
// ============================================================

double getPositiveAmount(const string& prompt)
{
    double value;

    while (true)
    {
        cout << prompt;

        if (cin >> value &&
            isfinite(value) &&
            value > 0.0)
        {
            return value;
        }

        cout << "ERROR: Enter a finite number greater than 0.\n";

        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }
}

double getPercentage(const string& prompt)
{
    double value;

    while (true)
    {
        cout << prompt;

        if (cin >> value &&
            isfinite(value) &&
            value >= 0.0 &&
            value <= 100.0)
        {
            return value;
        }

        cout << "ERROR: Percentage must be between 0 and 100.\n";

        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }
}

// ============================================================
// Money formatting
// ============================================================

void printMoney(const string& label, double amount)
{
    cout << left << setw(32)
         << label
         << "PKR "
         << fixed << setprecision(2)
         << amount
         << '\n';
}

void printPercent(const string& label, double value)
{
    cout << left << setw(32)
         << label
         << fixed << setprecision(4)
         << value
         << "%\n";
}

// ============================================================
// Main
// ============================================================

int main()
{
    cout << "============================================================\n";
    cout << "       COMBINED MUTUAL FUND + BANK ROI CALCULATOR\n";
    cout << "============================================================\n\n";

    // --------------------------------------------------------
    // User inputs
    // --------------------------------------------------------

    double capital =
        getPositiveAmount("Enter capital (PKR): ");

    double mutualFundRate =
        getPercentage("Enter Mutual Fund annual return (%): ");

    double mutualFundTax =
        getPercentage("Enter Mutual Fund tax (%): ");

    double bankRate =
        getPercentage("Enter Bank Savings annual rate (%): ");

    double bankTax =
        getPercentage("Enter Bank tax (%): ");

    // --------------------------------------------------------
    // BANK AVERAGE BALANCE
    //
    // Same logic as your handwritten calculation:
    //
    // Mon-Fri = 600,000 x 5
    // Sat     = 840,000
    // Sun     = 936,000
    //
    // Weekly total / 7 = average daily balance
    // --------------------------------------------------------

    const double weeklyBankBalanceTotal =
        (WEEKDAY_BALANCE * 5.0)
        + SATURDAY_BALANCE
        + SUNDAY_BALANCE;

    const double averageBankBalance =
        weeklyBankBalanceTotal / DAYS_PER_WEEK;

    // --------------------------------------------------------
    // MUTUAL FUND CALCULATION
    // --------------------------------------------------------

    const double mfGrossAnnual =
        capital * (mutualFundRate / 100.0);

    const double mfTaxAnnual =
        mfGrossAnnual * (mutualFundTax / 100.0);

    const double mfNetAnnual =
        mfGrossAnnual - mfTaxAnnual;

    // --------------------------------------------------------
    // BANK CALCULATION
    // --------------------------------------------------------

    const double bankGrossAnnual =
        averageBankBalance * (bankRate / 100.0);

    const double bankTaxAnnual =
        bankGrossAnnual * (bankTax / 100.0);

    const double bankNetAnnual =
        bankGrossAnnual - bankTaxAnnual;

    // --------------------------------------------------------
    // COMBINED CALCULATION
    //
    // This follows YOUR model:
    //
    // MF return is calculated on full entered capital.
    // Bank return is calculated on the average bank balance.
    // Then both net returns are added.
    // --------------------------------------------------------

    const double combinedGrossAnnual =
        mfGrossAnnual + bankGrossAnnual;

    const double combinedTaxAnnual =
        mfTaxAnnual + bankTaxAnnual;

    const double combinedNetAnnual =
        mfNetAnnual + bankNetAnnual;

    // ROI relative to entered capital
    const double mfNetROI =
        (mfNetAnnual / capital) * 100.0;

    const double bankNetROI =
        (bankNetAnnual / capital) * 100.0;

    const double combinedGrossROI =
        (combinedGrossAnnual / capital) * 100.0;

    const double combinedNetROI =
        (combinedNetAnnual / capital) * 100.0;

    // --------------------------------------------------------
    // PERIODIC RETURNS
    //
    // Consistent with your notebook:
    //
    // Annual -> monthly: /12
    // Annual -> weekly:  /52
    // Annual -> daily:   /365
    // --------------------------------------------------------

    // Mutual Fund
    const double mfGrossMonthly =
        mfGrossAnnual / MONTHS_PER_YEAR;

    const double mfNetMonthly =
        mfNetAnnual / MONTHS_PER_YEAR;

    const double mfGrossWeekly =
        mfGrossAnnual / WEEKS_PER_YEAR;

    const double mfNetWeekly =
        mfNetAnnual / WEEKS_PER_YEAR;

    const double mfGrossDaily =
        mfGrossAnnual / DAYS_PER_YEAR;

    const double mfNetDaily =
        mfNetAnnual / DAYS_PER_YEAR;

    // Bank
    const double bankGrossMonthly =
        bankGrossAnnual / MONTHS_PER_YEAR;

    const double bankNetMonthly =
        bankNetAnnual / MONTHS_PER_YEAR;

    const double bankGrossWeekly =
        bankGrossAnnual / WEEKS_PER_YEAR;

    const double bankNetWeekly =
        bankNetAnnual / WEEKS_PER_YEAR;

    const double bankGrossDaily =
        bankGrossAnnual / DAYS_PER_YEAR;

    const double bankNetDaily =
        bankNetAnnual / DAYS_PER_YEAR;

    // Combined
    const double combinedGrossMonthly =
        combinedGrossAnnual / MONTHS_PER_YEAR;

    const double combinedNetMonthly =
        combinedNetAnnual / MONTHS_PER_YEAR;

    const double combinedGrossWeekly =
        combinedGrossAnnual / WEEKS_PER_YEAR;

    const double combinedNetWeekly =
        combinedNetAnnual / WEEKS_PER_YEAR;

    const double combinedGrossDaily =
        combinedGrossAnnual / DAYS_PER_YEAR;

    const double combinedNetDaily =
        combinedNetAnnual / DAYS_PER_YEAR;

    // --------------------------------------------------------
    // OUTPUT
    // --------------------------------------------------------

    cout << fixed << setprecision(2);

    cout << "\n============================================================\n";
    cout << "                    INPUT SUMMARY\n";
    cout << "============================================================\n";

    printMoney("Capital", capital);
    printPercent("Mutual Fund Return", mutualFundRate);
    printPercent("Mutual Fund Tax", mutualFundTax);
    printPercent("Bank Savings Rate", bankRate);
    printPercent("Bank Tax", bankTax);

    // --------------------------------------------------------
    // BANK BALANCE DETAILS
    // --------------------------------------------------------

    cout << "\n============================================================\n";
    cout << "              BANK AVERAGE BALANCE\n";
    cout << "============================================================\n";

    printMoney("Monday-Friday", WEEKDAY_BALANCE);
    printMoney("Saturday", SATURDAY_BALANCE);
    printMoney("Sunday", SUNDAY_BALANCE);

    printMoney(
        "7-day total",
        weeklyBankBalanceTotal
    );

    printMoney(
        "Average daily bank balance",
        averageBankBalance
    );

    // --------------------------------------------------------
    // MUTUAL FUND
    // --------------------------------------------------------

    cout << "\n============================================================\n";
    cout << "                 MUTUAL FUND RETURNS\n";
    cout << "============================================================\n";

    printMoney("Gross daily return", mfGrossDaily);
    printMoney("Net daily return", mfNetDaily);

    printMoney("Gross weekly return", mfGrossWeekly);
    printMoney("Net weekly return", mfNetWeekly);

    printMoney("Gross monthly return", mfGrossMonthly);
    printMoney("Net monthly return", mfNetMonthly);

    printMoney("Gross annual return", mfGrossAnnual);
    printMoney("Tax", mfTaxAnnual);
    printMoney("Net annual return", mfNetAnnual);

    printPercent("Net ROI", mfNetROI);

    // --------------------------------------------------------
    // BANK
    // --------------------------------------------------------

    cout << "\n============================================================\n";
    cout << "                   BANK RETURNS\n";
    cout << "============================================================\n";

    printMoney("Gross daily return", bankGrossDaily);
    printMoney("Net daily return", bankNetDaily);

    printMoney("Gross weekly return", bankGrossWeekly);
    printMoney("Net weekly return", bankNetWeekly);

    printMoney("Gross monthly return", bankGrossMonthly);
    printMoney("Net monthly return", bankNetMonthly);

    printMoney("Gross annual return", bankGrossAnnual);
    printMoney("Tax", bankTaxAnnual);
    printMoney("Net annual return", bankNetAnnual);

    printPercent("Net ROI vs capital", bankNetROI);

    // --------------------------------------------------------
    // COMBINED
    // --------------------------------------------------------

    cout << "\n============================================================\n";
    cout << "                  COMBINED RETURNS\n";
    cout << "============================================================\n";

    cout << "\nDAILY\n";
    printMoney("Gross", combinedGrossDaily);
    printMoney("Net", combinedNetDaily);

    cout << "\nWEEKLY\n";
    printMoney("Gross", combinedGrossWeekly);
    printMoney("Net", combinedNetWeekly);

    cout << "\nMONTHLY\n";
    printMoney("Gross", combinedGrossMonthly);
    printMoney("Net", combinedNetMonthly);

    cout << "\nANNUAL\n";
    printMoney("Gross", combinedGrossAnnual);
    printMoney("Total tax", combinedTaxAnnual);
    printMoney("Net", combinedNetAnnual);

    // --------------------------------------------------------
    // ROI SUMMARY
    // --------------------------------------------------------

    cout << "\n============================================================\n";
    cout << "                     ROI SUMMARY\n";
    cout << "============================================================\n";

    printPercent(
        "MF net ROI",
        mfNetROI
    );

    printPercent(
        "Bank contribution to ROI",
        bankNetROI
    );

    printPercent(
        "Combined gross ROI",
        combinedGrossROI
    );

    printPercent(
        "COMBINED NET ROI",
        combinedNetROI
    );

    // --------------------------------------------------------
    // Effective tax rate on combined gross return
    // --------------------------------------------------------

    double combinedEffectiveTaxRate = 0.0;

    if (combinedGrossAnnual > 0.0)
    {
        combinedEffectiveTaxRate =
            (combinedTaxAnnual / combinedGrossAnnual) * 100.0;
    }

    printPercent(
        "Effective tax on gross return",
        combinedEffectiveTaxRate
    );

    // --------------------------------------------------------
    // Final explanation
    // --------------------------------------------------------

    cout << "\n============================================================\n";
    cout << "                 CALCULATION BASIS\n";
    cout << "============================================================\n";

    cout << "1. Bank average = 7-day closing balance average.\n";
    cout << "2. MF return is applied to the full entered capital.\n";
    cout << "3. Bank return is applied to the calculated average\n";
    cout << "   bank balance.\n";
    cout << "4. Gross return is calculated before tax.\n";
    cout << "5. Tax is calculated on gross profit.\n";
    cout << "6. Net return = gross profit - tax.\n";
    cout << "7. Monthly = annual / 12.\n";
    cout << "8. Weekly  = annual / 52.\n";
    cout << "9. Daily   = annual / 365.\n";

    cout << "\nIMPORTANT:\n";
    cout << "The combined ROI follows the exact structure of your\n";
    cout << "notebook. It is NOT a conventional portfolio-weighted\n";
    cout << "ROI unless the capital allocation between MF and bank\n";
    cout << "is explicitly defined.\n";

    cout << "\n============================================================\n";
    cout << "                    CALCULATION COMPLETE\n";
    cout << "============================================================\n";

    return 0;
}