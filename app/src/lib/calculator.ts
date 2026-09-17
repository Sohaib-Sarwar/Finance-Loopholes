// Exact port of the calculation section of logic.cpp (lines 124-421).
// Every formula here must match the C++ source line-for-line. Do not
// simplify, reorder, or "improve" the math -- see logic.cpp for the
// authoritative reference and inline comments explaining each step.

import {
  DAYS_PER_WEEK,
  DAYS_PER_YEAR,
  MONTHS_PER_YEAR,
  SATURDAY_BALANCE,
  SUNDAY_BALANCE,
  WEEKDAY_BALANCE,
  WEEKS_PER_YEAR,
} from "./constants";

export interface CalculatorInputs {
  capital: number;
  mutualFundRate: number; // percent, 0-100
  mutualFundTax: number; // percent, 0-100
  bankRate: number; // percent, 0-100
  bankTax: number; // percent, 0-100
}

export interface PeriodicAmounts {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface InstrumentResult {
  gross: PeriodicAmounts;
  net: PeriodicAmounts;
  taxAnnual: number;
  netROI: number; // net annual / capital * 100
}

export interface BankBalanceDetail {
  weekdayBalance: number;
  saturdayBalance: number;
  sundayBalance: number;
  weeklyTotal: number;
  averageBankBalance: number;
}

export interface CombinedResult {
  gross: PeriodicAmounts;
  net: PeriodicAmounts;
  taxAnnual: number;
  grossROI: number;
  netROI: number;
  effectiveTaxRateOnGross: number;
}

export interface CalculatorResult {
  inputs: CalculatorInputs;
  bank: BankBalanceDetail;
  mutualFund: InstrumentResult;
  bankResult: InstrumentResult;
  combined: CombinedResult;
}

function periodic(annual: number): PeriodicAmounts {
  return {
    annual,
    // logic.cpp lines 207-209: annual -> monthly /12, weekly /52, daily /365.
    // Plain division, never compounding.
    monthly: annual / MONTHS_PER_YEAR,
    weekly: annual / WEEKS_PER_YEAR,
    daily: annual / DAYS_PER_YEAR,
  };
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const { capital, mutualFundRate, mutualFundTax, bankRate, bankTax } = inputs;

  // -------------------------------------------------------------
  // BANK AVERAGE BALANCE (logic.cpp lines 136-142)
  // -------------------------------------------------------------
  const weeklyBankBalanceTotal =
    WEEKDAY_BALANCE * 5.0 + SATURDAY_BALANCE + SUNDAY_BALANCE;
  const averageBankBalance = weeklyBankBalanceTotal / DAYS_PER_WEEK;

  // -------------------------------------------------------------
  // MUTUAL FUND (logic.cpp lines 148-155)
  // -------------------------------------------------------------
  const mfGrossAnnual = capital * (mutualFundRate / 100.0);
  const mfTaxAnnual = mfGrossAnnual * (mutualFundTax / 100.0);
  const mfNetAnnual = mfGrossAnnual - mfTaxAnnual;

  // -------------------------------------------------------------
  // BANK (logic.cpp lines 161-168)
  // -------------------------------------------------------------
  const bankGrossAnnual = averageBankBalance * (bankRate / 100.0);
  const bankTaxAnnual = bankGrossAnnual * (bankTax / 100.0);
  const bankNetAnnual = bankGrossAnnual - bankTaxAnnual;

  // -------------------------------------------------------------
  // COMBINED (logic.cpp lines 180-200)
  // -------------------------------------------------------------
  const combinedGrossAnnual = mfGrossAnnual + bankGrossAnnual;
  const combinedTaxAnnual = mfTaxAnnual + bankTaxAnnual;
  const combinedNetAnnual = mfNetAnnual + bankNetAnnual;

  const mfNetROI = (mfNetAnnual / capital) * 100.0;
  const bankNetROI = (bankNetAnnual / capital) * 100.0;
  const combinedGrossROI = (combinedGrossAnnual / capital) * 100.0;
  const combinedNetROI = (combinedNetAnnual / capital) * 100.0;

  // -------------------------------------------------------------
  // Effective tax rate on combined gross return (logic.cpp lines 410-421)
  // -------------------------------------------------------------
  let combinedEffectiveTaxRate = 0.0;
  if (combinedGrossAnnual > 0.0) {
    combinedEffectiveTaxRate = (combinedTaxAnnual / combinedGrossAnnual) * 100.0;
  }

  return {
    inputs,
    bank: {
      weekdayBalance: WEEKDAY_BALANCE,
      saturdayBalance: SATURDAY_BALANCE,
      sundayBalance: SUNDAY_BALANCE,
      weeklyTotal: weeklyBankBalanceTotal,
      averageBankBalance,
    },
    mutualFund: {
      gross: periodic(mfGrossAnnual),
      net: periodic(mfNetAnnual),
      taxAnnual: mfTaxAnnual,
      netROI: mfNetROI,
    },
    bankResult: {
      gross: periodic(bankGrossAnnual),
      net: periodic(bankNetAnnual),
      taxAnnual: bankTaxAnnual,
      netROI: bankNetROI,
    },
    combined: {
      gross: periodic(combinedGrossAnnual),
      net: periodic(combinedNetAnnual),
      taxAnnual: combinedTaxAnnual,
      grossROI: combinedGrossROI,
      netROI: combinedNetROI,
      effectiveTaxRateOnGross: combinedEffectiveTaxRate,
    },
  };
}
