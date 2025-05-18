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

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Brain, Lightbulb, FileText, Mic, ChevronRight, ChevronLeft, CheckCircle2, Trophy, HelpCircle, Sparkles, Heart, Leaf, Sun, Moon, PenLine, X } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

interface SwipableQuestionsCardProps {
  questions: string[];
  onAnswerSubmit: (answer: string, index: number) => void;
  onComplete: (answers: string[]) => void;
  onStartOver: () => void;
  streakCount: number;
  currentQuestionIndex?: number;
  onQuestionChange?: (index: number) => void;
}

const SwipableQuestionsCard: React.FC<SwipableQuestionsCardProps> = ({
  questions,
  onAnswerSubmit,
  onComplete,
  onStartOver,
  streakCount,
  currentQuestionIndex: parentQuestionIndex,
  onQuestionChange
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(parentQuestionIndex || 0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [showCelebration, setShowCelebration] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right'); // Track animation direction
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Get illustration colors based on question index
  const getIllustrationColors = (index: number) => {
    const colors = [
      { 
        primary: 'dark:bg-teal-500/40 bg-teal-500/30', 
        secondary: 'dark:bg-teal-300/60 bg-teal-400/40', 
        tertiary: 'dark:bg-teal-200/80 bg-teal-500/30' 
      },
      { 
        primary: 'dark:bg-amber-500/40 bg-amber-500/30', 
        secondary: 'dark:bg-amber-300/60 bg-amber-400/40', 
        tertiary: 'dark:bg-amber-200/80 bg-amber-500/30' 
      },
      { 
        primary: 'dark:bg-blue-500/40 bg-blue-500/30', 
        secondary: 'dark:bg-blue-300/60 bg-blue-400/40', 
        tertiary: 'dark:bg-blue-200/80 bg-blue-500/30' 
      },
      { 
        primary: 'dark:bg-purple-500/40 bg-purple-500/30', 
        secondary: 'dark:bg-purple-300/60 bg-purple-400/40', 
        tertiary: 'dark:bg-purple-200/80 bg-purple-500/30' 
      },
      { 
        primary: 'dark:bg-green-500/40 bg-green-500/30', 
        secondary: 'dark:bg-green-300/60 bg-green-400/40', 
        tertiary: 'dark:bg-green-200/80 bg-green-500/30' 
      }
    ];
    
    return colors[index % colors.length];
  };

  // Use a ref to track if onComplete has been called to prevent duplicate calls
  const hasCompletedRef = useRef(false);
  
  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) {
      return;
    }
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(newAnswers);
    
    // Mark question as completed
    if (!completedQuestions.includes(currentQuestionIndex)) {
      setCompletedQuestions([...completedQuestions, currentQuestionIndex]);
    }
    
    // Call the parent component's onAnswerSubmit
    onAnswerSubmit(currentAnswer, currentQuestionIndex);
    
    // Check if this is the last question
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    
    if (isLastQuestion && !hasCompletedRef.current) {
      // For the last question, immediately call onComplete
      // Show celebration animation
      setShowCelebration(true);
      // Set the ref to true to prevent duplicate calls
      hasCompletedRef.current = true;
      // Call onComplete immediately to trigger the API call
      onComplete(newAnswers);
      
      // No longer hiding celebration automatically - user will close it manually
      return;
    }
    
    // Move to next question
    setDirection('right'); // Set direction before changing question
    setCurrentQuestionIndex(prev => prev + 1);
    setCurrentAnswer('');
  };

  const handleQuestionSelect = (index: number) => {
    // Set direction based on navigation direction
    // If going to a higher index, set direction to right
    // If going to a lower index, set direction to left
    const newDirection = index > currentQuestionIndex ? 'right' : 'left';
    setDirection(newDirection);
    
    // Update current question and answer
    setCurrentQuestionIndex(index);
    setCurrentAnswer(answers[index] || '');
    
    // Notify parent component of question change
    if (onQuestionChange) {
      onQuestionChange(index);
    }
  };

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
          // Update the current answer with the transcribed text
          setCurrentAnswer(prev => {
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

  const { primary, secondary, tertiary } = getIllustrationColors(currentQuestionIndex);

  // Function to handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
        handleQuestionSelect(currentQuestionIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        handleQuestionSelect(currentQuestionIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestionIndex, questions.length]);
  
  // Sync with parent component's question index
  useEffect(() => {
    if (parentQuestionIndex !== undefined && parentQuestionIndex !== currentQuestionIndex) {
      setCurrentQuestionIndex(parentQuestionIndex);
      setCurrentAnswer(answers[parentQuestionIndex] || '');
    }
  }, [parentQuestionIndex]);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0.2 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Celebration overlay removed - now handled in RunAgent.tsx */}
      
      {/* Swipable Card for Questions */}
      <div className="relative">
        {/* Navigation buttons for desktop */}
        {/* <div className="absolute top-1/2 -translate-y-1/2  left-0 right-0 flex justify-between px-0.5 z-10 pointer-events-none">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (currentQuestionIndex > 0) {
                handleQuestionSelect(currentQuestionIndex - 1);
              }
            }}
            disabled={currentQuestionIndex === 0}
            className="rounded-full bg-red-500 text-teal-700 dark:text-teal-300 pointer-events-auto shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (currentQuestionIndex < questions.length - 1) {
                handleQuestionSelect(currentQuestionIndex + 1);
              }
            }}
            disabled={currentQuestionIndex === questions.length - 1}
            className="rounded-full bg-red-500 text-teal-700 dark:text-teal-300 pointer-events-auto shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div> */}
        
        {/* Use a stable container with fixed dimensions */}
        <div className="w-full relative">
          <AnimatePresence  mode="popLayout">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: direction === 'right' ? 300 : -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === 'right' ? -300 : 300 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 25
              }}
              className="w-full absolute inset-0"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100 && currentQuestionIndex < questions.length - 1) {
                handleQuestionSelect(currentQuestionIndex + 1);
                setDirection('right');
              } else if (info.offset.x > 100 && currentQuestionIndex > 0) {
                handleQuestionSelect(currentQuestionIndex - 1);
                setDirection('left');
              }
            }}
          >
          <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm hover:shadow-lg hover:shadow-teal-600/20 dark:hover:shadow-teal-600/30 transition-all duration-300 text-slate-800 dark:text-white relative">
            {/* Decorative elements */}
            <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 opacity-70 blur-sm"></div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 opacity-70 blur-sm"></div>
           
            <CardHeader className="pb-0 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className={`p-2 rounded-full bg-slate-100 dark:bg-zinc-800/80 ${secondary.replace('bg-', 'text-')}`}>
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <span className="md:text-2xl text-lg bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-500 bg-clip-text text-transparent">
                    Question {currentQuestionIndex + 1}/{questions.length}
                  </span>
                </CardTitle>
                
                <div className="flex gap-2">
                  {[<Heart className="h-5 w-5" />, <Brain className="h-5 w-5" />, <Sparkles className="h-5 w-5" />].map((icon, i) => (
                    <motion.div 
                      key={i}
                      className={`p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 ${i === 0 ? 'text-pink-500 dark:text-pink-400' : i === 1 ? 'text-purple-500 dark:text-purple-400' : 'text-amber-500 dark:text-amber-400'} opacity-70 hover:opacity-100 cursor-pointer transition-all`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {icon}
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-2 md:p-6 md:pt-0 pt-0">
              <div className="space-y-4 bg-gradient-to-r from-slate-100/90 to-slate-200/70 dark:from-zinc-800/70 dark:to-zinc-800/40 p-4 border border-slate-300 dark:border-zinc-700/50 rounded-xl">
                <div className="relative rounded-xl">
                  <div className="flex items-center gap-4 relative z-10">
              
                    <div>
                      <h3 className="text-base md:text-lg font-medium text-slate-800 dark:text-white">
                        {questions[currentQuestionIndex]}
                      </h3>
                    </div>
                  </div>
                </div>
                
                {/* Answer interface with tabs for text/audio */}
                {/* Stable textarea container with fixed dimensions */}
                <div className="relative group mb-12"> {/* Added bottom margin to make space for suggestions/progress */}
                    <Textarea
                      placeholder="Your answer..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="min-h-[150px] max-h-[200px] resize-none bg-slate-100/80 dark:bg-zinc-700/50 border-slate-300 dark:border-zinc-600 focus:border-teal-500/50 dark:focus:border-white/50 focus:ring-teal-500/20 dark:focus:ring-white/20 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/50 rounded-lg shadow-inner transition-none"
                    />
                    
                    {/* Fixed position container for suggestions/progress to prevent layout shifts */}
                    <div className="h-10 absolute -bottom-12 left-0 right-0 flex items-center justify-between w-full">
                      <div className="flex-1 relative h-10"> {/* Fixed height container */}
                        {!currentAnswer.trim() ? (
                          <div className="absolute inset-0 flex overflow-x-auto gap-2 scrollbar-hide items-center">
                            {[
                              { text: "I think about...", icon: <Brain className="h-2 w-2" /> },
                              { text: "In my experience...", icon: <Sun className="h-2 w-2" /> }
                            ].map((prompt, i) => (
                              <Button
                                key={i}
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentAnswer(prompt.text.replace('...', '') + " ")}
                                className="rounded-full px-3 py-1 text-[0.625rem] bg-slate-200/90 dark:bg-zinc-800/70 text-slate-700 dark:text-white/70 hover:bg-slate-300 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-zinc-700/50 flex items-center gap-1 cursor-pointer"
                              >
                                {prompt.icon}
                                {prompt.text}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center gap-2">
                            <div className="h-1 w-40 bg-slate-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-blue-500"
                                style={{ width: `${Math.min(100, (currentAnswer.length / 300) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-white/50">{currentAnswer.length} chars</span>
                          </div>
                        )}
                      </div>
                    
                      {/* Voice button */}
                      <div className="flex-shrink-0 ml-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handleSpeechRecognition}
                          className={`rounded-full ${isListening ? 'bg-red-500 border-red-400 animate-pulse shadow-lg shadow-red-500/20' : 'bg-gradient-to-r from-teal-500 to-blue-500 border-transparent'} text-white hover:shadow-md hover:shadow-teal-500/30 transition-all duration-300 cursor-pointer`}
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
              </div>
            </CardContent>
            
            <CardFooter className="p-4 flex justify-center items-center relative z-10">
              <div className="w-full flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-white/50 px-2 mb-1">
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    <span>Your reflection journey</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAnswerSubmit}
                  className={`w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full border-none shadow-md hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 cursor-pointer py-6 ${!currentAnswer.trim() ? 'opacity-70' : 'opacity-100'}`}
                  disabled={!currentAnswer.trim()}
                >
                  {currentQuestionIndex === questions.length - 1 ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Complete Reflection
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Continue to Next Question
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipableQuestionsCard;
