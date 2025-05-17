import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onTranscriptReady: (transcript: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptReady }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(20, 184, 166, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
      }
      .pulse {
        animation: pulse 2s infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Here you would send the audio to a speech-to-text service
        // For now, we'll simulate it
        setIsTranscribing(true);
        toast.info("Converting speech to text...");
        
        // Simulate a realistic delay for speech-to-text processing
        setTimeout(() => {
          // Generate a realistic response
          const transcript = "Today I had a productive day. I completed several tasks that I had been putting off and felt a sense of accomplishment. I also took some time to relax and enjoy a hobby.";
          
          setAudioTranscript(transcript);
          setIsTranscribing(false);
          toast.success("Speech converted to text");
        }, 2000);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
      
      // Visual feedback for recording
      const pulseAnimation = () => {
        const recordButton = document.getElementById('record-button');
        if (recordButton && isRecording) {
          recordButton.classList.add('pulse');
          setTimeout(() => {
            recordButton.classList.remove('pulse');
            if (isRecording) setTimeout(pulseAnimation, 1500);
          }, 1500);
        }
      };
      
      setTimeout(pulseAnimation, 100);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };
  
  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks on the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      toast.info("Recording stopped");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-6 bg-teal-50/30 dark:bg-teal-900/10 rounded-xl border border-dashed border-teal-200 dark:border-teal-800/30"
    >
      <div className="relative mb-4">
        <Button
          id="record-button"
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="lg"
          className={`rounded-full p-8 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30"}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8 text-teal-500" />
          )}
        </Button>
        {isRecording && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse">
            REC
          </div>
        )}
      </div>
      
      <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">
        {isRecording ? "Recording in progress..." : "Tap to start recording"}
      </p>
      <p className="text-xs text-teal-600/70 dark:text-teal-400/70 max-w-md text-center">
        {isRecording 
          ? "Speak clearly about your day. Tap the button again when you're finished." 
          : "Share the highlights and challenges of your day using your voice."}
      </p>
      
      {isTranscribing && (
        <div className="mt-4 flex items-center gap-2 text-teal-600 dark:text-teal-400">
          <div className="animate-spin h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full"></div>
          <span className="text-sm">Converting speech to text...</span>
        </div>
      )}
      
      {audioTranscript && (
        <div className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-teal-200 dark:border-teal-800/50 w-full max-w-md">
          <h4 className="text-sm font-medium text-teal-800 dark:text-teal-300 mb-2 flex items-center">
            <Volume2 className="h-3 w-3 mr-1" /> Transcription
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {audioTranscript}
          </p>
          <div className="flex justify-end mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
              onClick={() => onTranscriptReady(audioTranscript)}
            >
              Use this text
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AudioRecorder;
