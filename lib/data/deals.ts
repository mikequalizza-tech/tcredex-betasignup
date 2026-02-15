export interface Deal {
  id: string;
  projectName: string;
  census_tract?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: [number, number];
  programs?: string[];
  programType: string;
  projectCost?: number;
  allocation: number;
  status?: string;
  tier?: number;
  sponsor_id?: string;
  organization_name?: string;
}
