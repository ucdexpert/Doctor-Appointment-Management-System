"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { chatAPI, uploadAPI } from "@/lib/api";
import { ChatSession, ChatMessage } from "@/types";
import {
  Plus,
  Trash2,
  MessageSquare,
  Bot,
  Paperclip,
  Send,
  X,
  FileText,
  Search,
  Stethoscope,
  HeartPulse,
  Calendar,
  ChevronRight,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Allowed file types ────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Page Component ────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load sessions on mount ──────────────────────────────────────────────

  useEffect(() => {
    loadSessions();
  }, []);

  // ── Auto-scroll to bottom on new messages ───────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Auto-resize textarea ────────────────────────────────────────────────

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  // ── API calls ───────────────────────────────────────────────────────────

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await chatAPI.getSessions();
      setSessions(response.data);
    } catch {
      toast.error("Failed to load chat sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const response = await chatAPI.getSessionById(sessionId);
      setMessages(response.data.messages || []);
    } catch {
      toast.error("Failed to load messages");
    }
  };

  const createNewSession = async () => {
    try {
      const response = await chatAPI.createSession({ title: "New Chat" });
      const newSession: ChatSession = response.data;
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setInputValue("");
      setSelectedFile(null);
      setSidebarOpen(false);
    } catch {
      toast.error("Failed to create new chat");
    }
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat session?")) return;

    try {
      await chatAPI.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleSessionClick = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    loadSessionMessages(sessionId);
    setSidebarOpen(false);
  };

  // ── File handling ───────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error(`File type not allowed. Allowed: PDF, JPG, PNG, DOC, DOCX`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Send message ────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (messageText?: string) => {
      const text = (messageText || inputValue).trim();
      if (!text && !selectedFile) return;

      // If no session, create one first
      let sessionId = currentSessionId;
      if (!sessionId) {
        try {
          const response = await chatAPI.createSession({ title: text.slice(0, 50) });
          sessionId = response.data.id;
          setCurrentSessionId(sessionId);
          setSessions((prev) => [response.data, ...prev]);
        } catch {
          toast.error("Failed to create chat session");
          return;
        }
      }

      if (loading) return;

      const msgToSend = text || (selectedFile ? `📎 ${selectedFile.name}` : "");

      let fileContext: string | undefined;
      let fileUrl: string | undefined;
      if (selectedFile) {
        setUploadingFile(true);
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          const uploadRes = await uploadAPI.uploadMedicalReport(formData);
          fileContext = uploadRes.data.file_context;
          fileUrl = uploadRes.data.file_url;
        } catch {
          toast.error("Failed to upload file");
          setUploadingFile(false);
          return;
        }
        setUploadingFile(false);
      }

      let userMessageContent = msgToSend;
      if (fileUrl) {
        userMessageContent = `📎 Attached: ${selectedFile?.name}\n\n${msgToSend}`;
      }

      const activeSessionId = sessionId!;

      const userMessage: ChatMessage = {
        id: Date.now(),
        session_id: activeSessionId,
        role: "user",
        content: userMessageContent,
        file_url: fileUrl || null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setInputValue("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const response = await chatAPI.sendMessage(
          activeSessionId,
          msgToSend,
          fileContext,
          fileUrl
        );
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          session_id: activeSessionId,
          role: "assistant",
          content: response.data.reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            session_id: activeSessionId,
            role: "assistant",
            content:
              "Sorry, I'm having trouble connecting right now. Please try again later.",
            created_at: new Date().toISOString(),
          },
        ]);
        toast.error("Failed to get response");
      } finally {
        setLoading(false);
      }
    },
    [inputValue, selectedFile, currentSessionId, loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Booking Link Detection ──────────────────────────────────────────────

  const detectBookingSuggestion = (content: string) => {
    const bookingPattern = /\/patient\/book\/(\d+)/g;
    const matches = [...content.matchAll(bookingPattern)];

    if (matches.length > 0) {
      const doctorId = matches[0][1];
      return { doctorId };
    }
    return null;
  };

  const handleBookNow = (doctorId: string) => {
    router.push(`/patient/book/${doctorId}`);
  };

  // ── Quick Actions ───────────────────────────────────────────────────────

  const quickActions = [
    { icon: Search, label: "Symptom Analysis", prompt: "I have a headache and fever. What should I do?", color: "from-blue-500 to-cyan-500" },
    { icon: Stethoscope, label: "Find Doctors", prompt: "Can you recommend a good cardiologist?", color: "from-green-500 to-emerald-500" },
    { icon: HeartPulse, label: "Health Tips", prompt: "Give me some tips for maintaining good health.", color: "from-purple-500 to-pink-500" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <DashboardLayout role="patient">
      <div className="h-[calc(100vh-56px)] flex overflow-hidden relative bg-white">

        {/* ═══ SIDEBAR OVERLAY (Mobile popup) ═══ */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Dark overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setSidebarOpen(false)}
              />

              {/* Sidebar popup */}
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 z-50 w-72 h-full bg-white border-r border-gray-200 flex flex-col shadow-2xl"
              >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 text-base">Chats</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* New Chat Button */}
                <div className="px-3 py-3">
                  <button
                    onClick={() => {
                      createNewSession();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-gray-700 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto px-3 pb-3">
                  {sessionsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="px-3 py-3 rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">No conversations yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start your first chat</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sessions.map((session) => {
                        const firstMsg = (session.messages?.[0] as ChatMessage | undefined)?.content;
                        const isActive = currentSessionId === session.id;

                        return (
                          <div
                            key={session.id}
                            onClick={() => handleSessionClick(session.id)}
                            className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                              isActive
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <MessageSquare
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-blue-600" : "text-gray-400"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm truncate ${
                                  isActive
                                    ? "text-blue-900 font-medium"
                                    : "text-gray-700"
                                }`}
                              >
                                {truncate(firstMsg || session.title || "New Chat", 30)}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatRelativeDate(session.updated_at)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => deleteSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 shrink-0 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center gap-2.5 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">AI Health Assistant</p>
                      <p className="text-xs text-gray-500">Evidence-based guidance</p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Unified Top Bar */}
          <div className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white text-gray-500 transition-colors"
              title="Open chat history"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  AI Health Assistant
                </h1>
                <p className="text-xs text-gray-500">Evidence-based guidance</p>
              </div>
            </div>
          </div>

          {/* Chat Body */}
          {messages.length === 0 && !currentSessionId ? (
            /* ═══ EMPTY STATE ═══ */
            <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto bg-gray-50/50">
              <div className="w-full max-w-2xl mx-auto">
                {/* Greeting */}
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-5 shadow-lg"
                  >
                    <Bot className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                    AI Health Assistant
                  </h2>
                  <p className="text-gray-500 text-base max-w-md mx-auto">
                    Ask about symptoms, doctors, or health tips. Get evidence-based guidance instantly.
                  </p>
                </div>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        createNewSession();
                        setTimeout(() => handleSendMessage(action.prompt), 300);
                      }}
                      className="flex flex-col items-start p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md bg-white transition-all text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-sm`}
                      >
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1.5">{action.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{action.prompt}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ═══ MESSAGES AREA ═══ */
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <AnimatePresence>
                  {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const bookingInfo = !isUser ? detectBookingSuggestion(msg.content) : null;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {/* AI Avatar */}
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`max-w-[80%] sm:max-w-[70%] ${isUser ? "order-1" : ""}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isUser
                                ? "bg-blue-600 text-white rounded-tr-sm"
                                : "bg-gray-100 text-gray-900 rounded-tl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            {/* Booking Button */}
                            {bookingInfo && (
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <button
                                  onClick={() => handleBookNow(bookingInfo.doctorId)}
                                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                                >
                                  <Calendar className="w-4 h-4" />
                                  Book Appointment
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-1.5 ${
                              isUser ? "text-right text-gray-400" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString("en-PK", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* User Avatar */}
                        {isUser && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
                          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
                          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* ═══ INPUT AREA ═══ */}
          <div className="border-t border-gray-100 bg-white px-4 sm:px-6 py-4 shrink-0">
            <div className="max-w-3xl mx-auto">
              {/* File Chip */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="mb-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200"
                  >
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      onClick={removeSelectedFile}
                      className="p-0.5 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Row */}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadingFile}
                  className="p-3 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about symptoms, doctors..."
                    rows={1}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white disabled:opacity-60 transition-all"
                    disabled={loading || uploadingFile}
                  />
                </div>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={
                    (!inputValue.trim() && !selectedFile) || loading || uploadingFile
                  }
                  className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
                  title="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                AI can make mistakes. Verify important health information with a professional.
              </p>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
