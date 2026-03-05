import { GoogleGenAI } from "@google/genai";
import { logger } from './logger';
import { computeSHA256 } from '../utils/crypto';
import { PdfSection } from '../types';

// --- Types ---

export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metrics: {
    startTime: number;
    endTime: number;
    latency: number; // ms
  };
}

export interface IngestRequest {
  file: File;
  refId: string;
  title: string;
  category: string;
  value: string;
  userId: string;
  token: string;
}

export interface AnalysisRequest {
  file: File;
  onProgress?: (progress: number) => void;
  onLog?: (message: string) => void;
}

export interface PreBidRequest {
  tenderId: string;
  clauseId: string;
  clauseText: string;
  category: string;
  risk: string;
  citations: string[];
  tone: 'neutral' | 'advisory' | 'strict';
}

export interface BOMItemData {
  name: string;
  hs_code: string;
  quantity: number;
  unit_price_local: number;
  unit_price_import: number;
}

export interface L1CalculationResult {
  totalCost: number;
  totalLocal: number;
  totalImport: number;
  lcPercent: number;
  pWin: number;
  rec: string;
  maxImportIdx: number;
}

// --- Constants ---

const RISK_RULES = [
  {
    keywords: [/foreign/i, /outside india/i, /united states/i, /europe/i, /singapore/i],
    context: [/hosting/i, /data center/i, /cloud/i, /storage/i],
    level: 'CRITICAL',
    label: 'Data Residency Violation',
    citations: ['MeitY Cloud Guidelines', 'DPDP Act 2023 Sec 17']
  },
  {
    keywords: [/turnover/i, /revenue/i],
    context: [/500/i, /billion/i, /million dollar/i, /5000/i],
    level: 'HIGH',
    label: 'Restrictive Turnover Criteria',
    citations: ['GFR 2017 Rule 172', 'MSME Policy 2012']
  },
  {
    keywords: [/specific brand/i, /cisco/i, /hp/i, /dell/i, /oracle/i, /proprietary/i],
    context: [/must/i, /shall/i, /only/i, /mandatory/i],
    level: 'HIGH',
    label: 'Brand Favoritism (Restrictive)',
    citations: ['CVC Circular 03/01/18', 'GFR 2017 Rule 144(i)']
  },
  {
    keywords: [/payment/i, /advance/i],
    context: [/100%/i, /full/i, /prior/i],
    level: 'CRITICAL',
    label: 'Unsecured Advance Payment',
    citations: ['GFR 2017 Rule 172(1)']
  },
  {
    keywords: [/experience/i, /years/i],
    context: [/15 years/i, /20 years/i, /global/i],
    level: 'HIGH',
    label: 'Excessive Experience Req',
    citations: ['CVC Guidelines on Pre-Qualification']
  }
];

// --- Core Engine ---

class CoreProcessingEngine {
  
