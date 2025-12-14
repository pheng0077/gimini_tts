import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - JSZip imported via importmap
import JSZip from 'jszip';
import { useAuth } from '../contexts/AuthContext';
import { generateSpeech, fetchVoices } from '../services/gemini';
import { GEMINI_VOICES, MODELS, AudioItem, VoiceOption } from '../types';
import { HistoryItem } from '../components/HistoryItem';
import { SparklesIcon, PlayIcon, ArchiveBoxIcon } from '../components/Icons';
import { VoiceSelector } from '../components/VoiceSelector';

const STYLE_PRESETS = [
  { label: "News Anchor", value: "You are a professional news anchor. Speak clearly, calmly, and with authority." },
  { label: "Storyteller", value: "You are an engaging storyteller. Use a warm, expressive tone with pauses for effect." },
  { label: "Excited", value: "Speak with high energy and excitement, as if you just heard great news." },
  { label: "Whisper", value: "Speak in a soft, conspiratorial whisper." },
  { label: "Technical", value: "Speak in a precise, dry, and fast-paced technical manner." },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, getActiveApiKey } = useAuth();

  const [text, setText] = useState('Welcome to the future of speech synthesis. How can I help you today?');
  const [label, setLabel] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');

  // Voice State
  const [voices, setVoices] = useState<VoiceOption[]>(GEMINI_VOICES);
  const [selectedVoice, setSelectedVoice] = useState(GEMINI_VOICES[2].id); // Default to Kore (Female)
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);

  // Use a single list for queue and history
  const [items, setItems] = useState<AudioItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // User API Key state
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Load voices and API key on mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const fetched = await fetchVoices();
        setVoices(fetched);
      } catch (e) {
        console.error("Failed to load voices", e);
      } finally {
        setIsLoadingVoices(false);
      }
    };
    loadVoices();
  }, []);

  // Load user API key
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await getActiveApiKey();
        if (key) {
          setUserApiKey(key);
          setApiKeyError(null);
        } else {
          setApiKeyError('No API key configured. Please add one in Settings.');
        }
      } catch (error) {
        console.error('Error loading API key:', error);
        setApiKeyError('Failed to load API key.');
      }
    };
    loadApiKey();
  }, [getActiveApiKey]);

  // Queue Processing Effect
  useEffect(() => {
    const processQueue = async () => {
      if (!isProcessing) return;

      // Find the next pending item
      const nextItem = items.find(i => i.status === 'PENDING');

      if (!nextItem) {
        setIsProcessing(false);
        return;
      }

      // Update status to GENERATING
      setItems(prev => prev.map(i => i.id === nextItem.id ? { ...i, status: 'GENERATING' } : i));

      try {
        if (!userApiKey) {
          throw new Error('No API key configured');
        }
        const wavBlob = await generateSpeech({
          text: nextItem.text,
          voice: nextItem.voice,
          model: nextItem.model,
          systemInstruction: nextItem.systemInstruction,
          apiKey: userApiKey
        });

        const url = URL.createObjectURL(wavBlob);

        // Update status to SUCCESS
        setItems(prev => prev.map(i => i.id === nextItem.id ? {
          ...i,
          status: 'SUCCESS',
          audioUrl: url
        } : i));

      } catch (err: any) {
        console.error("Generation error for item", nextItem.id, err);
        // Update status to ERROR
        setItems(prev => prev.map(i => i.id === nextItem.id ? {
          ...i,
          status: 'ERROR',
          error: err.message || "Failed to generate"
        } : i));
      }

      // Continue processing (the effect will trigger again because items changed)
    };

    if (isProcessing) {
      processQueue();
    }
  }, [items, isProcessing]);

  const handleAddToQueue = () => {
    if (!text.trim()) return;

    // Auto-generate label if empty (01, 02, 03...)
    const itemLabel = label.trim() || (items.length + 1).toString().padStart(2, '0');

    const newItem: AudioItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      label: itemLabel,
      systemInstruction: systemInstruction.trim() || undefined,
      createdAt: Date.now(),
      voice: selectedVoice,
      model: selectedModel,
      status: 'PENDING'
    };

    setItems(prev => [newItem, ...prev]);
    setText(''); // Clear input after adding
    setLabel(''); // Clear label
  };

  const handleGenerateSingle = async (id: string) => {
    // Find the item
    const itemToProcess = items.find(i => i.id === id);
    if (!itemToProcess) return;

    // Immediately set to generating
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'GENERATING' } : i));

    try {
      if (!userApiKey) {
        throw new Error('No API key configured');
      }
      const wavBlob = await generateSpeech({
        text: itemToProcess.text,
        voice: itemToProcess.voice,
        model: itemToProcess.model,
        systemInstruction: itemToProcess.systemInstruction,
        apiKey: userApiKey
      });

      const url = URL.createObjectURL(wavBlob);

      setItems(prev => prev.map(i => i.id === id ? {
        ...i,
        status: 'SUCCESS',
        audioUrl: url
      } : i));

    } catch (err: any) {
      console.error("Single generation error", id, err);
      setItems(prev => prev.map(i => i.id === id ? {
        ...i,
        status: 'ERROR',
        error: err.message || "Failed"
      } : i));
    }
  };

  const handleDownloadAll = async () => {
    const successItems = items.filter(i => i.status === 'SUCCESS' && i.audioUrl);
    if (successItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("audio_files");

      await Promise.all(successItems.map(async (item) => {
        if (!item.audioUrl) return;
        try {
          const response = await fetch(item.audioUrl);
          const blob = await response.blob();
          const safeLabel = item.label || item.id.slice(0, 8);
          const safeText = item.text.slice(0, 20).replace(/[^a-z0-9]/gi, '_');
          const fileName = `${safeLabel}_${safeText}.wav`;
          folder.file(fileName, blob);
        } catch (e) {
          console.error("Failed to fetch blob for zip", e);
        }
      }));

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);

      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini_tts_export_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error creating zip", e);
    } finally {
      setIsZipping(false);
    }
  };

  const startQueue = () => {
    setIsProcessing(true);
  };

  const handleDelete = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item && item.audioUrl) {
        URL.revokeObjectURL(item.audioUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
      });
    };
  }, []);

  const pendingCount = items.filter(i => i.status === 'PENDING').length;
  const successCount = items.filter(i => i.status === 'SUCCESS').length;

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=6366f1&color=fff`;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent inline-flex items-center gap-2">
            Gemini 2.5 TTS Studio
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">Professional Text-to-Speech Engine with Style Control</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            title="Settings"
          >
            <img
              src={getUserAvatar()}
              alt={getUserDisplayName()}
              className="w-6 h-6 rounded-full border border-zinc-600"
            />
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-500 px-3 py-1 rounded-full">v1.3.0</span>
        </div>
      </header>

      {/* API Key Warning */}
      {apiKeyError && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-yellow-400 font-medium">{apiKeyError}</p>
            <button
              onClick={() => navigate('/settings')}
              className="mt-2 text-sm text-yellow-300 hover:text-yellow-200 underline"
            >
              Go to Settings →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Panel: Configuration & Input (Larger Area) */}
        <div className="lg:col-span-8 space-y-6">

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl h-full flex flex-col">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Model Version</label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                  >
                    {MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>

              {/* Voice Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Voice Selection</label>
                <VoiceSelector
                  voices={voices}
                  selectedVoiceId={selectedVoice}
                  onSelect={setSelectedVoice}
                  isLoading={isLoadingVoices}
                  userApiKey={userApiKey}
                />
              </div>
            </div>

            {/* System Instruction */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">System Instructions</label>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setSystemInstruction(preset.value)}
                    className="text-[10px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition text-zinc-300"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setSystemInstruction('')}
                  className="text-[10px] px-2 py-1 rounded bg-zinc-900/50 border border-zinc-800/50 hover:bg-red-900/20 hover:text-red-400 transition text-zinc-500 ml-auto"
                >
                  Clear
                </button>
              </div>

              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full h-20 bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono"
                placeholder="e.g. You are a helpful assistant. Speak quickly and energetically."
              />
            </div>

            {/* Text Input - MADE LARGER */}
            <div className="mb-6 flex-grow flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Input Text</label>

                {/* Label Input */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Label:</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={`Auto: ${(items.length + 1).toString().padStart(2, '0')}`}
                    className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:border-indigo-500 outline-none w-24 text-center font-mono placeholder-zinc-700"
                  />
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-96 bg-zinc-950 border border-zinc-700 rounded-lg p-6 text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-lg leading-relaxed flex-grow"
                placeholder="Type the text you want to convert to speech..."
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-zinc-500">{text.length} characters</span>
                <button
                  onClick={() => setText('')}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Clear Text
                </button>
              </div>
            </div>

            {/* Add to Queue Button */}
            <button
              onClick={handleAddToQueue}
              disabled={!text.trim()}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              <span className="text-xl">+</span> Add to Queue
            </button>

          </div>
        </div>

        {/* Right Panel: Audio Queue */}
        <div className="lg:col-span-4">
          <div className="sticky top-8 flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between mb-4 bg-zinc-950 pb-2 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-200">Audio Queue</h2>
                <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">{items.length}</span>
              </div>

              {pendingCount > 0 && (
                <button
                  onClick={startQueue}
                  disabled={isProcessing}
                  className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-medium transition-all ${isProcessing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/20'
                    }`}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <><PlayIcon /> Process Queue ({pendingCount})</>
                  )}
                </button>
              )}
            </div>

            {/* Queue List - grows to fill available space */}
            <div className="flex-grow overflow-y-auto p-2 mb-4 custom-scrollbar bg-zinc-950/20 rounded-xl">
              {items.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 bg-zinc-900/30 h-full flex flex-col items-center justify-center min-h-[200px]">
                  <SparklesIcon />
                  <p className="mt-4 font-medium text-zinc-400">Queue is empty</p>
                  <p className="text-sm mt-1">Add text to the queue to start generating.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map(item => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onGenerate={handleGenerateSingle}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Download All Footer */}
            <div className="shrink-0 pt-2 border-t border-zinc-800/50">
              <button
                onClick={handleDownloadAll}
                disabled={successCount === 0 || isZipping}
                className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 flex items-center justify-center gap-2 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <ArchiveBoxIcon />
                {isZipping ? "Compressing..." : `Download All (${successCount})`}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Global CSS for spinner animation if needed */}
      <style>{`
        @keyframes progress-indeterminate {
          0% { margin-left: -50%; width: 50%; }
          100% { margin-left: 100%; width: 50%; }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}