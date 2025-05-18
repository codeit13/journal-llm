import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  CalendarIcon, 
  PlusCircle, 
  Search, 
  Tag, 
  Edit, 
  Trash2, 
  Calendar, 
  ChevronDown,
  Smile,
  Filter,
  MessageSquare
} from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  analyzeJournalEntry,
  setJournalEntry, 
  fetchJournals,
  startNewJournal
} from '../store';
import type { RootState, AppDispatch } from '../store';

// Define the Journal interface based on the API response
interface Journal {
  id: string;
  date: string;
  entry: string;
  questions: string[];
  answers: string[];
  updated_at: string;
}

// Type guard to check if an object is a Journal
function isJournal(obj: any): obj is Journal {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.entry === 'string' &&
    Array.isArray(obj.questions) &&
    Array.isArray(obj.answers) &&
    typeof obj.updated_at === 'string';
}

// Helper function to format dates nicely
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const History = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    journalEntry, 
    isSubmitting,
    isLoading,
    error 
  } = useSelector((state: RootState) => state.journal);
  
  // Access journals from the Redux store and ensure they match our Journal interface
  const journals = useSelector((state: RootState) => {
    const storeJournals = state.journal.journals || [];
    // Ensure each journal matches our interface
    return storeJournals.map((journal: any) => {
      if (isJournal(journal)) return journal;
      // If the journal doesn't match our interface, transform it
      return {
        id: journal.id || '',
        date: journal.date || journal.createdAt || '',
        entry: journal.entry || journal.content || '',
        questions: journal.questions || [],
        answers: journal.answers || [],
        updated_at: journal.updated_at || journal.updatedAt || ''
      } as Journal;
    });
  });
  
  // State for UI controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  
  // Fetch journals when component mounts
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      dispatch(fetchJournals());
    }
  }, [dispatch]);
  
  // Handle creating a new journal entry
  const handleCreateJournal = async () => {
    if (!journalEntry.trim()) {
      toast.error('Please write something in your journal entry');
      return;
    }

    try {
      const resultAction = await dispatch(analyzeJournalEntry(journalEntry));
      if (analyzeJournalEntry.fulfilled.match(resultAction)) {
        toast.success('Journal entry created successfully!');
        // Refresh journals list
        dispatch(fetchJournals());
      } else if (analyzeJournalEntry.rejected.match(resultAction) && resultAction.payload) {
        toast.error(resultAction.payload as string);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };
  
  // Handle journal entry change
  const handleJournalEntryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setJournalEntry(e.target.value));
  };
  
  // Handle opening a journal for viewing
  const handleJournalClick = (journal: Journal) => {
    setSelectedJournal(journal);
    setShowJournalDialog(true);
  };
  
  // Handle starting a new journal
  const navigate = useNavigate();
  const handleStartNewJournal = () => {
    dispatch(startNewJournal());
    // Navigate to home route instead of showing dialog
    navigate('/');
  };
  
  // Filter journals based on search term
  const filteredJournals = journals.filter(journal => {
    const matchesSearch = searchTerm === '' || 
      journal.entry.toLowerCase().includes(searchTerm.toLowerCase()) || 
      journal.questions.some((q: string) => q.toLowerCase().includes(searchTerm.toLowerCase())) ||
      journal.answers.some((a: string) => a.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });
  
  // No tags or moods in the new API response format
  
  // Group journals by date for the "By Date" tab
  const journalsByDate = filteredJournals.reduce((acc, journal) => {
    const date = new Date(journal.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(journal);
    return acc;
  }, {} as Record<string, Journal[]>);
  
  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(journalsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Journal dialogs */}

      {/* Journal View Dialog */}
      <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedJournal && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>Journal Entry</DialogTitle>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(selectedJournal.date)}
                  </div>
                </div>
                <DialogDescription>
                  Last updated: {formatDate(selectedJournal.updated_at)}
                </DialogDescription>
              </DialogHeader>
              
              {/* Main journal entry */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Initial Journal Entry</h3>
                <div className="whitespace-pre-wrap">
                  {selectedJournal.entry}
                </div>
              </div>
              
              {/* Questions and answers using accordion */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Follow-up Questions & Responses</h3>
                <Accordion type="single" collapsible className="w-full">
                  {selectedJournal.questions.map((question, index) => (
                    <AccordionItem key={index} value={`question-${index}`} className="border rounded-lg mb-3 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex gap-2 items-center text-left">
                          <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            Q
                          </div>
                          <div className="font-medium">{question}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8">
                        {selectedJournal.answers[index] ? (
                          <div className="flex gap-2 items-center">
                            <div className="bg-secondary/90 text-black dark:text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                              A
                            </div>
                            <div className="text-muted-foreground">
                              {selectedJournal.answers[index]}
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground italic">No answer provided</div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowJournalDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Journal</h1>
          <p className="text-muted-foreground">
            Record and reflect on your daily thoughts and experiences
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button onClick={handleStartNewJournal} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="px-6 py-3 mb-6 text-sm bg-amber-50 border border-amber-200 rounded-md text-amber-600">
          <span className="font-medium">Note:</span> {error}
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journals..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {searchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="byDate">By Date</TabsTrigger>
        </TabsList>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredJournals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No journal entries found</div>
            <Button onClick={handleStartNewJournal}>
              Create Your First Entry
            </Button>
          </div>
        )}

        {/* All entries tab */}
        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJournals.map((journal) => (
              <motion.div 
                key={journal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="h-full cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleJournalClick(journal)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Journal Entry</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(journal.date)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {truncateText(journal.entry, 150)}
                    </p>
                    <div className="mt-3 flex items-center text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>{journal.questions.length} follow-up questions</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 pt-0">
                    <Badge variant="outline" className="text-xs">
                      Last updated: {formatDate(journal.updated_at)}
                    </Badge>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* By date tab */}
        <TabsContent value="byDate" className="mt-0">
          <div className="space-y-8">
            {sortedDates.map(date => (
              <div key={date}>
                <div className="flex items-center mb-4">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <h3 className="text-lg font-medium">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {journalsByDate[date].map((journal) => (
                    <motion.div 
                      key={journal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card 
                        className="h-full cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleJournalClick(journal)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">Journal Entry</CardTitle>
                            <div className="text-xs text-muted-foreground">
                              {new Date(journal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            {truncateText(journal.entry, 150)}
                          </p>
                          <div className="mt-3 flex items-center text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            <span>{journal.questions.length} follow-up questions</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2 pt-0">
                          <Badge variant="outline" className="text-xs">
                            Last updated: {formatDate(journal.updated_at)}
                          </Badge>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
