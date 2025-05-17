import { configureStore } from '@reduxjs/toolkit';
// Import reducers
import agentReducer from './slices/agentSlice';
import themeReducer from './slices/themeSlice';
import journalReducer, { 
  submitJournalEntryAsync as submitJournalEntry,
  setJournalEntry,
  clearFollowUpQuestions,
  startNewJournal,
  addQuestionToEntry,
  fetchJournals,
  type Question,
  type Journal,
  type JournalState
} from './slices/journalSlice';

// Create the store with all reducers
export const store = configureStore({
  reducer: {
    agent: agentReducer,
    theme: themeReducer,
    journal: journalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['journal/submitJournalEntry/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
});

// Infer the RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export actions and types
export {
  submitJournalEntry,
  setJournalEntry,
  clearFollowUpQuestions,
  startNewJournal,
  addQuestionToEntry,
  fetchJournals,
  type Question,
  type Journal,
  type JournalState
};

// Re-export theme actions and types
export * from './slices/themeSlice';
