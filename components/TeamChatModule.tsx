'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { ChatMessage } from '@/lib/types';
import { 
  Send, 
  Mic, 
  Square, 
  Paperclip, 
  HardDrive, 
  Play, 
  Pause, 
  Volume2, 
  User, 
  Shield, 
  Sparkles,
  CheckCheck
} from 'lucide-react';

export function TeamChatModule() {
  const { teamMember, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Firestore Real-time listener via onSnapshot
  useEffect(() => {
    const q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'), limit(80));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          senderUid: data.senderUid || '',
          senderEmail: data.senderEmail || '',
          senderName: data.senderName || 'Team Member',
          senderRole: data.senderRole || 'member',
          type: data.type || 'text',
          content: data.content || '',
          audioUrl: data.audioUrl,
          audioDuration: data.audioDuration,
          fileName: data.fileName,
          driveFileId: data.driveFileId,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });

    return () => unsubscribe();
  }, []);

  // Send standard text message
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !teamMember) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, 'chat_messages'), {
        senderUid: teamMember.uid || teamMember.email,
        senderEmail: teamMember.email,
        senderName: teamMember.displayName,
        senderRole: teamMember.role,
        type: 'text',
        content: messageText,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to send text message:', err);
    }
  };

  // Start Audio Recording via browser MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAndSendAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      alert('Microphone permission required for voice notes. Please allow microphone access.');
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Upload recorded audio to Admin's Google Drive via API Route
  const uploadAndSendAudio = async (blob: Blob) => {
    if (!teamMember) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      const fileName = `voice_note_${Date.now()}.webm`;
      formData.append('file', blob, fileName);
      formData.append('category', 'voice_notes');

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      const uploaded = json.data;

      // Add to Firestore chat stream
      await addDoc(collection(db, 'chat_messages'), {
        senderUid: teamMember.uid || teamMember.email,
        senderEmail: teamMember.email,
        senderName: teamMember.displayName,
        senderRole: teamMember.role,
        type: 'voice',
        content: `Voice Note (${recordingDuration}s)`,
        audioUrl: uploaded.previewUrl,
        audioDuration: recordingDuration,
        driveFileId: uploaded.fileId,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Failed to upload audio to Admin Drive:', err);
      alert(`Voice upload note: ${err.message || 'Error uploading to Drive'}`);
    } finally {
      setIsUploading(false);
      setRecordingDuration(0);
    }
  };

  // File Upload to Admin Drive
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teamMember) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'general');

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const uploaded = json.data;

      await addDoc(collection(db, 'chat_messages'), {
        senderUid: teamMember.uid || teamMember.email,
        senderEmail: teamMember.email,
        senderName: teamMember.displayName,
        senderRole: teamMember.role,
        type: 'file',
        content: `Uploaded file: ${file.name}`,
        audioUrl: uploaded.previewUrl,
        fileName: file.name,
        driveFileId: uploaded.fileId,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert(`File upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const playVoiceNote = (url: string) => {
    if (currentlyPlayingAudio === url) {
      audioPlayerRef.current?.pause();
      setCurrentlyPlayingAudio(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play();
        setCurrentlyPlayingAudio(url);
        audioPlayerRef.current.onended = () => setCurrentlyPlayingAudio(null);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] sm:h-[680px] lg:h-[720px] bg-slate-900 border-0 sm:border border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
      {/* Hidden audio element for preview */}
      <audio ref={audioPlayerRef} className="hidden" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-md">
              3P
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide truncate">Trio Team Hub Channel</h2>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-medium border border-sky-500/20 whitespace-nowrap shrink-0">
                Live Firestore
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">Sachin (Admin), Alex & Maya &bull; Encrypted line</p>
          </div>
        </div>

        {/* 5 TB Drive Storage Quota Notice */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs bg-slate-800/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700/60 text-slate-300 self-start sm:self-auto shrink-0">
          <HardDrive className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
          <span>Storage: <strong className="text-white">Admin 5 TB Drive</strong></span>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 bg-slate-950/60 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-sky-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No messages yet</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Say hello to the POD team! You can type text or hold the microphone button to record a voice note directly to Sachin&apos;s 5 TB drive.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = teamMember?.email.toLowerCase() === msg.senderEmail.toLowerCase();
            const isAdminSender = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender badge & time */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className={`text-[11px] font-semibold ${isAdminSender ? 'text-amber-400' : 'text-sky-400'}`}>
                    {msg.senderName}
                  </span>
                  {isAdminSender && (
                    <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble - Material 3 Expressive with rounded-[24px] geometry */}
                <div
                  className={`max-w-[85%] sm:max-w-md rounded-[24px] px-4.5 sm:px-5 py-3.5 shadow-md transition-all ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-950/40'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/50 rounded-bl-sm shadow-black/30'
                  }`}
                >
                  {/* Voice Note Type */}
                  {msg.type === 'voice' ? (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <button
                        onClick={() => msg.audioUrl && playVoiceNote(msg.audioUrl)}
                        className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                          isMe ? 'bg-white text-indigo-700 hover:bg-slate-100' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                        title="Play voice note"
                      >
                        {currentlyPlayingAudio === msg.audioUrl ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold flex items-center gap-1.5 tracking-tight">
                            <Volume2 className="w-3.5 h-3.5" /> Voice Note
                          </span>
                          <span className={`text-[11px] font-medium ${isMe ? 'text-indigo-100' : 'text-slate-300'}`}>
                            {msg.audioDuration ? `${msg.audioDuration}s` : 'Audio'}
                          </span>
                        </div>
                        {/* Audio Waveform representation */}
                        <div className="flex items-center gap-0.5 h-3.5">
                          {[40, 75, 30, 90, 60, 45, 80, 50, 70, 35, 65, 85, 40].map((h, i) => (
                            <div
                              key={i}
                              style={{ height: `${h}%` }}
                              className={`w-1 rounded-full ${isMe ? 'bg-white/85' : 'bg-indigo-400/80'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : msg.type === 'file' ? (
                    <div>
                      <p className="text-sm font-medium">{msg.content}</p>
                      {msg.audioUrl && (
                        <a
                          href={msg.audioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-2.5 inline-flex items-center gap-1.5 text-xs px-3.5 py-2 min-h-[40px] rounded-full border transition-all cursor-pointer ${
                            isMe 
                              ? 'bg-indigo-700/80 hover:bg-indigo-800 text-white border-indigo-400/30' 
                              : 'bg-slate-900/80 hover:bg-slate-900 text-sky-300 border-slate-700/60'
                          }`}
                        >
                          <HardDrive className="w-3.5 h-3.5" />
                          Open in Admin Drive
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <CheckCheck className={`w-3 h-3 ${isMe ? 'text-indigo-400' : 'text-slate-600'}`} />
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Elevated Rounded-Full Pill Input Bar (Material 3 Expressive) */}
      <div className="sticky bottom-0 z-20 p-2 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent flex flex-col items-center justify-center shrink-0">
        {/* Uploading progress notification */}
        {isUploading && (
          <div className="mb-2 w-full max-w-lg bg-sky-950/90 border border-sky-800/80 px-4 py-2 rounded-full flex items-center justify-center gap-2 text-sky-200 text-xs shadow-lg backdrop-blur-md">
            <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Streaming upload to Admin 5 TB Google Drive...</span>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Pill Container */}
        {isRecording ? (
          /* Active Voice Note Recording Pill */
          <div className="w-full max-w-3xl bg-slate-900/95 backdrop-blur-xl border border-red-500/50 shadow-2xl shadow-red-950/50 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between gap-2 transition-all animate-pulse">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-600 text-white shrink-0 shadow-md shadow-red-600/40">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                <Mic className="w-4 h-4 relative z-10" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-semibold text-red-200 uppercase tracking-wider hidden xs:inline">
                  Recording Note
                </span>
                <span className="font-mono text-xs font-bold text-red-300 bg-red-950/90 border border-red-800/80 px-2 sm:px-2.5 py-0.5 rounded-full">
                  {formatTime(recordingDuration)}
                </span>
              </div>

              {/* Expressive Audio Equalizer Animation */}
              <div className="hidden sm:flex items-center gap-1 px-2 h-5">
                {[12, 22, 10, 26, 16, 12, 24, 14, 20].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-red-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDuration: `${500 + (i % 3) * 180}ms`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={stopRecording}
              className="cursor-pointer min-h-[38px] px-3.5 sm:px-4 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
              title="Stop and send to Admin 5TB Drive"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Send Note</span>
            </button>
          </div>
        ) : (
          /* Normal Message Input Pill */
          <form
            onSubmit={handleSendText}
            className="w-full max-w-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/70 shadow-2xl shadow-black/50 rounded-full p-1.5 sm:p-2 flex items-center gap-1 sm:gap-1.5 transition-all"
          >
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-full transition-all shrink-0"
              title="Upload file to Admin Drive"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message Sachin, Suraj, and Member 3..."
              disabled={isRecording || isUploading}
              className="flex-1 min-w-0 bg-transparent border-0 text-slate-100 placeholder-slate-400 text-xs sm:text-sm px-2.5 sm:px-3 py-2 focus:outline-none"
            />

            {/* Voice Note Button with subtle hover animation */}
            <button
              type="button"
              onClick={startRecording}
              disabled={isUploading}
              className="cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 rounded-full transition-all shrink-0 group relative"
              title="Record Voice Note (Direct to Admin 5TB Drive)"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isUploading}
              className="cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white rounded-full transition-all shadow-md shadow-indigo-950/40 shrink-0 hover:scale-105 active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
