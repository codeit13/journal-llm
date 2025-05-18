import React from 'react';
import { Brain, Bot, Sparkles, BookOpen } from 'lucide-react';

interface JournalHeaderProps {
  title?: string;
  subtitle?: string;
}

const JournalHeader: React.FC<JournalHeaderProps> = ({ 
  title = "Reflection Journey",
  subtitle = "Record and reflect on your daily thoughts and experiences"
}) => {
  return (
    <div className="flex items-center justify-center bg-gradient-to-b from-teal-500/20 to-teal-400/0 dark:from-teal-900/40 dark:to-teal-600/0 md:p-6 p-4 px-2 rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/5 opacity-20"></div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="relative z-10">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-teal-600/30 flex items-center justify-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-teal-500/40 flex items-center justify-center">
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-teal-400/50 flex items-center justify-center">
                <div className="bg-teal-600 p-3 rounded-full bg-teal-300/60 animate-ping shadow-md">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-teal-800 dark:text-white whitespace-nowrap">
            {title}
          </h1>
          <p className="text-slate-600 dark:text-muted-foreground hidden md:block">
            {subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/30 px-2 py-1 rounded-full text-[0.7rem] flex items-center shadow-sm hover:shadow-md transition-all duration-300">
              <Brain className="h-3 w-3 mr-1" /> AI-Powered
            </div>
            <div className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/30 px-2 py-1 rounded-full text-[0.7rem] flex items-center shadow-sm hover:shadow-md transition-all duration-300">
              <Bot className="h-3 w-3 mr-1" /> Personalized
            </div>
            <div className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/30 px-2 py-1 rounded-full text-[0.7rem] flex items-center shadow-sm hover:shadow-md transition-all duration-300">
              <Sparkles className="h-3 w-3 mr-1" /> Insightful
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalHeader;
