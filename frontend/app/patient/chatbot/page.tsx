"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { chatAPI } from "@/lib/api";
import { ChatSession, ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function ChatbotPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const response = await chatAPI.getSessions();
      setSessions(response.data);
      if (response.data.length > 0 && !currentSessionId) {
        setCurrentSessionId(response.data[0].id);
      }
    } catch (error: any) {
      console.error("Failed to load chat sessions");
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const response = await chatAPI.getSessionById(sessionId);
      setMessages(response.data.messages || []);
    } catch (error: any) {
      console.error("Failed to load messages");
    }
  };

  const createNewSession = async () => {
    try {
      const response = await chatAPI.createSession({ title: "New Chat" });
      const newSession = response.data;
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      toast.success("New chat started");
    } catch (error: any) {
      toast.error("Failed to create new chat");
    }
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Delete this chat session?")) return;

    try {
      await chatAPI.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch (error: any) {
      toast.error("Failed to delete chat");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSessionId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      session_id: currentSessionId, 
      role: "user", 
      content: userMessage,
      created_at: new Date().toISOString()
    }]);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(currentSessionId, userMessage);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        session_id: currentSessionId, 
        role: "assistant", 
        content: response.data.reply,
        created_at: new Date().toISOString()
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        session_id: currentSessionId, 
        role: "assistant", 
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        created_at: new Date().toISOString()
      }]);
      toast.error("Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="h-[calc(100vh-80px)] flex gap-4">
        {/* Sessions Sidebar - Mobile Responsive */}
        {sidebarOpen && (
          <Card className="w-64 shrink-0 overflow-hidden flex flex-col border-0 shadow-lg">
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white">Chat History</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={createNewSession}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No chat history</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setCurrentSessionId(session.id)}
                    className={`
                      group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                      ${currentSessionId === session.id
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-700"
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.title || "New Chat"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col border-0 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-white/20"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-white">AI Health Assistant</h1>
                  <p className="text-xs text-blue-100">Ask about symptoms, doctors, or health tips</p>
                </div>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {!currentSessionId ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome to AI Health Assistant
                  </h3>
                  <p className="text-gray-600 mb-4">
                    I can help you with health-related questions, symptom analysis, and doctor recommendations.
                  </p>
                  <Button onClick={createNewSession} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Start a conversation below</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <MessageBubble key={msg.id || index} message={msg} />
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-200">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, doctors, or health tips..."
                disabled={loading || !currentSessionId}
                className="flex-1 h-12"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !currentSessionId}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              AI can make mistakes. Always consult a real doctor for medical advice.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? "bg-blue-600" : "bg-gradient-to-br from-blue-500 to-indigo-500"
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? "bg-blue-600 text-white rounded-tr-sm"
          : "bg-white text-gray-800 rounded-tl-sm border border-gray-200"
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
