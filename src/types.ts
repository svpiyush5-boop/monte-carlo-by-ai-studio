export interface SimulationParams {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentSavings: number;
  monthlySavings: number;
  sipStepUp: number;
  expectedReturn: number;
  returnStdDevPre: number;
  postRetirementReturn: number;
  returnStdDevPost: number;
  monthlyExpenses: number;
  withdrawalInflation: number;
  numSimulations: number;
  taxDragPct: number;
  additionalLumpsum: number;
  lumpsumYear: number;
  partTimeIncome: number;
  partTimeUntilAge: number;
  clientName: string;
}

export interface Scenario {
  id?: string;
  uid: string;
  name: string;
  params: SimulationParams;
  createdAt: any;
}
