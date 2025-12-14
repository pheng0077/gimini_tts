import React, { useRef, useState, useEffect } from 'react';
import { AudioItem } from '../types';
import { PlayIcon, PauseIcon, TrashIcon, DownloadIcon, SparklesIcon, BoltIcon, ArrowPathIcon } from './Icons';

interface HistoryItemProps {
  item: AudioItem;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
}

// Helper to parse error messages into user-friendly text
const parseErrorMessage = (error: string): string => {
  // Check for rate limit / quota errors
  if (error.includes('429') || error.toLowerCase().includes('quota') || error.toLowerCase().includes('rate limit') || error.includes('RESOURCE_EXHAUSTED')) {
    return '⚠️ Rate limit reached. Please wait 60 seconds and try again.';
  }

  // Check for API key errors
  if (error.toLowerCase().includes('api key') || error.toLowerCase().includes('authentication')) {
    return '🔑 API key issue. Please check your settings.';
  }

  // Check for model errors
  if (error.includes('404') || error.toLowerCase().includes('not found')) {
    return '❌ Model not available. Try a different model.';
  }

  // Check for audio generation errors
  if (error.toLowerCase().includes('audio') || error.toLowerCase().includes('modality')) {
    return '🎵 Audio generation failed. Model may not support TTS.';
  }

  // Generic network error
  if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
    return '🌐 Network error. Check your connection.';
  }

  // If error is too long (likely JSON), show generic message
  if (error.length > 100) {
    return '❌ Generation failed. Please retry.';
  }

  // Return original error if it's short and readable
  return error;
};

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete, onGenerate }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [item.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    if (!item.audioUrl) return;
    const a = document.createElement('a');
    a.href = item.audioUrl;
    a.download = `gemini-tts-${item.label || item.id.slice(0, 8)}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatModelName = (modelId: string) => {
    return modelId
      .replace('gemini-', '')
      .replace('-preview', '')
      .replace('-tts', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letters
  };

  const isPending = item.status === 'PENDING';
  const isGenerating = item.status === 'GENERATING';
  const isError = item.status === 'ERROR';
  const isSuccess = item.status === 'SUCCESS';

  return (
    <div className={`border rounded-xl p-4 transition relative overflow-hidden ${isGenerating ? 'bg-zinc-900/50 border-indigo-500/50' :
      isError ? 'bg-red-950/10 border-red-900/30' :
        'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      }`}>
      {/* Background Progress Bar for Generating state */}
      {isGenerating && (
        <div className="absolute top-0 left-0 h-1 bg-indigo-500/30 w-full overflow-hidden">
          <div className="h-full bg-indigo-500 animate-progress-indeterminate"></div>
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="w-full mr-2">
          {/* Label Display */}
          {item.label && (
            <div className="inline-block mb-1.5">
              <span className="text-[10px] font-mono font-bold text-zinc-300 bg-zinc-800/80 border border-zinc-700 px-1.5 py-0.5 rounded">
                {item.label}
              </span>
            </div>
          )}

          <p className="text-zinc-100 font-medium text-sm line-clamp-2">{item.text}</p>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500 mt-1 mb-2">
            <span className="bg-zinc-800 px-1.5 py-0.5 rounded capitalize">{item.voice}</span>
            <span className="bg-zinc-800 px-1.5 py-0.5 rounded">{formatModelName(item.model)}</span>

            {isPending && <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">Queue</span>}
            {isGenerating && <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 animate-pulse">Generating...</span>}
            {isError && <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Failed</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 shrink-0">
          {isSuccess && (
            <button
              onClick={handleDownload}
              className="p-2 text-zinc-600 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition"
              title="Download WAV"
              aria-label="Download"
            >
              <DownloadIcon />
            </button>
          )}

          {/* Re-generate Button (Success State) */}
          {isSuccess && !isGenerating && (
            <button
              onClick={() => onGenerate(item.id)}
              className="p-2 text-zinc-600 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition"
              title="Re-generate"
              aria-label="Re-generate"
            >
              <ArrowPathIcon />
            </button>
          )}

          {/* Manual Generate Button (Pending/Error State) */}
          {!isSuccess && !isGenerating && (
            <button
              onClick={() => onGenerate(item.id)}
              className="p-2 text-zinc-600 hover:text-green-400 hover:bg-zinc-800 rounded-lg transition"
              title="Generate Now"
              aria-label="Generate Now"
            >
              <BoltIcon />
            </button>
          )}

          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
            title="Delete"
            aria-label="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {isSuccess ? (
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition shadow-lg shadow-indigo-500/20 shrink-0"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <audio ref={audioRef} src={item.audioUrl} className="hidden" />
        </div>
      ) : (
        <div className="h-10 flex items-center justify-center bg-zinc-950/30 rounded-lg border border-zinc-800/50 text-xs text-zinc-500">
          {isPending && "Waiting for generation..."}
          {isGenerating && "Synthesizing audio..."}
          {isError && (
            <span className="text-red-400 flex items-center gap-2">
              {parseErrorMessage(item.error || 'Generation failed')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};