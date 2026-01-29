export interface PredictionSummary {
  predictionID: string;
  latitude: number;
  longitude: number;
  temperature: number;
  rainfall: string;
  humidity: number;
  date: string;
  predictedSpread: number;
  predictedRisk: "low" | "medium" | "high";
}