// RunAgent.tsx - Modular journaling experience
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from 'react-redux';
import { 
  analyzeJournalEntryAsync,
  submitJournalAnswersAsync,
  setJournalEntry as setReduxJournalEntry,
  startNewJournal,
  addAnswer,
} from '../store/slices/journalSlice';
import type { RootState, AppDispatch } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Trophy, Heart, Brain, PenLine } from 'lucide-react';

// Import our modular components
import JournalHeader from "../components/journal/JournalHeader";
import DailySummaryInput from "../components/journal/DailySummaryInput";
import SwipableQuestionsCard from "../components/journal/SwipableQuestionsCard";

export default function RunAgent() {
  // Redux setup
  const dispatch = useDispatch<AppDispatch>();
  const { journalEntry, isSubmitting, journals, followUpQuestions, currentJournalId, mood, mood_score } = useSelector((state: RootState) => state.journal);
  
  // Local state
  const [currentStep, setCurrentStep] = useState<'input' | 'questions' | 'completed'>('input');
  const [answers, setAnswers] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState<number>(3); // Simulate a 3-day streak
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  
  // Get illustration colors based on question index or current step
  const getIllustrationColors = (index: number = 0) => {
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
  
  // Use questions from API response or fallback to default questions if needed
  const questions = followUpQuestions.length > 0 
    ? followUpQuestions.map(q => q.text) 
    : [
      "What was the most meaningful part of your day?",
      "Did anything happen today that made you feel challenged or uncomfortable?",
      "What's one thing you learned or realized today?",
      "How did your actions today align with your personal values?",
      "What would you like to focus on or improve tomorrow?"
    ];

  // Handle journal entry change
  const handleJournalEntryChange = (entry: string | ((prev: string) => string)) => {
    if (typeof entry === 'function') {
      // If entry is a function, call it with the current journalEntry value
      const newEntry = entry(journalEntry);
      dispatch(setReduxJournalEntry(newEntry));
    } else {
      // If entry is a string, use it directly
      dispatch(setReduxJournalEntry(entry));
    }
  };

  // Handle journal entry submission
  const handleJournalSubmit = () => {
    if (!journalEntry.trim()) {
      toast.error("Please enter your thoughts before submitting");
      return;
    }

    // Analyze the journal to get follow-up questions
    dispatch(analyzeJournalEntryAsync(journalEntry))
      .then((result) => {
        if (analyzeJournalEntryAsync.fulfilled.match(result)) {
          setCurrentStep('questions');
          toast.success("Journal analyzed! Now let's reflect on some questions.");
          // Reset answers when moving to questions step
          setAnswers(new Array(result.payload.questions.length).fill(''));
          setCurrentQuestionIndex(0);
          
          // Show mood if available
          if (result.payload.mood) {
            toast.info(`Mood detected: ${result.payload.mood}`);
          }
        }
      })
      .catch((error) => {
        toast.error("Failed to analyze journal. Please try again.");
        console.error("Error analyzing journal:", error);
      });
  };

  // Handle answer submission for a specific question
  const handleAnswerSubmit = (answer: string, questionIndex: number) => {
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
    
    // Store answer in Redux
    dispatch(addAnswer({
      questionId: followUpQuestions[questionIndex]?.id || `q-${questionIndex}`,
      answer: answer
    }));
    
    // Move to next question if not the last one
    if (questionIndex < questions.length - 1) {
      setCurrentQuestionIndex(questionIndex + 1);
      setDirection('right');
    } else {
      // If it's the last question, complete the journal
      handleComplete(newAnswers);
    }
  };

  // Use a ref to track if handleComplete has been called to prevent duplicate calls
  const hasHandledCompleteRef = useRef(false);
  
  // Handle completion of all questions
  const handleComplete = (finalAnswers: string[]) => {
    // Prevent duplicate calls
    if (hasHandledCompleteRef.current) return;
    hasHandledCompleteRef.current = true;
    
    // Save the completed journal with answers to the API
    toast.success("Saving your journal responses...");
    
    // Submit answers to the API
    dispatch(submitJournalAnswersAsync())
      .then((result) => {
        if (submitJournalAnswersAsync.fulfilled.match(result)) {
          setCurrentStep('completed');
          toast.success("Journal completed and saved!");
          
          // No longer automatically resetting - the user will close the celebration card
          // and click 'Continue Journaling' when they're ready
          // This allows the celebration card to remain visible
          hasHandledCompleteRef.current = false;
        } else {
          // Reset the ref if there was an error
          hasHandledCompleteRef.current = false;
        }
      })
      .catch((error) => {
        toast.error("Failed to save your answers. Please try again.");
        console.error("Error saving answers:", error);
      });
  };

  // Handle starting over
  const handleStartOver = () => {
    dispatch(startNewJournal());
    setCurrentStep('input');
    setAnswers([]);
    toast.info("Starting a new journal entry");
  };

  const happyEmojis = ["😄", "😊", "🥰", "😁", "😎", "🤩", "😍", "🥳", "😃", "😋", "😇", "🌈", "✨", "💫", "❤️", "🎉"];
  
  // Generate animated bubbles only once using useMemo
  const animatedBubbles = useMemo(() => {
    return [...Array(30)].map((_, i) => {
      const colors = getIllustrationColors(i % 5);
      const size = 20 + Math.random() * 120;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = 5 + Math.random() * 10;
      
      // Select a random emoji for each floating div
      const randomEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
      
      return (
        <motion.div 
          key={i}
          className={`absolute rounded-full ${i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.tertiary} opacity-${10 + Math.floor(Math.random() * 50)} flex items-center justify-center`}
          style={{
            width: size,
            height: size,
            left: `${left}%`,
            top: `${top}%`,
          }}
          animate={{
            x: [0, 50, -40, 30, 0],
            y: [0, -40, 50, -30, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: duration,
            delay: delay,
            ease: "easeInOut"
          }}
        >
          {size > 50 && (
            <div className="flex items-center justify-center w-full h-full">
              <span style={{ fontSize: `${size * 0.5}px` }}>
                {randomEmoji}
              </span>
            </div>
          )}
        </motion.div>
      );
    });
  }, []);

  return (
    <div className="min-h-[97svh] flex flex-col relative overflow-hidden">
      {/* Animated bubble background for the entire UI */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {animatedBubbles}
        <div className="absolute inset-0 bg-gradient-to-b dark:from-zinc-900/80 dark:to-zinc-900/80 from-white/90 to-slate-100/90 backdrop-blur-[4px]" />
      </div>
      
      {/* Fixed Header */}
      <JournalHeader 
        title="Journal AI" 
        subtitle="Review your day with guided journaling to reveal AI insights"
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start h-fit pt-8 relative z-10">
        
        {/* Question Counter and Navigation Dots */}
        {/* {currentStep === 'questions' && (
          <div className="mb-4 flex flex-col items-center">
            <div className="text-slate-600 dark:text-zinc-400 text-sm font-medium">
              {currentQuestionIndex + 1} / {questions.length}
            </div>
            
            <div className="flex justify-center gap-1.5 mt-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentQuestionIndex ? 'right' : 'left');
                    setCurrentQuestionIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${currentQuestionIndex === index 
                    ? 'bg-teal-600 dark:bg-teal-400 w-4 shadow-sm' 
                    : answers[index]?.trim()
                      ? 'bg-teal-500/70 dark:bg-teal-400/70 hover:bg-teal-500 dark:hover:bg-teal-400'
                      : 'bg-slate-400 dark:bg-zinc-600 hover:bg-slate-500 dark:hover:bg-zinc-500'}`}
                  aria-label={`Go to question ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )} */}

        {/* Swipeable Card Area */}
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Daily Summary Input Step */}
            {currentStep === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
              >
                <DailySummaryInput
                  journalEntry={journalEntry}
                  setJournalEntry={handleJournalEntryChange}
                  isSubmitting={isSubmitting}
                  onSubmit={handleJournalSubmit}
                />
              </motion.div>
            )}
            
            {/* Reflection Questions Step with Swipable Cards */}
            {currentStep === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
              >
                <SwipableQuestionsCard
                  questions={questions}
                  onAnswerSubmit={handleAnswerSubmit}
                  onComplete={handleComplete}
                  onStartOver={handleStartOver}
                  streakCount={streakCount}
                  currentQuestionIndex={currentQuestionIndex}
                  onQuestionChange={setCurrentQuestionIndex}
                />
              </motion.div>
            )}
            
            {/* Completed Step with Enhanced Celebration UI */}
            {currentStep === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
              >
                <motion.div 
                  className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-xl text-center relative overflow-hidden border border-slate-200 dark:border-zinc-800"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "tween", duration: 0.3 }}
                >
                  {/* Decorative elements */}
                  <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-teal-400/20 to-blue-500/20 blur-xl"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-500/20 blur-xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-center items-center gap-3 mb-4">
                      <motion.div 
                        className="text-5xl"
                        initial={{ rotate: -15 }}
                        animate={{ rotate: 0 }}
                        transition={{ type: "tween", duration: 0.3 }}
                      >
                        🎉
                      </motion.div>
                      <motion.div 
                        className="text-5xl"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                      >
                        🧠
                      </motion.div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Reflection Complete!</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">Your journal entry has been saved successfully.</p>
                    
                    <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-lg mb-6">
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center justify-center">
                        <Brain className="h-4 w-4 mr-1 text-purple-500" /> Mental Wellness Insight
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                        "Regular journaling helps reduce stress and anxiety by providing an outlet for processing emotions."
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 mb-6">
                      <div className="flex justify-center">
                        <Badge className="bg-teal-500 text-white px-3 py-1 text-sm flex items-center">
                          <Trophy className="h-4 w-4 mr-1" /> {streakCount} Day Streak
                        </Badge>
                      </div>
                      
                      <div className="flex justify-center gap-2">
                        <Badge className="bg-purple-500/90 text-white px-3 py-1 text-xs flex items-center">
                          <Heart className="h-3 w-3 mr-1" /> Self-Care
                        </Badge>
                        <Badge className="bg-blue-500/90 text-white px-3 py-1 text-xs flex items-center">
                          <Brain className="h-3 w-3 mr-1" /> Mindfulness
                        </Badge>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-teal-600 hover:bg-teal-700 text-white w-full flex items-center justify-center gap-1 py-6 rounded-full cursor-pointer"
                      onClick={() => {
                        dispatch(startNewJournal());
                        setCurrentStep('input');
                      }}
                    >
                      <PenLine className="h-4 w-4" />
                      Continue Journaling
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
