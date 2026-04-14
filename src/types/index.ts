export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isProcessing?: boolean;
  metrics?: RetrievalMetrics;
}

export interface ProcessStep {
  id: string;
  title: string;
  icon: string;
  status: 'pending' | 'active' | 'complete';
  data?: any;
  timestamp?: string;
}

export interface RagEvent {
  type: string;
  step: number;
  totalSteps: number;
  data: any;
  timestamp: string;
}

export interface Chunk {
  index: number;
  preview: string;
  length: number;
  distance?: number;
  score?: number;
  source?: string;
}

export interface RetrievalMetrics {
  totalRetrieved: number;
  afterFiltering: number;
  afterReranking: number;
  finalChunks: number;
  avgDistance: number;
  minDistance: number;
  maxDistance: number;
  contextTokens: number;
  contextChars: number;
  cacheHit: boolean;
}
