import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Brain, Lightbulb, FileText, Mic, ChevronRight, CheckCircle2, Trophy } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

interface ReflectionQuestionsProps {
  questions: string[];
  onAnswerSubmit: (answer: string) => void;
  onComplete: (answers: string[]) => void;
  onStartOver: () => void;
  streakCount: number;
}

const ReflectionQuestions: React.FC<ReflectionQuestionsProps> = ({
  questions,
  onAnswerSubmit,
  onComplete,
  onStartOver,
  streakCount
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [showCelebration, setShowCelebration] = useState(false);

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
    onAnswerSubmit(currentAnswer);
    
    // Show celebration animation if all questions are answered
    if (completedQuestions.length + 1 >= questions.length) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onComplete(newAnswers);
      }, 3000);
      return;
    }
    
    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    setCurrentAnswer('');
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
    setCurrentAnswer(answers[index] || '');
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Celebration overlay when all questions are answered */}
      {showCelebration && (
        <motion.div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-xl text-center max-w-md"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <motion.div 
              className="text-6xl mb-4"
              initial={{ rotate: -30 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              🎉
            </motion.div>
            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Reflection Complete!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Your journal entry has been saved successfully.</p>
            <div className="flex justify-center">
              <Badge className="bg-teal-500 text-white px-3 py-1 text-sm flex items-center">
                <Trophy className="h-4 w-4 mr-1" /> {streakCount} Day Streak
              </Badge>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Gamified question interface */}
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-teal-50 to-white dark:from-teal-900/10 dark:to-zinc-900/30 backdrop-blur-sm hover:shadow-md dark:hover:shadow-teal-600/20 transition-all duration-300">
        <CardHeader className="border-b border-teal-500/30">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="bg-teal-500/20 p-1.5 rounded-md">
                <Brain className="h-4 w-4 text-teal-500" />
              </div>
              Reflection Journey
            </CardTitle>
            <Badge className="bg-teal-500/20 text-teal-700 dark:text-teal-300 px-3 py-1">
              {completedQuestions.length} of {questions.length} Complete
            </Badge>
          </div>
          <CardDescription className="text-teal-600/70">
            Answer these personalized questions to deepen your reflection
          </CardDescription>
          
          {/* Progress bar */}
          <div className="mt-4">
            <Progress 
              value={(completedQuestions.length / questions.length) * 100} 
              className="h-2 bg-teal-100 dark:bg-teal-900/30"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Question navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestionIndex === index ? "default" : "outline"}
                size="sm"
                className={`rounded-full w-10 h-10 p-0 flex-shrink-0 ${
                  completedQuestions.includes(index) 
                    ? "bg-teal-500 text-white hover:bg-teal-600" 
                    : currentQuestionIndex === index 
                      ? "bg-teal-500 text-white" 
                      : "border-teal-500/30 text-teal-700 dark:text-teal-300"
                }`}
                onClick={() => handleQuestionSelect(index)}
              >
                {completedQuestions.includes(index) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </Button>
            ))}
          </div>
          
          {/* Current question and answer interface */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Question card */}
              <div className="bg-white dark:bg-zinc-800/50 p-5 rounded-xl border border-teal-200 dark:border-teal-800/30 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-teal-500/10 text-teal-600 dark:text-teal-400 p-2 rounded-full">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                      {questions[currentQuestionIndex]}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Answer interface with tabs for text/audio */}
              <Tabs defaultValue={inputMode} onValueChange={(value) => setInputMode(value as "text" | "audio")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Text Response
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="flex items-center gap-1">
                    <Mic className="h-3 w-3" /> Voice Response
                  </TabsTrigger>
                </TabsList>
                
                {/* Text input tab */}
                <TabsContent value="text" className="mt-0">
                  <div className="relative">
                    <Textarea
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="min-h-[150px] resize-none bg-teal-50/50 dark:bg-teal-900/10 border-teal-500/30 focus:border-teal-500 focus:ring-teal-500/20 placeholder:text-teal-500/70"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-teal-500/70">
                      {currentAnswer.length} characters
                    </div>
                  </div>
                </TabsContent>
                
                {/* Audio input tab */}
                <TabsContent value="audio" className="mt-0">
                  <AudioRecorder onTranscriptReady={setCurrentAnswer} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </AnimatePresence>
        </CardContent>
        
        <CardFooter className="p-4 bg-teal-50/50 dark:bg-teal-900/10 border-t border-teal-500/30 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={onStartOver}
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-500/10"
          >
            Start over
          </Button>
          
          <Button 
            onClick={handleAnswerSubmit} 
            disabled={!currentAnswer.trim()}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            {currentQuestionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Complete Reflection
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ReflectionQuestions;
