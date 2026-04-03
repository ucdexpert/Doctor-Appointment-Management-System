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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="patient">
      <div className="h-[calc(100vh-56px)] flex overflow-hidden relative">
        {/* ═══ SIDEBAR OVERLAY (Mobile) ═══ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══ LEFT PANEL – Chat History Sidebar ═══ */}
        <aside
          className={`
            fixed md:relative z-50 md:z-auto
            top-0 md:top-0 left-0 h-full md:h-auto
            w-72 shrink-0 bg-white border-r border-gray-200
            flex flex-col overflow-hidden
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Chats</h2>
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
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Start your first health query
                </p>
                <button
                  onClick={() => {
                    createNewSession();
                    setSidebarOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
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
                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors relative ${
                      isActive
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-gray-600" : "text-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isActive ? "text-gray-900 font-medium" : "text-gray-600"
                        }`}
                      >
                        {truncate(firstMsg || session.title || "New Chat", 28)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatRelativeDate(session.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 shrink-0"
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
            <div className="px-3 py-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 text-center">
                {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </aside>

        {/* ═══ RIGHT PANEL – Chat Area ═══ */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Chat Header ── */}
          <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                title="Toggle sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    AI Assistant
                  </p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Online
            </span>
          </div>

          {/* ── Chat Body ── */}
          {!currentSessionId ? (
            /* ═══════ Welcome Screen ═══════ */
            <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
              <div className="w-full max-w-2xl mx-auto">
                {/* Bot Icon + Title */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    AI Health Assistant
                  </h1>
                  <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">
                    Ask about symptoms, doctors, or health tips. I'm here to help you make
                    better health decisions.
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  <div className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer">
                    <Search className="w-5 h-5 text-indigo-600 mb-2" />
                    <p className="text-sm font-medium text-gray-800">Symptom Analysis</p>
                    <p className="text-xs text-gray-400 mt-1">Describe symptoms</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer">
                    <Stethoscope className="w-5 h-5 text-indigo-600 mb-2" />
                    <p className="text-sm font-medium text-gray-800">Find Doctors</p>
                    <p className="text-xs text-gray-400 mt-1">Get recommendations</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer">
                    <HeartPulse className="w-5 h-5 text-indigo-600 mb-2" />
                    <p className="text-sm font-medium text-gray-800">Health Tips</p>
                    <p className="text-xs text-gray-400 mt-1">General guidance</p>
                  </div>
                </div>

                {/* Start Button */}
                <div className="text-center">
                  <button
                    onClick={createNewSession}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
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
                className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-4 bg-white"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Say hello to get started
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isUser
                            ? "bg-indigo-600"
                            : "bg-gray-200"
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
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isUser
                            ? "bg-indigo-600 text-white rounded-tr-md"
                            : "bg-gray-100 text-gray-800 rounded-tl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1.5 ${
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
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
                        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
                        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── File chip ── */}
              {selectedFile && (
                <div className="px-3 md:px-4 pt-2 bg-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      onClick={removeSelectedFile}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Input area ── */}
              <div className="border-t border-gray-200 bg-white px-3 md:px-4 py-3 shrink-0">
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
                    className="p-2.5 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
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
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white disabled:opacity-60 transition-all"
                      disabled={loading || uploadingFile}
                    />
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={
                      (!inputValue.trim() && !selectedFile) || loading || uploadingFile
                    }
                    className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
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
