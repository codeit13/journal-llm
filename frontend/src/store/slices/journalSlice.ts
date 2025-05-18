import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Question {
  id: string;
  text: string;
}

export interface Journal {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  mood?: string;
}

export interface JournalState {
  journalEntry: string;
  isSubmitting: boolean;
  isLoading: boolean;
  followUpQuestions: Question[];
  journalHistory: { entry: string; timestamp: Date }[];
  journals: Journal[];
  error: string | null;
  currentJournalId: string | null;
  answers: { questionId: string; answer: string }[];
  mood: string | null;
  mood_score: number | null;
}

const initialState: JournalState = {
  journalEntry: '',
  isSubmitting: false,
  isLoading: false,
  followUpQuestions: [],
  journalHistory: [],
  journals: [],
  error: null,
  currentJournalId: null,
  answers: [],
  mood: null,
  mood_score: null,
};

// Fallback questions in case the API fails
const fallbackQuestions: Question[] = [
  { id: 'q-1', text: 'What was the most challenging part of your day?' },
  { id: 'q-2', text: 'Did anything make you feel particularly happy or grateful today?' },
  { id: 'q-3', text: 'How did you take care of yourself today?' },
  { id: 'q-4', text: 'Is there something you wish you had done differently today?' },
  { id: 'q-5', text: 'What are you looking forward to tomorrow?' }
];

// Fallback journals in case the API fails
const fallbackJournals: Journal[] = [
  {
    id: 'j-1',
    title: 'A Productive Day',
    content: 'Today was incredibly productive. I managed to complete all my tasks ahead of schedule and even had time to start on tomorrow\'s work. I felt energized and focused throughout the day.',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    mood: 'Energetic',
    tags: ['productive', 'work']
  },
  {
    id: 'j-2',
    title: 'Reflections on Growth',
    content: 'I\'ve been thinking a lot about personal growth lately. It\'s amazing how much I\'ve changed over the past year. Some challenges were difficult, but I\'m grateful for the lessons learned.',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    mood: 'Thoughtful',
    tags: ['growth', 'reflection']
  },
  {
    id: 'j-3',
    title: 'Weekend Adventures',
    content: 'Spent the weekend exploring new hiking trails with friends. The weather was perfect and the views were breathtaking. These moments of connection with nature help me reset and prepare for the week ahead.',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    mood: 'Refreshed',
    tags: ['outdoors', 'friends', 'weekend']
  },
  {
    id: 'j-4',
    title: 'Learning New Skills',
    content: 'Started learning a new programming language today. It\'s challenging but exciting to expand my skill set. I\'m looking forward to building something with it soon.',
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
    mood: 'Curious',
    tags: ['learning', 'coding']
  },
  {
    id: 'j-5',
    title: 'Mindfulness Practice',
    content: 'Dedicated extra time to meditation today. It\'s amazing how just 20 minutes of mindfulness can completely shift my perspective and reduce stress levels.',
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
    mood: 'Calm',
    tags: ['mindfulness', 'self-care']
  }
];

export const fetchJournals = createAsyncThunk(
  'journal/fetchJournals',
  async (_, { rejectWithValue }) => {
    try {
      // Attempt to make the API call
      const response = await fetch('http://0.0.0.0:8003/api/journals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // You might need to add authentication headers here if required
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
      });

      // If the response is successful, process it normally
      if (response.ok) {
        const data = await response.json();
        return { journals: data.journals };
      } 
      
      // Handle specific error cases
      if (response.status === 401) {
        console.warn('Authentication error: Using fallback journals');
        return { 
          journals: fallbackJournals,
          usedFallback: true,
          errorMessage: 'Authentication error. Using default journals instead.' 
        };
      }
      
      // For other errors, also use fallback
      console.warn(`API error (${response.status}): Using fallback journals`);
      return { 
        journals: fallbackJournals,
        usedFallback: true,
        errorMessage: 'Could not connect to the server. Using default journals instead.' 
      };
    } catch (error) {
      console.error('API Error:', error);
      // Return fallback journals for any exception
      return { 
        journals: fallbackJournals,
        usedFallback: true,
        errorMessage: 'Network error. Using default journals instead.' 
      };
    }
  }
);



