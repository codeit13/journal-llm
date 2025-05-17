// RunAgent.tsx - Modular journaling experience
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from 'react-redux';
import { 
  submitJournalEntry,
  setJournalEntry as setReduxJournalEntry,
  fetchJournals,
  startNewJournal,
  type Journal
} from '../store/slices/journalSlice';
import type { RootState, AppDispatch } from '../store';
import { motion } from 'framer-motion';

// Import our modular components
import {
  JournalHeader,
  DailySummaryInput,
  ReflectionQuestions,
  JournalHistory
} from "../components/journal";

// Define a local journal history entry type
interface JournalHistoryEntry {
  entry: string;
  timestamp: Date;
}

export default function RunAgent() {
  // Redux setup
  const dispatch = useDispatch<AppDispatch>();
  const { journalEntry, isSubmitting, journals } = useSelector((state: RootState) => state.journal);
  
  // Local state
  const [currentStep, setCurrentStep] = useState<'input' | 'questions' | 'completed'>('input');
  const [answers, setAnswers] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [journalHistory, setJournalHistory] = useState<JournalHistoryEntry[]>([]);
  
  // Mock questions for the reflection step
  const mockQuestions = [
    "What was the most meaningful part of your day?",
    "Did anything happen today that made you feel challenged or uncomfortable?",
    "What's one thing you learned or realized today?",
    "How did your actions today align with your personal values?",
    "What would you like to focus on or improve tomorrow?"
  ];

  // Load journals on component mount
  useEffect(() => {
    dispatch(fetchJournals());
    
    // Calculate streak count - this would normally come from the backend
    // For now, we'll simulate it
    setStreakCount(3); // Simulate a 3-day streak
  }, [dispatch]);

  // Update journal history when journals change
  useEffect(() => {
    if (journals && journals.length > 0) {
      const formattedHistory = journals.map((journal: Journal) => ({
        entry: journal.content, // Map content to entry
        timestamp: new Date(journal.createdAt) // Map createdAt to timestamp
      }));
      setJournalHistory(formattedHistory);
    }
  }, [journals]);

  // Handle journal entry change
  const handleJournalEntryChange = (entry: string) => {
    dispatch(setReduxJournalEntry(entry));
  };

  // Handle journal entry submission
  const handleJournalSubmit = () => {
    if (!journalEntry.trim()) {
      toast.error("Please enter your thoughts before submitting");
      return;
    }

    dispatch(submitJournalEntry(journalEntry))
      .then(() => {
        setCurrentStep('questions');
        toast.success("Journal submitted! Now let's reflect on some questions.");
      })
      .catch((error) => {
        toast.error("Failed to submit journal. Please try again.");
        console.error("Error submitting journal:", error);
      });
  };

  // Handle answer submission
  const handleAnswerSubmit = (answer: string) => {
    const newAnswers = [...answers];
    const currentQuestionIndex = newAnswers.length;
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  // Handle completion of all questions
  const handleComplete = (finalAnswers: string[]) => {
    // Here you would typically save the completed journal with answers
    // For now, we'll just simulate it with a timeout
    setTimeout(() => {
      setCurrentStep('completed');
      toast.success("Journal completed and saved!");
      
      // Add the current journal to history
      const newHistoryItem: JournalHistoryEntry = {
        entry: journalEntry,
        timestamp: new Date()
      };
      setJournalHistory([newHistoryItem, ...journalHistory]);
      
      // Reset for a new journal entry after a delay
      setTimeout(() => {
        dispatch(startNewJournal());
        setCurrentStep('input');
        setAnswers([]);
      }, 3000);
    }, 1000);
  };

  // Handle starting over
  const handleStartOver = () => {
    dispatch(startNewJournal());
    setCurrentStep('input');
    setAnswers([]);
    toast.info("Starting a new journal entry");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <JournalHeader 
        title="Intellect Journaling" 
        subtitle="Reflect on your day and gain insights through guided journaling"
      />
      
      <div className="mt-8 space-y-8">
        {/* Daily Summary Input Step */}
        {currentStep === 'input' && (
          <DailySummaryInput
            journalEntry={journalEntry}
            setJournalEntry={handleJournalEntryChange}
            isSubmitting={isSubmitting}
            onSubmit={handleJournalSubmit}
          />
        )}
        
        {/* Reflection Questions Step */}
        {currentStep === 'questions' && (
          <ReflectionQuestions
            questions={mockQuestions}
            onAnswerSubmit={handleAnswerSubmit}
            onComplete={handleComplete}
            onStartOver={handleStartOver}
            streakCount={streakCount}
          />
        )}
        
        {/* Journal History Section - always visible */}
        {journalHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <JournalHistory journalHistory={journalHistory} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
