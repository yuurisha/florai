export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface GreenSpace {
  id: string;
  name: string;
  polygon: { lat: number; lng: number }[];
  coordinates: [number, number][];
  isActive: boolean;

  totalUploads: number;
  healthyUploads: number;
  healthIndex: number;

  lastPrediction?: string;
  lastConfidence?: number;
  lastStatus?: "Healthy" | "Diseased";
  photoUrl?: string | null;

  createdAt?: any;
  updatedAt?: any;
}