export const analyzeJournalEntry = createAsyncThunk(
  'journal/analyzeEntry',
  async (content: string, { rejectWithValue }) => {
    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append('journal_text', content);
      
      // Attempt to make the API call
      const response = await fetch('http://0.0.0.0:8003/api/journal-analysis', {
        method: 'POST',
        body: formData,
      });

      // If the response is successful, process it normally
      if (response.ok) {
        const data = await response.json();
        
        // Transform questions into the format we need
        const questions = data.questions.map((q: string, index: number) => ({
          id: `q-${index}`,
          text: q
        }));
        
        return { 
          questions, 
          entry: content,
          journalId: data.journalId, // Store the journal ID returned from the backend
          mood: data.mood,
          mood_score: data.mood_score
        };
      } 
      
      // Handle specific error cases
      if (response.status === 401) {
        console.warn('Authentication error: Using fallback questions');
        return { 
          questions: fallbackQuestions, 
          entry: content,
          usedFallback: true,
          errorMessage: 'Authentication error. Using default questions instead.' 
        };
      }
      
      // For other errors, also use fallback
      console.warn(`API error (${response.status}): Using fallback questions`);
      return { 
        questions: fallbackQuestions, 
        entry: content,
        usedFallback: true,
        errorMessage: 'Could not connect to the server. Using default questions instead.' 
      };
    } catch (error) {
      console.error('API Error:', error);
      // Return fallback questions for any exception
      return { 
        questions: fallbackQuestions, 
        entry: content,
        usedFallback: true,
        errorMessage: 'Network error. Using default questions instead.' 
      };
    }
  }
);

export const submitJournalAnswers = createAsyncThunk(
  'journal/submitAnswers',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { journal: JournalState };
    const { journalEntry, followUpQuestions, answers, mood, mood_score, currentJournalId } = state.journal;
    
    try {
      // Check if we have a journal ID from the analysis step
      if (!currentJournalId) {
        return rejectWithValue('No journal ID found. Please submit a journal entry first.');
      }
      
      // Format answers for the API
      const formattedAnswers = answers.map((answer, index) => ({
        question_index: index,
        question: followUpQuestions[index]?.text || `Question ${index + 1}`,
        answer: answer.answer
      }));
      
      // Submit the answers to the journal entry
      const response = await fetch('http://0.0.0.0:8003/api/journal/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journalId: currentJournalId,
          answers: formattedAnswers
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.detail || 'Failed to submit answers');
      }
      
      const data = await response.json();
      return { ...data, journalId: currentJournalId };
    } catch (error) {
      console.error('API Error:', error);
      return rejectWithValue('Network error. Could not submit answers.');
    }
  }
);

const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    setJournalEntry(state, action: PayloadAction<string>) {
      state.journalEntry = action.payload.replace('...', '');
    },
    clearFollowUpQuestions(state) {
      state.followUpQuestions = [];
    },
    startNewJournal(state) {
      state.journalEntry = '';
      state.followUpQuestions = [];
      state.currentJournalId = null;
      state.answers = [];
      state.mood = null;
      state.mood_score = null;
    },
    addQuestionToEntry(state, action: PayloadAction<Question>) {
      state.journalEntry += `\n\n${action.payload.text}\n`;
    },
    addAnswer(state, action: PayloadAction<{questionId: string, answer: string}>) {
      const existingAnswerIndex = state.answers.findIndex(a => a.questionId === action.payload.questionId);
      
      if (existingAnswerIndex >= 0) {
        // Update existing answer
        state.answers[existingAnswerIndex].answer = action.payload.answer;
      } else {
        // Add new answer
        state.answers.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchJournals
      .addCase(fetchJournals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJournals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.journals = action.payload.journals;
        if (action.payload.errorMessage) {
          state.error = action.payload.errorMessage;
        }
      })
      .addCase(fetchJournals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch journals';
      })
      
      // Handle analyzeJournalEntry
      .addCase(analyzeJournalEntry.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(analyzeJournalEntry.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.followUpQuestions = action.payload.questions || [];
        state.journalHistory.push({
          entry: action.payload.entry,
          timestamp: new Date()
        });
        state.currentJournalId = action.payload.journalId || null;
        state.mood = action.payload.mood || null;
        state.mood_score = action.payload.mood_score || null;
        
        if (action.payload.usedFallback) {
          state.error = action.payload.errorMessage || 'Something went wrong. Using default questions.';
        } else {
          state.error = null;
        }
      })
      .addCase(analyzeJournalEntry.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string || 'Failed to analyze journal entry';
      })
      
      // Handle submitJournalAnswers
      .addCase(submitJournalAnswers.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitJournalAnswers.fulfilled, (state) => {
        state.isSubmitting = false;
        // Clear answers after successful submission
        state.answers = [];
        // Optionally clear other state related to the current journal
        state.currentJournalId = null;
        state.followUpQuestions = [];
      })
      .addCase(submitJournalAnswers.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.error.message || 'Failed to submit answers';
      });
  },
});

// Export actions
export const { 
  setJournalEntry, 
  clearFollowUpQuestions,
  startNewJournal,
  addQuestionToEntry,
  addAnswer
} = journalSlice.actions;

// Export the reducer as default
export default journalSlice.reducer;

// Export the async thunks
export { submitJournalAnswers as submitJournalAnswersAsync, analyzeJournalEntry as analyzeJournalEntryAsync };
