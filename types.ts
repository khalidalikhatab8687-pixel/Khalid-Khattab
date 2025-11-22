export type AudioStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MessageLog {
  id: string;
  source: 'user' | 'model';
  text: string; // Transcription
  timestamp: Date;
}

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  status: AudioStatus;
}
