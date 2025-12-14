export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Neutral';
  languageCode?: string;
  category?: 'Gemini' | 'Journey' | 'Studio' | 'Neural2' | 'WaveNet' | 'Standard';
  tags?: string[];
  description?: string;
  pitch?: string; // New field for UI matching
}

export interface ModelOption {
  id: string;
  label: string;
  description: string;
}

export type ItemStatus = 'PENDING' | 'GENERATING' | 'SUCCESS' | 'ERROR';

export interface AudioItem {
  id: string;
  text: string;
  systemInstruction?: string;
  voice: string;
  model: string;
  status: ItemStatus;
  audioUrl?: string; // Optional because it might not be generated yet
  createdAt: number;
  duration?: number;
  error?: string;
  label?: string;
}

export enum TTSStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

// Full list of 30 Supported Gemini Voices with AI Studio-style descriptions
export const GEMINI_VOICES: VoiceOption[] = [
  // --- Original / Common (Matched to Screenshot) ---
  { 
    id: 'Zephyr', 
    name: 'Zephyr', 
    gender: 'Female', 
    category: 'Gemini',
    tags: ['Bright'],
    pitch: 'Higher pitch',
    description: 'Bright, Higher pitch'
  },
  { 
    id: 'Puck', 
    name: 'Puck', 
    gender: 'Male', 
    category: 'Gemini',
    tags: ['Upbeat'],
    pitch: 'Middle pitch',
    description: 'Upbeat, Middle pitch'
  },
  { 
    id: 'Charon', 
    name: 'Charon', 
    gender: 'Male', 
    category: 'Gemini',
    tags: ['Informative'],
    pitch: 'Lower pitch',
    description: 'Informative, Lower pitch'
  },
  { 
    id: 'Kore', 
    name: 'Kore', 
    gender: 'Female', 
    category: 'Gemini',
    tags: ['Firm'],
    pitch: 'Middle pitch',
    description: 'Firm, Middle pitch'
  },
  { 
    id: 'Fenrir', 
    name: 'Fenrir', 
    gender: 'Male', 
    category: 'Gemini',
    tags: ['Excitable'],
    pitch: 'Lower middle',
    description: 'Excitable, Lower middle'
  },
  
  // --- A-M (Approximated to match style) ---
  { id: 'Aoede', name: 'Aoede', gender: 'Female', category: 'Gemini', tags: ['Breezy'], pitch: 'Higher pitch', description: 'Breezy, Higher pitch' },
  { id: 'Achernar', name: 'Achernar', gender: 'Male', category: 'Gemini', tags: ['Soft'], pitch: 'Middle pitch', description: 'Soft, Middle pitch' },
  { id: 'Achird', name: 'Achird', gender: 'Female', category: 'Gemini', tags: ['Friendly'], pitch: 'Higher pitch', description: 'Friendly, Higher pitch' },
  { id: 'Algieba', name: 'Algieba', gender: 'Female', category: 'Gemini', tags: ['Smooth'], pitch: 'Middle pitch', description: 'Smooth, Middle pitch' },
  { id: 'Algenib', name: 'Algenib', gender: 'Male', category: 'Gemini', tags: ['Gravelly'], pitch: 'Lower pitch', description: 'Gravelly, Lower pitch' },
  { id: 'Alnilam', name: 'Alnilam', gender: 'Male', category: 'Gemini', tags: ['Firm'], pitch: 'Lower pitch', description: 'Firm, Lower pitch' },
  { id: 'Autonoe', name: 'Autonoe', gender: 'Female', category: 'Gemini', tags: ['Bright'], pitch: 'Higher pitch', description: 'Bright, Higher pitch' },
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'Female', category: 'Gemini', tags: ['Easy-going'], pitch: 'Middle pitch', description: 'Easy-going, Middle pitch' },
  { id: 'Despina', name: 'Despina', gender: 'Female', category: 'Gemini', tags: ['Smooth'], pitch: 'Middle pitch', description: 'Smooth, Middle pitch' },
  { id: 'Enceladus', name: 'Enceladus', gender: 'Male', category: 'Gemini', tags: ['Breathy'], pitch: 'Middle pitch', description: 'Breathy, Middle pitch' },
  { id: 'Erinome', name: 'Erinome', gender: 'Female', category: 'Gemini', tags: ['Clear'], pitch: 'Middle pitch', description: 'Clear, Middle pitch' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'Male', category: 'Gemini', tags: ['Mature'], pitch: 'Lower pitch', description: 'Mature, Lower pitch' },
  { id: 'Iapetus', name: 'Iapetus', gender: 'Male', category: 'Gemini', tags: ['Clear'], pitch: 'Lower middle', description: 'Clear, Lower middle' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'Female', category: 'Gemini', tags: ['Upbeat'], pitch: 'Higher pitch', description: 'Upbeat, Higher pitch' },
  { id: 'Leda', name: 'Leda', gender: 'Female', category: 'Gemini', tags: ['Youthful'], pitch: 'Higher pitch', description: 'Youthful, Higher pitch' },
  
  // --- O-Z ---
  { id: 'Orus', name: 'Orus', gender: 'Male', category: 'Gemini', tags: ['Firm'], pitch: 'Lower pitch', description: 'Firm, Lower pitch' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'Female', category: 'Gemini', tags: ['Forward'], pitch: 'Middle pitch', description: 'Forward, Middle pitch' },
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'Male', category: 'Gemini', tags: ['Informative'], pitch: 'Lower pitch', description: 'Informative, Lower pitch' },
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'Female', category: 'Gemini', tags: ['Lively'], pitch: 'Higher pitch', description: 'Lively, Higher pitch' },
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'Male', category: 'Gemini', tags: ['Knowledgeable'], pitch: 'Lower pitch', description: 'Knowledgeable, Lower pitch' },
  { id: 'Schedar', name: 'Schedar', gender: 'Male', category: 'Gemini', tags: ['Even'], pitch: 'Middle pitch', description: 'Even, Middle pitch' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'Female', category: 'Gemini', tags: ['Warm'], pitch: 'Middle pitch', description: 'Warm, Middle pitch' },
  { id: 'Umbriel', name: 'Umbriel', gender: 'Male', category: 'Gemini', tags: ['Easy-going'], pitch: 'Middle pitch', description: 'Easy-going, Middle pitch' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'Female', category: 'Gemini', tags: ['Gentle'], pitch: 'Higher pitch', description: 'Gentle, Higher pitch' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'Male', category: 'Gemini', tags: ['Casual'], pitch: 'Lower middle', description: 'Casual, Lower middle' },
];

// Available Models
export const MODELS: ModelOption[] = [
  { 
    id: 'gemini-2.5-flash-preview-tts', 
    label: 'Gemini 2.5 Flash TTS (Preview)', 
    description: 'Standard fast model for text-to-speech tasks.' 
  },
  { 
    id: 'gemini-2.5-pro-preview-tts', 
    label: 'Gemini 2.5 Pro TTS (Preview)', 
    description: 'Higher quality reasoning and intonation (Experimental).' 
  }
];