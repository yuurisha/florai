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
  diseasedUploads?: number;
  healthIndex: number | null;
  totalUploads5?: number;
  healthyUploads5?: number;
  diseasedUploads5?: number;
  healthIndex5?: number | null;

  lastPrediction?: string;
  lastConfidence?: number;
  lastStatus?: "Healthy" | "Diseased";
  photoUrl?: string | null;

  createdAt?: any;
  updatedAt?: any;
}
