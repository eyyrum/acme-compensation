/**
 * Reference data is hand-written rather than generated: these are real
 * currencies and real approximate rates, and the country/currency pairing
 * has to be correct for the multi-currency analytics to mean anything.
 *
 * Rates are indicative, captured as a single current snapshot (ADR-004).
 */

export interface CurrencySeed {
  code: string;
  name: string;
  minorUnits: number;
  rateToUsd: number;
}

export const CURRENCIES: CurrencySeed[] = [
  { code: 'USD', name: 'US Dollar', minorUnits: 2, rateToUsd: 1.0 },
  { code: 'EUR', name: 'Euro', minorUnits: 2, rateToUsd: 1.08 },
  { code: 'GBP', name: 'Pound Sterling', minorUnits: 2, rateToUsd: 1.27 },
  { code: 'INR', name: 'Indian Rupee', minorUnits: 2, rateToUsd: 0.012 },
  { code: 'SGD', name: 'Singapore Dollar', minorUnits: 2, rateToUsd: 0.74 },
  { code: 'AUD', name: 'Australian Dollar', minorUnits: 2, rateToUsd: 0.65 },
  { code: 'CAD', name: 'Canadian Dollar', minorUnits: 2, rateToUsd: 0.73 },
  { code: 'BRL', name: 'Brazilian Real', minorUnits: 2, rateToUsd: 0.18 },
  { code: 'PLN', name: 'Polish Zloty', minorUnits: 2, rateToUsd: 0.25 },
  { code: 'JPY', name: 'Japanese Yen', minorUnits: 0, rateToUsd: 0.0064 },
];

export interface CountrySeed {
  code: string;
  name: string;
  currencyCode: string;
  /** Share of total headcount. Must sum to 1. */
  headcountWeight: number;
  /**
   * Cost-of-labour multiplier against the US baseline, applied to the
   * USD-equivalent salary before conversion to local currency.
   */
  marketFactor: number;
}

export const COUNTRIES: CountrySeed[] = [
  { code: 'US', name: 'United States',  currencyCode: 'USD', headcountWeight: 0.30, marketFactor: 1.00 },
  { code: 'IN', name: 'India',          currencyCode: 'INR', headcountWeight: 0.28, marketFactor: 0.32 },
  { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', headcountWeight: 0.10, marketFactor: 0.78 },
  { code: 'DE', name: 'Germany',        currencyCode: 'EUR', headcountWeight: 0.08, marketFactor: 0.80 },
  { code: 'PL', name: 'Poland',         currencyCode: 'PLN', headcountWeight: 0.06, marketFactor: 0.45 },
  { code: 'SG', name: 'Singapore',      currencyCode: 'SGD', headcountWeight: 0.05, marketFactor: 0.85 },
  { code: 'CA', name: 'Canada',         currencyCode: 'CAD', headcountWeight: 0.05, marketFactor: 0.82 },
  { code: 'AU', name: 'Australia',      currencyCode: 'AUD', headcountWeight: 0.04, marketFactor: 0.86 },
  { code: 'BR', name: 'Brazil',         currencyCode: 'BRL', headcountWeight: 0.03, marketFactor: 0.38 },
  { code: 'JP', name: 'Japan',          currencyCode: 'JPY', headcountWeight: 0.01, marketFactor: 0.75 },
];

export interface DepartmentSeed {
  name: string;
  headcountWeight: number;
  /** Median USD base for this department at the US baseline. */
  medianUsd: number;
  titles: string[];
}

export const DEPARTMENTS: DepartmentSeed[] = [
  {
    name: 'Engineering',
    headcountWeight: 0.34,
    medianUsd: 145_000,
    titles: [
      'Software Engineer I', 'Software Engineer II', 'Senior Software Engineer',
      'Staff Engineer', 'Principal Engineer', 'Engineering Manager',
      'Site Reliability Engineer', 'QA Engineer', 'Data Engineer',
    ],
  },
  {
    name: 'Sales',
    headcountWeight: 0.16,
    medianUsd: 110_000,
    titles: [
      'Sales Development Rep', 'Account Executive', 'Senior Account Executive',
      'Enterprise Account Executive', 'Sales Manager', 'Regional Sales Director',
    ],
  },
  {
    name: 'Customer Support',
    headcountWeight: 0.14,
    medianUsd: 62_000,
    titles: [
      'Support Specialist', 'Senior Support Specialist',
      'Technical Support Engineer', 'Support Team Lead', 'Support Manager',
    ],
  },
  {
    name: 'Marketing',
    headcountWeight: 0.09,
    medianUsd: 95_000,
    titles: [
      'Marketing Associate', 'Content Strategist', 'Product Marketing Manager',
      'Demand Generation Manager', 'Brand Manager', 'Marketing Director',
    ],
  },
  {
    name: 'Product',
    headcountWeight: 0.07,
    medianUsd: 135_000,
    titles: [
      'Associate Product Manager', 'Product Manager', 'Senior Product Manager',
      'Group Product Manager', 'Director of Product',
    ],
  },
  {
    name: 'Operations',
    headcountWeight: 0.07,
    medianUsd: 85_000,
    titles: [
      'Operations Analyst', 'Operations Manager', 'Business Analyst',
      'Program Manager', 'Director of Operations',
    ],
  },
  {
    name: 'Finance',
    headcountWeight: 0.05,
    medianUsd: 105_000,
    titles: [
      'Financial Analyst', 'Senior Financial Analyst', 'Accountant',
      'Controller', 'Finance Manager', 'Director of Finance',
    ],
  },
  {
    name: 'People',
    headcountWeight: 0.04,
    medianUsd: 88_000,
    titles: [
      'People Operations Associate', 'Recruiter', 'Senior Recruiter',
      'HR Business Partner', 'People Operations Manager',
    ],
  },
  {
    name: 'Design',
    headcountWeight: 0.03,
    medianUsd: 120_000,
    titles: [
      'Product Designer', 'Senior Product Designer', 'UX Researcher',
      'Design Lead', 'Director of Design',
    ],
  },
  {
    name: 'Legal',
    headcountWeight: 0.01,
    medianUsd: 155_000,
    titles: ['Legal Counsel', 'Senior Legal Counsel', 'Compliance Manager', 'General Counsel'],
  },
];