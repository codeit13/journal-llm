import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
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
  Filter
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
  submitJournalEntry,
  setJournalEntry, 
  fetchJournals,
  startNewJournal,
  type Journal
} from '../store';
import type { RootState, AppDispatch } from '../store';

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

const Journaling = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    journalEntry, 
    isSubmitting,
    isLoading,
    journals,
    error 
  } = useSelector((state: RootState) => state.journal);
  
  // State for UI controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [showNewJournalDialog, setShowNewJournalDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Fetch journals when component mounts
  useEffect(() => {
    dispatch(fetchJournals());
  }, [dispatch]);
  
  // Handle creating a new journal entry
  const handleCreateJournal = async () => {
    if (!journalEntry.trim()) {
      toast.error('Please write something in your journal entry');
      return;
    }

    try {
      const resultAction = await dispatch(submitJournalEntry(journalEntry));
      if (submitJournalEntry.fulfilled.match(resultAction)) {
        setShowNewJournalDialog(false);
        toast.success('Journal entry created successfully!');
        // Refresh journals list
        dispatch(fetchJournals());
      } else if (submitJournalEntry.rejected.match(resultAction) && resultAction.payload) {
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
  const handleStartNewJournal = () => {
    dispatch(startNewJournal());
    setShowNewJournalDialog(true);
  };
  
  // Filter journals based on search term, selected tag, and mood
  const filteredJournals = journals.filter(journal => {
    const matchesSearch = searchTerm === '' || 
      journal.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      journal.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTag === null || 
      (journal.tags && journal.tags.includes(selectedTag));
    
    const matchesMood = selectedMood === null || 
      journal.mood === selectedMood;
    
    return matchesSearch && matchesTag && matchesMood;
  });
  
  // Get all unique tags from journals
  const allTags = Array.from(new Set(
    journals.flatMap(journal => journal.tags || [])
  ));
  
  // Get all unique moods from journals
  const allMoods = Array.from(new Set(
    journals.filter(journal => journal.mood).map(journal => journal.mood as string)
  ));
  
  // Group journals by date for the "By Date" tab
  const journalsByDate = filteredJournals.reduce((acc, journal) => {
    const date = new Date(journal.createdAt).toLocaleDateString();
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
      {/* New Journal Dialog */}
      <Dialog open={showNewJournalDialog} onOpenChange={setShowNewJournalDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Journal Entry</DialogTitle>
            <DialogDescription>
              Write your thoughts, reflections, or experiences. Be as detailed or brief as you'd like.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input 
                placeholder="Title (optional)" 
                className="mb-2"
                value={journalEntry.split('\n')[0] || ''}
                onChange={(e) => {
                  const title = e.target.value;
                  const content = journalEntry.split('\n').slice(1).join('\n');
                  dispatch(setJournalEntry(`${title}\n${content}`));
                }}
              />
              <Textarea
                placeholder="How was your day today?"
                value={journalEntry.split('\n').slice(1).join('\n')}
                onChange={(e) => {
                  const title = journalEntry.split('\n')[0] || '';
                  dispatch(setJournalEntry(`${title}\n${e.target.value}`));
                }}
                className="min-h-[300px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJournalDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateJournal} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Journal View Dialog */}
      <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedJournal && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>{selectedJournal.title}</DialogTitle>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(selectedJournal.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedJournal.mood && (
                    <Badge variant="secondary">
                      <Smile className="mr-1 h-3 w-3" />
                      {selectedJournal.mood}
                    </Badge>
                  )}
                  {selectedJournal.tags && selectedJournal.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </DialogHeader>
              <div className="mt-4 whitespace-pre-wrap">
                {selectedJournal.content}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                {selectedTag ? `Tag: ${selectedTag}` : 'Filter by Tag'}
                {selectedTag && (
                  <span 
                    className="ml-2 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTag(null);
                    }}
                  >
                    ×
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <div className="font-medium">Filter by Tag</div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant={selectedTag === tag ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {allTags.length === 0 && (
                    <div className="text-sm text-muted-foreground">No tags found</div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Smile className="mr-2 h-4 w-4" />
                {selectedMood ? `Mood: ${selectedMood}` : 'Filter by Mood'}
                {selectedMood && (
                  <span 
                    className="ml-2 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMood(null);
                    }}
                  >
                    ×
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <div className="font-medium">Filter by Mood</div>
                <div className="flex flex-wrap gap-2">
                  {allMoods.map(mood => (
                    <Badge 
                      key={mood} 
                      variant={selectedMood === mood ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedMood(mood)}
                    >
                      {mood}
                    </Badge>
                  ))}
                  {allMoods.length === 0 && (
                    <div className="text-sm text-muted-foreground">No moods found</div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {(selectedTag || selectedMood || searchTerm) && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedTag(null);
                setSelectedMood(null);
                setSearchTerm('');
              }}
            >
              Clear Filters
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
                      <CardTitle className="text-lg">{journal.title}</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(journal.createdAt)}
                      </div>
                    </div>
                    {journal.mood && (
                      <Badge variant="secondary" className="mt-2">
                        {journal.mood}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {truncateText(journal.content, 150)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 pt-0">
                    {journal.tags && journal.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
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
                            <CardTitle className="text-lg">{journal.title}</CardTitle>
                            <div className="text-xs text-muted-foreground">
                              {new Date(journal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {journal.mood && (
                            <Badge variant="secondary" className="mt-2">
                              {journal.mood}
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            {truncateText(journal.content, 150)}
                          </p>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2 pt-0">
                          {journal.tags && journal.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
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

export default Journaling;
