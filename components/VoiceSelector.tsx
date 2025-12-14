import React, { useState, useMemo, useRef, useEffect } from 'react';
import { VoiceOption } from '../types';
import { SearchIcon, ChevronDownIcon, PlayIcon, PauseIcon } from './Icons';
import { generateSpeech } from '../services/gemini';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
  isLoading: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedVoiceId, onSelect, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Audio Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Stop audio if dropdown closes? Optional. Keeping it playing is fine.
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedVoice = voices.find(v => v.id === selectedVoiceId) || voices[0];

  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const term = search.toLowerCase();
      return voice.name.toLowerCase().includes(term) || 
             voice.tags?.some(tag => tag.toLowerCase().includes(term));
    });
  }, [voices, search]);

  const handlePreview = async (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation(); // Prevent selection when clicking play

    // If currently playing this voice, pause it
    if (playingVoiceId === voice.id) {
        audioRef.current?.pause();
        setPlayingVoiceId(null);
        return;
    }

    // If playing another voice, stop it
    if (audioRef.current) {
        audioRef.current.pause();
        setPlayingVoiceId(null);
    }

    setLoadingVoiceId(voice.id);

    try {
        // We use Flash model for fast previews
        const wavBlob = await generateSpeech({
            text: `Hello, my name is ${voice.name}.`,
            voice: voice.name,
            model: 'gemini-2.5-flash-preview-tts' 
        });

        const url = URL.createObjectURL(wavBlob);
        
        if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
            setPlayingVoiceId(voice.id);
            setPreviewUrl(url); // Keep track to revoke later if needed
            
            audioRef.current.onended = () => {
                setPlayingVoiceId(null);
            };
        } else {
             // Create audio element if it doesn't exist (shouldn't happen with ref)
             const audio = new Audio(url);
             audioRef.current = audio;
             audio.play();
             setPlayingVoiceId(voice.id);
             audio.onended = () => setPlayingVoiceId(null);
        }

    } catch (err) {
        console.error("Failed to preview voice", err);
    } finally {
        setLoadingVoiceId(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden Audio Element for Previews */}
      <audio ref={audioRef} className="hidden" />

      {/* Trigger Button - AI Studio Style (Input Box look) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex items-center justify-between group hover:border-zinc-600 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
             <span className="text-zinc-500">
                <IconWaveform />
             </span>
             <span className="font-medium">{selectedVoice?.name}</span>
        </div>
        <div className="text-zinc-500 ml-2 shrink-0">
            <ChevronDownIcon />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[400px]">
           {/* Sticky Search Header */}
           <div className="p-2 border-b border-[#3c3c3c] bg-[#1e1e1e] sticky top-0 z-10">
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-zinc-500">
                      <SearchIcon />
                  </div>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Search voices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#2d2d2d] border-none rounded-md pl-8 pr-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
              </div>
           </div>

           {/* Voice List */}
           <div ref={listRef} className="overflow-y-auto flex-1 custom-scrollbar">
               {filteredVoices.map(voice => {
                   const isSelected = voice.id === selectedVoiceId;
                   const isPlaying = playingVoiceId === voice.id;
                   const isLoading = loadingVoiceId === voice.id;

                   return (
                       <div 
                            key={voice.id}
                            onClick={() => { onSelect(voice.id); setIsOpen(false); }}
                            className={`flex items-center p-3 cursor-pointer transition-colors border-l-2 ${
                                isSelected 
                                ? 'bg-[#333333] border-indigo-500' 
                                : 'bg-transparent border-transparent hover:bg-[#2d2d2d]'
                            }`}
                       >
                           {/* Play Button Area */}
                           <button
                                onClick={(e) => handlePreview(e, voice)}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mr-3 transition-all ${
                                    isPlaying 
                                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                                    : 'bg-transparent border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200'
                                }`}
                           >
                               {isLoading ? (
                                   <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                               ) : isPlaying ? (
                                   <PauseIconSmall />
                               ) : (
                                   <PlayIconSmall />
                               )}
                           </button>

                           {/* Text Info */}
                           <div className="flex flex-col">
                               <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                                   {voice.name}
                               </span>
                               <span className="text-xs text-zinc-400">
                                   {voice.description}
                               </span>
                           </div>
                       </div>
                   );
               })}

               {filteredVoices.length === 0 && (
                   <div className="text-center py-6 text-zinc-500 text-sm">
                       No results
                   </div>
               )}
           </div>
        </div>
      )}
    </div>
  );
};

// Icons specific to this component style
const IconWaveform = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18M8 8v8M16 8v8M4 11v2M20 11v2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const PlayIconSmall = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIconSmall = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);
