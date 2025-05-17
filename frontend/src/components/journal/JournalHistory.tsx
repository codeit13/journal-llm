import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { FileText } from 'lucide-react';

interface JournalEntry {
  entry: string;
  timestamp: Date;
}

interface JournalHistoryProps {
  journalHistory: JournalEntry[];
}

const JournalHistory: React.FC<JournalHistoryProps> = ({ journalHistory }) => {
  if (journalHistory.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-teal-50 to-white dark:from-teal-900/10 dark:to-zinc-900/30 backdrop-blur-sm">
      <CardHeader className="border-b border-teal-500/30">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <div className="bg-teal-500/20 p-1.5 rounded-md">
            <FileText className="h-4 w-4 text-teal-500" />
          </div>
          Your Recent Entries
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {journalHistory.map((item, index) => (
            <motion.div 
              key={index} 
              className="p-4 border border-teal-500/20 rounded-md bg-white dark:bg-teal-900/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-sm text-teal-600/70 dark:text-teal-400/70 mb-1">
                {item.timestamp.toLocaleString()}
              </div>
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{item.entry}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default JournalHistory;
