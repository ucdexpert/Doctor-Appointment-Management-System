"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { chatAPI, uploadAPI } from "@/lib/api";
import { ChatSession, ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
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
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { toast } from "sonner";

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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
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
  }, [messages]);

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
    try {
      const response = await chatAPI.getSessions();
      setSessions(response.data);
    } catch {
      console.error("Failed to load chat sessions");
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const response = await chatAPI.getSessionById(sessionId);
      setMessages(response.data.messages || []);
    } catch {
      console.error("Failed to load messages");
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
      toast.success("New chat started");
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
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
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
      if (!currentSessionId || loading) return;

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

      const userMessage: ChatMessage = {
        id: Date.now(),
        session_id: currentSessionId,
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

      try {
        const response = await chatAPI.sendMessage(
          currentSessionId,
          msgToSend,
          fileContext,
          fileUrl
        );
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          session_id: currentSessionId,
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
            session_id: currentSessionId,
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

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="patient">
      <div className="h-[calc(100vh-56px)] flex overflow-hidden relative">
        {/* Inject custom styles */}
        <style jsx global>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            50% { box-shadow: 0 0 20px 10px rgba(99, 102, 241, 0); }
          }
          .typing-dot {
            animation: typing 1.4s infinite ease-in-out;
          }
          .typing-dot:nth-child(1) { animation-delay: 0s; }
          .typing-dot:nth-child(2) { animation-delay: 0.2s; }
          .typing-dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
          }
        `}</style>

        {/* ═══ SIDEBAR OVERLAY (Mobile) ═══ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══ LEFT PANEL – Chat History Sidebar ═══ */}
        <aside
          className={`
            fixed md:relative z-50 md:z-auto
            top-0 md:top-0 left-0 h-full md:h-auto
            w-80 shrink-0 bg-white border-r border-gray-200
            flex flex-col overflow-hidden
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-lg">Chats</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
              <button
                onClick={createNewSession}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                title="New chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg" style={{ animation: "float 3s ease-in-out infinite" }}>
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">No conversations yet</p>
                <p className="text-xs text-gray-400 mb-5">
                  Start your first health query
                </p>
                <button
                  onClick={() => {
                    createNewSession();
                    setSidebarOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>
              </div>
            ) : (
              sessions.map((session) => {
                const firstMsg = (session.messages?.[0] as ChatMessage | undefined)?.content;
                const isActive = currentSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    className={`group flex items-center gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all relative ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gray-100"
                    }`}>
                      <MessageSquare
                        className={`w-4 h-4 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isActive ? "text-gray-900 font-medium" : "text-gray-600"
                        }`}
                      >
                        {truncate(firstMsg || session.title || "New Chat", 30)}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatRelativeDate(session.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {sessions.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={createNewSession}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>
          )}
        </aside>

        {/* ═══ RIGHT PANEL – Chat Area ═══ */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Chat Header ── */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                title="Toggle sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    AI Assistant
                  </p>
                  <p className="text-xs text-gray-500">Powered by AI</p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500" style={{ animation: "pulse-glow 2s infinite" }} />
              Online
            </span>
          </div>

          {/* ── Chat Body ── */}
          {!currentSessionId ? (
            /* ═══════ Welcome Screen ═══════ */
            <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto bg-gradient-to-br from-gray-50 to-indigo-50/30">
              <div className="w-full max-w-3xl mx-auto" style={{ animation: "fadeSlideUp 0.5s ease-out both" }}>
                {/* Bot Icon + Title */}
                <div className="text-center mb-10">
                  <div className="relative inline-block mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl" style={{ animation: "float 3s ease-in-out infinite" }}>
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                    AI Health Assistant
                  </h1>
                  <p className="text-gray-600 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                    Ask about symptoms, doctors, or health tips. I'm here to help you make
                    better health decisions.
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  <div className="group flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer" style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Symptom Analysis</p>
                    <p className="text-xs text-gray-500 text-center">Describe symptoms</p>
                  </div>
                  <div className="group flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer" style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Find Doctors</p>
                    <p className="text-xs text-gray-500 text-center">Get recommendations</p>
                  </div>
                  <div className="group flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer" style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <HeartPulse className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Health Tips</p>
                    <p className="text-xs text-gray-500 text-center">General guidance</p>
                  </div>
                </div>

                {/* Start Button */}
                <div className="text-center" style={{ animation: "fadeSlideUp 0.5s ease-out 0.4s both" }}>
                  <button
                    onClick={createNewSession}
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Start New Chat
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════ Active Chat ═══════ */
            <>
              {/* Messages */}
              <div
                ref={bottomRef}
                className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4 bg-gradient-to-br from-gray-50 to-indigo-50/20"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Say hello to get started
                    </p>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                      style={{ animation: `fadeSlideUp 0.3s ease-out ${index * 0.05}s both` }}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                          isUser
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                            : "bg-gradient-to-br from-gray-200 to-gray-300"
                        }`}
                      >
                        {isUser ? (
                          <svg
                            className="w-4 h-4 text-white"
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
                        ) : (
                          <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 text-sm shadow-md ${
                          isUser
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-md"
                            : "bg-white text-gray-800 rounded-tl-md border border-gray-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-[10px] mt-2 ${
                            isUser ? "text-indigo-200" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString("en-PK", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex items-end gap-2.5" style={{ animation: "fadeSlideUp 0.3s ease-out both" }}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-md px-5 py-4 shadow-md border border-gray-200">
                      <div className="flex gap-2">
                        <span className="typing-dot w-2.5 h-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full inline-block" />
                        <span className="typing-dot w-2.5 h-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full inline-block" />
                        <span className="typing-dot w-2.5 h-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full inline-block" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── File chip ── */}
              {selectedFile && (
                <div className="px-4 md:px-6 pt-3 bg-white">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      onClick={removeSelectedFile}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Input area ── */}
              <div className="border-t border-gray-200 bg-white px-4 md:px-6 py-4 shrink-0">
                <div className="flex items-end gap-3">
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
                    className="p-3 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 hover:scale-110"
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
                      placeholder="Message AI Assistant..."
                      rows={1}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white disabled:opacity-60 transition-all"
                      disabled={loading || uploadingFile}
                    />
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={
                      (!inputValue.trim() && !selectedFile) || loading || uploadingFile
                    }
                    className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 hover:scale-110 shadow-md hover:shadow-lg"
                    title="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
