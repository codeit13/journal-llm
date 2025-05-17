import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Lightbulb, Send, FileText, Mic } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

interface DailySummaryInputProps {
  journalEntry: string;
  setJournalEntry: (entry: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const DailySummaryInput: React.FC<DailySummaryInputProps> = ({
  journalEntry,
  setJournalEntry,
  isSubmitting,
  onSubmit
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-teal-50 to-white dark:from-teal-900/10 dark:to-zinc-900/30 backdrop-blur-sm hover:shadow-md dark:hover:shadow-teal-600/20 transition-all duration-300">
        <CardHeader className="border-b border-teal-500/30">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="bg-teal-500/20 p-1.5 rounded-md">
              <Lightbulb className="h-4 w-4 text-teal-500" />
            </div>
            Begin Your Reflection Journey
          </CardTitle>
          <CardDescription className="text-teal-600/70">
            Tell us about your day. This will help our AI craft personalized reflection questions just for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Engaging prompt */}
            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800/50">
              <h3 className="text-sm font-medium text-teal-800 dark:text-teal-300 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" /> Reflection Tip
              </h3>
              <p className="text-sm text-teal-700 dark:text-teal-400 mt-1">
                Try to include both highlights and challenges from your day. This helps create more meaningful reflection questions.
              </p>
            </div>
            
            {/* Input mode toggle with improved styling */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
              <div className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="font-medium">How would you like to share?</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`rounded-full px-3 py-1 text-xs ${inputMode === 'text' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                  onClick={() => setInputMode('text')}
                >
                  <FileText className="h-3 w-3 mr-1" /> Text
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`rounded-full px-3 py-1 text-xs ${inputMode === 'audio' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                  onClick={() => setInputMode('audio')}
                >
                  <Mic className="h-3 w-3 mr-1" /> Voice
                </Button>
              </div>
            </div>
            
            {/* Text input with improved styling */}
            {inputMode === "text" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Textarea
                  placeholder="How was your day today? What did you accomplish? Any challenges?"
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  className="min-h-[200px] resize-none bg-teal-50/50 dark:bg-teal-900/10 border-teal-500/30 focus:border-teal-500 focus:ring-teal-500/20 placeholder:text-teal-500/70 text-base"
                />
                <div className="absolute bottom-3 right-3 text-xs text-teal-500/70">
                  {journalEntry.length} characters
                </div>
              </motion.div>
            )}
            
            {/* Audio recording controls */}
            {inputMode === "audio" && (
              <AudioRecorder onTranscriptReady={setJournalEntry} />
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-teal-50/50 dark:bg-teal-900/10 border-t border-teal-500/30 flex justify-between items-center">
          <div className="text-xs text-teal-600/70 dark:text-teal-400/70">
            Your answers will help generate personalized reflection questions
          </div>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting || !journalEntry.trim()}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white transition-all duration-300 transform hover:scale-105"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Begin Reflection
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default DailySummaryInput;
