
export enum View {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  ANALYZER = 'analyzer',
  PREBID = 'prebid',
  CALCULATOR = 'calculator',
  VAULT = 'vault',
  ONBOARDING = 'onboarding'
}

export interface User {
  name: string;
  designation: string;
  clearanceLevel: string;
  organization: string;
}

export interface CalculatorItem {
  id: string;
  name: string;
  hsCode: string;
  importCost: number;
  localCost: number;
}