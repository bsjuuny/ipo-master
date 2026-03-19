export interface IPO {
  id: string;
  companyName: string;
  code?: string;
  sector?: string;
  
  // Schedule
  subscriptionStart: string;
  subscriptionEnd: string;
  refundDate: string;
  listingDate: string;
  
  // Offering Details
  offeringPrice: number;
  priceBandLow?: number;
  priceBandHigh?: number;
  totalOfferingAmount?: number;
  
  // Demand Prediction
  institutionalCompetition?: string;
  lockupRatio?: string;
  
  // Real-time Competition (from Finuts)
  competitionData?: BrokerCompetition[];
  totalCompetition?: string;
  
  // Detail Info
  underwriter?: string;
  ceo?: string;
  headOffice?: string;
  majorShareholder?: string;
  sales?: string;
  netIncome?: string;
  
  // Analysis
  investmentPoints?: string[];
  riskFactors?: string[];
  aiVerdict?: string;
  
  // Status
  status: 'upcoming' | 'active' | 'closed' | 'listed';
  
  // Meta
  updatedAt: string;
}

export interface BrokerCompetition {
  brokerName: string;
  competitionRate: string;
  allocatedShares?: number;
  equalAllocation?: string;
  proportionalAllocation?: string;
  minSubscriptionAmount?: number;
}

export interface IPOHistory {
  companyName: string;
  listingDate: string;
  offeringPrice: number;
  openingPrice: number;
  closingPrice: number;
  openingReturn: number;
  closingReturn: number;
}
