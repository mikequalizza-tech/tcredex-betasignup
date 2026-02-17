// Shared types for map components

export type CreditFilter =
  | "all"
  | "nmtc"
  | "htc"
  | "lihtc"
  | "oz"
  | "brownfield";

export interface MapDeal {
  id: string;
  projectName: string;
  location: string;
  parent: string;
  address: string;
  censusTract: string;
  povertyRate: number;
  medianIncome: number;
  unemployment: number;
  projectCost: number;
  fedNmtcReq?: number;
  stateNmtcReq?: number;
  htc?: number;
  lihtc?: number;
  oz?: number;
  shovelReady: boolean;
  completionDate: string;
  financingGap: number;
  coordinates?: [number, number]; // [lng, lat]
}
