
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, AlertCircle, Power, Settings } from 'lucide-react';
import MuseumStatue from './MuseumStatue';
import { AudioStatus, MessageLog } from '../types';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audioUtils';

const RAMESSES_INSTRUCTION = `
أنت الملك رمسيس الثاني العظيم، فرعون مصر.
تعليمات الأداء الصوتي (مهم جداً):
- نبرة صوتك: خشنة جداً، عميقة، أجش (Raspy and Deep)، مثل صوت الحجر القديم.
- الأسلوب: تتحدث بثقة مفرطة وعظمة، ولكن بلهجة "ابن بلد" مصرية أصيلة.
- لا تتحدث اللغة العربية الفصحى أبداً. ممنوع استخدام كلمات مثل "حسناً" أو "بالتأكيد" أو "يا صديقي".
- استخدم كلمات مصرية عامية مثل: "إسمع مني"، "يا مصري"، "يا بطل"، "ده أنا بنيت اللي مايتبنيش"، "يا عظمة"، "شايف التمثال ده؟"، "أيامنا كانت أيام"، "جدك رمسيس بيكلمك".
- لا تكرر كلمة "يا ولا" كثيراً، ونوع في أسلوبك.
- تعامل مع المستخدم كأنه حفيدك الصغير الذي تحاول تعليمه عظمة أجداده.
- كن حازماً وقوياً، لا تكن لطيفاً بشكل زائد مثل المساعد الآلي. أنت ملك.
`;

const VoiceAgent: React.FC = () => {
  const [status, setStatus] = useState<AudioStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<MessageLog[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<Promise<any> | null>(null);
  
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  const stopAudio = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    if (audioContextRef.current) {
        nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  const disconnect = useCallback(() => {
    setStatus('disconnected');
    setIsSpeaking(false);
    stopAudio();

    if (sessionRef.current) {
        sessionRef.current.then(session => {
             try { session.close(); } catch(e) {}
        }).catch(() => {});
        sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (inputAudioContextRef.current) {
      try { inputAudioContextRef.current.close(); } catch(e) {}
      inputAudioContextRef.current = null;
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
  }, [stopAudio]);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const connect = async () => {
    setError(null);
    
    if (!process.env.API_KEY) {
        setError("مفتاح API غير موجود. يرجى إضافته في إعدادات Netlify.");
        return;
    }

    setStatus('connecting');

    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }, // Fenrir is deep/intense
            },
            systemInstruction: RAMESSES_INSTRUCTION,
            inputAudioTranscription: {}, 
            outputAudioTranscription: {},
        }
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: async () => {
            setStatus('connected');
            try {
              if (!inputAudioContextRef.current) return;
              await inputAudioContextRef.current.resume();
              if (audioContextRef.current) await audioContextRef.current.resume();

              streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
              
              if (!inputAudioContextRef.current) return;

              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              processor.onaudioprocess = (e) => {
                if (!inputAudioContextRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                }).catch(console.error);
              };
              
              source.connect(processor);
              processor.connect(inputAudioContextRef.current.destination);
              
            } catch (micError: any) {
              console.error("Mic setup failed", micError);
              setError("الميكروفون غير متاح");
              disconnect();
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
                currentOutputTransRef.current += msg.serverContent.outputTranscription.text;
            }
            if (msg.serverContent?.inputTranscription) {
                currentInputTransRef.current += msg.serverContent.inputTranscription.text;
            }
            if (msg.serverContent?.turnComplete) {
                const userT = currentInputTransRef.current.trim();
                const modelT = currentOutputTransRef.current.trim();
                
                if (userT || modelT) {
                    setTranscriptions(prev => [
                        ...prev, 
                        ...(userT ? [{ id: Date.now() + 'u', source: 'user' as const, text: userT, timestamp: new Date() }] : []),
                        ...(modelT ? [{ id: Date.now() + 'm', source: 'model' as const, text: modelT, timestamp: new Date() }] : [])
                    ]);
                }
                currentInputTransRef.current = '';
                currentOutputTransRef.current = '';
            }

            if (msg.serverContent?.interrupted) {
                stopAudio();
                return;
            }

            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
                const ctx = audioContextRef.current;
                const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                
                const currentTime = ctx.currentTime;
                if (nextStartTimeRef.current < currentTime) {
                    nextStartTimeRef.current = currentTime;
                }

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                
                if (analyserRef.current) {
                    source.connect(analyserRef.current);
                    analyserRef.current.connect(ctx.destination);
                } else {
                    source.connect(ctx.destination);
                }

                source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) {
                        setIsSpeaking(false);
                    }
                };

                source.start(nextStartTimeRef.current);
                sourcesRef.current.add(source);
                
                nextStartTimeRef.current += audioBuffer.duration;
                setIsSpeaking(true);
            }
          },
          onclose: () => { if (status === 'connected') disconnect(); },
          onerror: (err) => { 
              console.error(err); 
              setError("حدث خطأ في الاتصال"); 
              disconnect(); 
          }
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e: any) {
        setError(e.message);
        setStatus('disconnected');
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcriptions]);

  return (
    <div className="w-full h-full flex flex-col pt-12 pb-4 px-4">
        
        {/* Header Status */}
        <div className="absolute top-8 left-0 right-0 text-center z-50">
            {status === 'connected' && (
                <span className="bg-black/40 text-amber-200/80 px-4 py-1 rounded-sm text-xs border-y border-amber-700/30 backdrop-blur-md tracking-widest font-light">
                    متصل بروح رمسيس
                </span>
            )}
        </div>

        {/* Main Visual Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
            
            {/* Controls for disconnected state */}
            {(status === 'disconnected' || status === 'error') && (
                <div className="absolute z-20 top-2/3 left-1/2 -translate-x-1/2 w-full max-w-xs text-center">
                     <button 
                        onClick={connect}
                        disabled={status === 'connecting'}
                        className="w-full py-4 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-bold rounded-sm shadow-[0_0_30px_rgba(217,119,6,0.3)] border border-amber-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {status === 'connecting' ? 'جاري استحضار الروح...' : 'تحدث مع الفرعون'}
                        <Mic size={20} className="text-amber-400" />
                    </button>
                    {error && <p className="mt-2 text-red-400 text-sm bg-black/90 p-3 border border-red-900/50 rounded-sm shadow-lg">{error}</p>}
                </div>
            )}

            {/* The Statue Visualizer */}
            <div className={`w-full h-full transition-all duration-1000 ${status === 'connected' ? 'scale-100' : 'scale-95 opacity-70 grayscale-[0.5]'}`}>
                 <MuseumStatue 
                    analyser={analyserRef.current} 
                    isSpeaking={isSpeaking} 
                    isListening={status === 'connected'} 
                />
            </div>

        </div>

        {/* Disconnect Button (Top Right) */}
        {status === 'connected' && (
            <div className="absolute top-6 right-6 z-50">
                <button onClick={disconnect} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 p-2 rounded-full transition-colors">
                    <Power size={20} />
                </button>
            </div>
        )}

        {/* Chat Overlay */}
        {status === 'connected' && (
            <div className="h-40 shrink-0 z-40 mt-2">
                <div className="w-full h-full overflow-y-auto space-y-2 pr-2 mask-image-gradient">
                    {transcriptions.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.source === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] p-2 text-sm border-l-2 ${
                                msg.source === 'user' 
                                ? 'border-slate-500 bg-slate-900/50 text-slate-300' 
                                : 'border-amber-500 bg-amber-950/40 text-amber-100 shadow-[0_0_15px_rgba(217,119,6,0.1)]'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
            </div>
        )}
    </div>
  );
};

export default VoiceAgent;
