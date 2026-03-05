
export enum View {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  INGEST = 'ingest',
  ANALYZER = 'analyzer',
  PREBID = 'prebid',
  CALCULATOR = 'calculator',
  VAULT = 'vault',
  ONBOARDING = 'onboarding',
  LEGAL_QUEUE = 'legal_queue'
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

// Definition for extracted section (Moved from Analyzer.tsx to share state)
export interface PdfSection {
  id: string;
  title: string;
  text: string;
  page: number;
  risky?: boolean;
  riskLevel?: 'CRITICAL' | 'HIGH' | 'LOW';
  citations?: string[];
}

// State container for Analyzer persistence
export interface AnalyzerState {
  file: File | null;
  extractedSections: PdfSection[];
  riskScore: number;
  logs: string[];
  scanComplete: boolean;
}

// Shared Tender Data Structure
export interface Tender {
  id: string;
  ref: string;
  title: string;
  due: string;
  value: string; // Display string
  valueNum: number; // For filtering
  tag: string;
  tagColor: string;
  risk?: boolean;
  category: 'Goods' | 'Services' | 'Works';
  state: string;
  isVerified: boolean;
  location: { lat: number; lng: number };
  pwin: number;
}