  // Helper: Retry Logic
  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries > 0) {
        logger.warn(`Operation failed, retrying... (${retries} attempts left)`, { error: err });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 1.5);
      }
      throw err;
    }
  }

  // Helper: Performance Wrapper
  private async measurePerformance<T>(operationName: string, fn: () => Promise<T>): Promise<ProcessingResult<T>> {
    const startTime = performance.now();
    try {
      const data = await fn();
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      logger.info(`Operation [${operationName}] completed`, { latency });
      
      return {
        success: true,
        data,
        metrics: { startTime, endTime, latency }
      };
    } catch (error: any) {
      const endTime = performance.now();
      const latency = endTime - startTime;
      logger.error(`Operation [${operationName}] failed`, { error: error.message, latency });
      
      return {
        success: false,
        error: error.message,
        metrics: { startTime, endTime, latency }
      };
    }
  }

  // 1. Ingest Processing
  async processIngest(req: IngestRequest): Promise<ProcessingResult<{ id: string; hash: string }>> {
    return this.measurePerformance('processIngest', async () => {
      return this.withRetry(async () => {
        // 1. Compute Hash
        const hash = await computeSHA256(req.file);
        
        // 2. Prepare Payload
        const payload = new FormData();
        payload.append('file', req.file);
        payload.append('reference_id', req.refId);
        payload.append('title', req.title);
        payload.append('category', req.category);
        payload.append('estimated_value', req.value);
        payload.append('client_sha256', hash);
        payload.append('uploader_user_id', req.userId);

        // 3. Attempt Upload (Mocked for now as per original code, but structured)
        // In a real scenario, this fetch would be real.
        // We simulate the fetch failure/success logic from the component.
        
        try {
           // Use relative path to avoid CORS/localhost issues in production
           const res = await fetch('/api/v1/tenders/ingest', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${req.token}` },
              body: payload
           });
           
           if (!res.ok) throw new Error('Backend Unreachable');
           const data = await res.json();
           return { id: data.id, hash };
        } catch (e) {
           // Fallback logic (Offline Mode)
           // We throw here to trigger retry, but if it's "Backend Unreachable", maybe we want to fallback immediately?
           // The requirement says "Add retry logic". 
           // If we want to support offline mode, we should catch the final error in the component or handle it here.
           // Let's assume we retry network requests. If they all fail, we return a specific error or handle offline in component.
           // However, the component logic had a specific fallback. 
           // Let's throw to let `withRetry` work, but if it fails ultimately, the component handles the error.
           throw e; 
        }
      });
    });
  }

  // 2. Analysis Processing
  async processAnalysis(req: AnalysisRequest): Promise<ProcessingResult<{ sections: PdfSection[]; riskScore: number; totalRisks: number }>> {
    return this.measurePerformance('processAnalysis', async () => {
      if (!(window as any).pdfjsLib) {
        throw new Error("PDF Engine not loaded");
      }

      const arrayBuffer = await req.file.arrayBuffer();
      const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      req.onLog?.(`PDF Loaded. Page Count: ${pdf.numPages}`);
      req.onLog?.("Initializing Optical Character Recognition (Text Layer)...");

      let fullClauses: PdfSection[] = [];
      let totalRisks = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        const chunks = pageText.match(/[^.!?]+[.!?]+/g) || [pageText];

        chunks.forEach((chunk: string, idx: number) => {
          if (chunk.length < 50) return;

          let riskLevel: 'CRITICAL' | 'HIGH' | 'LOW' | undefined;
          let isRisky = false;
          let activeCitations: string[] = [];
          let riskTitle = "";

          for (const rule of RISK_RULES) {
            const hasKeyword = rule.keywords.some(rx => rx.test(chunk));
            const hasContext = rule.context.some(rx => rx.test(chunk));

            if (hasKeyword && hasContext) {
              isRisky = true;
              riskLevel = rule.level as any;
              activeCitations = rule.citations;
              riskTitle = rule.label;
              totalRisks++;
              break;
            }
          }

          fullClauses.push({
            id: `cl-${i}-${idx}`,
            title: isRisky ? `Page ${i}: ${riskTitle}` : `Page ${i} - Clause ${idx + 1}`,
            text: chunk.trim(),
            page: i,
            risky: isRisky,
            riskLevel: riskLevel,
            citations: activeCitations
          });
        });

        if (req.onProgress) req.onProgress(Math.round((i / pdf.numPages) * 100));
        if (i % 2 === 0) req.onLog?.(`Processed Page ${i}...`);
      }

      if (fullClauses.length === 0) {
         req.onLog?.("Warning: No readable text found. Document might be scanned image.");
         fullClauses.push({
             id: 'err-1',
             title: 'Parsing Error',
             text: 'Could not extract text layer. Please use OCR-enabled PDF.',
             page: 1,
             risky: false
         });
      } else {
         req.onLog?.(`Analysis Complete. ${fullClauses.length} segments analyzed.`);
         req.onLog?.(`Found ${totalRisks} potential compliance risks.`);
      }

      const score = Math.min(100, totalRisks * 20);
      return { sections: fullClauses, riskScore: score, totalRisks };
    });
  }

  // 3. Pre-Bid Processing
  async processPreBid(req: PreBidRequest): Promise<ProcessingResult<string>> {
    return this.measurePerformance('processPreBid', async () => {
      return this.withRetry(async () => {
        const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || (import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
        if (!apiKey) throw new Error("API Key not found");
        const ai = new GoogleGenAI({ apiKey });
        const model = "gemini-3.1-pro-preview";
        
        const prompt = `
        You are a legal consultant for a government tender bidder in India.
        Task: Draft a formal Pre-Bid Query / Representation to the Tender Inviting Authority.
        
        Context:
        - Clause Text: "${req.clauseText}"
        - Issue Category: ${req.category}
        - Detected Risk: ${req.risk}
        - Relevant Citations: ${req.citations?.join(', ')}
        
        Tone Strategy: ${req.tone}
        
        Tone Definitions:
        - Neutral: Polite request for clarification. No accusations.
        - Advisory: Suggestive. "We respectfully submit that...". Point out conflict with guidelines.
        - Strict: Assertive. "This violates Rule X...". Demand rectification.
        
        Draft the query now. Keep it professional, concise, and ready to submit on the portal.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "Error generating content.";
      });
    });
  }

  // 4. L1 Calculation Processing
  async processL1Calculation(items: BOMItemData[]): Promise<ProcessingResult<L1CalculationResult>> {
    // This is synchronous but we wrap it to be consistent and allow for potential async expansion
    return this.measurePerformance('processL1Calculation', async () => {
        let tCost = 0;
        let tLocal = 0;
        let maxImportVal = 0;
        let maxImportIdx = -1;
    
        items.forEach((item, idx) => {
            const cost = item.quantity * (item.unit_price_local + item.unit_price_import);
            const local = item.quantity * item.unit_price_local;
            const importVal = item.quantity * item.unit_price_import;
            
            tCost += cost;
            tLocal += local;
    
            if (importVal > maxImportVal) {
                maxImportVal = importVal;
                maxImportIdx = idx;
            }
        });
    
        const lcPercent = tCost > 0 ? (tLocal / tCost) * 100 : 0;
        
        // Heuristic P-Win Logic
        let pWin = 30; // Base
        if (lcPercent >= 50) pWin = 95; // Class-I Preference
        else if (lcPercent >= 20) pWin = 60; // Class-II
        else pWin = 5; // Non-Local
    
        // Recommendation Engine
        let rec = "Optimization Complete.";
        if (lcPercent < 20) rec = "CRITICAL: Local Content < 20%. You are disqualified from MII tenders.";
        else if (lcPercent < 50) rec = "OPPORTUNITY: Reach 50% to gain Class-I Purchase Preference (L1+20% margin).";
        
        return { 
            totalCost: tCost, 
            totalLocal: tLocal, 
            totalImport: tCost - tLocal, 
            lcPercent,
            pWin,
            rec,
            maxImportIdx
        };
    });
  }
}

export const coreEngine = new CoreProcessingEngine();
