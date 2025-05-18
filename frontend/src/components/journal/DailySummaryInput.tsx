import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Send, Mic, Brain, Heart, Smile, Sun, Moon, CloudRain, Sparkles, Lightbulb, Leaf } from 'lucide-react';
import { toast } from 'sonner';

// Define SpeechRecognition types for TypeScript
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

type SpeechRecognitionErrorEvent = {
  error: string;
};

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface DailySummaryInputProps {
  journalEntry: string;
  setJournalEntry: (entry: string | ((prev: string) => string)) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const DailySummaryInput: React.FC<DailySummaryInputProps> = ({
  journalEntry,
  setJournalEntry,
  isSubmitting,
  onSubmit
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Handle speech recognition
  const handleSpeechRecognition = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };

  // Start speech recognition
  const startListening = () => {
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Your browser doesn't support speech recognition");
        return;
      }

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        // Process the results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        
        // Only update if we have a final transcript
        if (finalTranscript) {
          // Update the journal entry with the transcribed text
          setJournalEntry((prev: string) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? trimmedPrev + ' ' + finalTranscript : finalTranscript;
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast.error(`Error: ${event.error}`);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      // Start recognition
      recognition.start();
      recognitionRef.current = recognition;
      toast.success("Listening...");
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast.error("Could not start speech recognition");
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    toast.info("Stopped listening");
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Generate a random mood icon for the current session
  const moodIcons = [
    { icon: <Heart className="h-5 w-5" />, color: "text-pink-400" },
    { icon: <Brain className="h-5 w-5" />, color: "text-purple-400" },
    { icon: <Smile className="h-5 w-5" />, color: "text-yellow-400" },
    { icon: <Sun className="h-5 w-5" />, color: "text-amber-400" },
    { icon: <Moon className="h-5 w-5" />, color: "text-blue-400" },
    { icon: <CloudRain className="h-5 w-5" />, color: "text-cyan-400" },
    { icon: <Sparkles className="h-5 w-5" />, color: "text-indigo-400" },
    { icon: <Lightbulb className="h-5 w-5" />, color: "text-yellow-400" },
    { icon: <Leaf className="h-5 w-5" />, color: "text-green-400" },
  ];
  
  const randomIndex = Math.floor(Math.random() * moodIcons.length);
  const { icon, color } = moodIcons[randomIndex];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm hover:shadow-lg hover:shadow-teal-600/20 dark:hover:shadow-teal-600/30 transition-all duration-300 text-slate-800 dark:text-white relative">
       {/* Decorative elements */}
       <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 opacity-70 blur-sm"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 opacity-70 blur-sm"></div>
        <CardHeader className="pb-0 relative z-10">
            <div className="flex gap-4 items-center justify-between overflow-x-auto scrollbar-hide">
              {moodIcons.map((item, i) => (
                <div 
                  key={i}
                  className={`p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 ${item.color.replace('text-', 'text-')} opacity-90 hover:opacity-100 cursor-pointer transition-all hover:scale-110 active:scale-95`}
                >
                  {item.icon}
                </div>
              ))}
          </div>
        </CardHeader>

        <CardContent className="p-2 md:p-6 pt-4 relative z-10">
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2 shadow-inner">
              <div className="text-slate-700 dark:text-white flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                <span className="font-medium text-sm">Share your thoughts and feelings about today</span>
              </div>
            </div>
            
            <div className="relative group">
              <Textarea
                placeholder="How was your day today? What did you accomplish? Any challenges?"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                className="min-h-[150px] max-h-[200px] resize-none bg-slate-100/80 dark:bg-zinc-700/50 border-slate-300 dark:border-zinc-600 focus:border-teal-500/50 dark:focus:border-white/50 focus:ring-teal-500/20 dark:focus:ring-white/20 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/50 rounded-lg shadow-inner transition-all duration-300 group-hover:shadow-teal-500/10"
              />
               
               {/* Prompt suggestions */}
              <div className="absolute bottom-2 left-4 right-4 flex items-end justify-between w-[92%]">
              {!journalEntry.trim() ? (
                  <div className="flex overflow-x-auto gap-2 scrollbar-hide ">
                    {[
                      { text: "I feel grateful for...", icon: <Heart className="h-2 w-2" /> },
                      { text: "Today I learned...", icon: <Brain className="h-2 w-2" /> },
                      // { text: "I'm struggling with...", icon: <CloudRain className="h-2 w-2" /> },
                    ].map((prompt, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        onClick={() => setJournalEntry(prompt.text.replace('...', '') + " ")}
                        className="rounded-full px-3 py-1 text-[0.625rem] bg-slate-200/90 dark:bg-zinc-800/70 text-slate-700 dark:text-white/70 hover:bg-slate-300 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-zinc-700/50 flex items-center gap-1 cursor-pointer"
                      >
                        {prompt.icon}
                        {prompt.text}
                      </Button>
                    ))}
                  </div>
              ): (
                <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-40 bg-slate-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-teal-500 to-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, (journalEntry.length / 500) * 100)}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-white/50">{journalEntry.length} chars</span>
              </div>
              )}
                  
                  {/* Voice button inline with prompts */}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleSpeechRecognition}
                    className={`rounded-full ml-2 ${isListening ? 'bg-red-500 border-red-400 animate-pulse shadow-lg shadow-red-500/20' : 'bg-gradient-to-r from-teal-500 to-blue-500 border-transparent'} text-white hover:shadow-md hover:shadow-teal-500/30 transition-all duration-300 cursor-pointer`}
                  >
                    {isListening ? <Mic className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4" />}
                    {isListening && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </Button>
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-center items-center relative z-10">
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-white/50 px-2 mb-1">
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>AI-powered journaling</span>
              </div>
              <div className="flex items-center gap-1">
                <Leaf className="h-3 w-3" />
                <span>Mental wellness journey</span>
              </div>
            </div>
            
            <Button 
              onClick={onSubmit} 
              disabled={isSubmitting || !journalEntry.trim()}
              className={`bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white w-full rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-teal-500/30 py-6 cursor-pointer ${!journalEntry.trim() ? 'opacity-70' : 'opacity-100'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  <ProcessingTimer />
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze your thoughts
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Processing timer component that shows elapsed time in seconds/minutes format
const ProcessingTimer: React.FC = () => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Format the time display
  const formatTime = (time: number): string => {
    if (time < 60) {
      // Show seconds with one decimal place
      return `Processing your thoughts... ${time.toFixed(1)}s`;
    } else {
      // Show minutes and seconds
      const minutes = Math.floor(time / 60);
      const seconds = (time % 60).toFixed(1);
      return `Processing your thoughts... ${minutes}m ${seconds}s`;
    }
  };

  return <span>{formatTime(elapsedTime)}</span>;
};

export default DailySummaryInput;
