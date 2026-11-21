import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Compass,
  Layers,
  Maximize2,
  MessageSquare,
  Minimize2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { queryCustomerRAG } from '../services/api';
import { ChatMessage, LocationId, NavigationAction } from '../types';

interface ChatWidgetProps {
  selectedLocation: LocationId;
  onOpenFullApp?: () => void;
  onNavigate?: (action: NavigationAction) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  selectedLocation,
  onOpenFullApp,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'widget-welcome',
      sender: 'assistant',
      text: 'Hi there! I am your store Concierge. Ask me anything about stock, store hours, order status, or allergen details!',
      timestamp: 'Just now',
      suggestedFollowUps: [
        'Check Ethiopia Guji stock',
        'Is our oat milk gluten-free?',
        'Downtown Café hours?',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || isTyping) return;

    const userMsg: ChatMessage = {
      id: `w-usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await queryCustomerRAG(q, selectedLocation);
      if (res) {
        setMessages((prev) => [
          ...prev,
          {
            id: `w-bot-${Date.now()}`,
            sender: 'assistant',
            text: res.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            retrievedChunks: res.retrievedChunks,
            suggestedFollowUps: res.suggestedFollowUps,
            modelUsed: res.modelUsed,
            navigationAction: res.navigationAction,
          },
        ]);

        if (res.navigationAction?.autoNavigate && onNavigate) {
          onNavigate(res.navigationAction);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `w-bot-${Date.now()}`,
            sender: 'assistant',
            text: 'I could not retrieve live records right now. Please check the Inventory Ledger directly.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      //
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-14 px-5 rounded-full bg-[#1B4332] text-white shadow-xl hover:bg-[#164E37] flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-[#74A892]/40"
          aria-label="Open Customer Chatbot"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 border-2 border-[#1B4332] animate-pulse" />
          </div>
          <span className="text-[13px] font-semibold tracking-wide">
            Ask Concierge
          </span>
          <Sparkles className="w-4 h-4 text-[#D8F3DC] opacity-80 group-hover:opacity-100" />
        </button>
      )}

      {/* Floating Chat Modal Pop-Up */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[540px] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#1B4332] text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#D8F3DC]" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5 leading-none">
                  Artisan Concierge
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[11px] text-[#D8F3DC] opacity-90 mt-1">
                  RAG Grounded • {selectedLocation.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onOpenFullApp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullApp();
                  }}
                  title="Expand to Full Application"
                  className="p-1.5 hover:bg-white/10 rounded text-white/80 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                className="p-1.5 hover:bg-white/10 rounded text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F9FAFB]/70 text-xs">
            {messages.map((m) => {
              const isBot = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[82%] space-y-1.5`}>
                    <div
                      className={`p-3 rounded-xl shadow-xs leading-relaxed whitespace-pre-line ${
                        isBot
                          ? 'bg-white text-[#1F2937] border border-[#E5E7EB]'
                          : 'bg-[#1B4332] text-white rounded-br-none'
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* AI In-App Navigation Action Button */}
                    {isBot && m.navigationAction && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate?.(m.navigationAction!);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-[#EBF7EE] to-[#F3F9F5] hover:from-[#D8F3DC] hover:to-[#EBF7EE] border border-[#2D6A4F]/30 flex items-center justify-between gap-2 transition-all cursor-pointer group shadow-xs active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-[#1B4332] text-white flex items-center justify-center shrink-0">
                            <Compass className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-[#1B4332]">
                              AI Navigation
                            </div>
                            <span className="text-[11px] font-bold text-[#111827] truncate block">
                              {m.navigationAction.label}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#1B4332] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}

                    {/* Citations Count Tag */}
                    {isBot && m.retrievedChunks && m.retrievedChunks.length > 0 && (
                      <span className="text-[10px] text-[#2D6A4F] bg-[#D8F3DC] px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                        <Layers className="w-3 h-3" />
                        {m.retrievedChunks.length} sources verified
                      </span>
                    )}

                    {/* Quick Follow-up Chips */}
                    {isBot && m.suggestedFollowUps && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {m.suggestedFollowUps.slice(0, 3).map((chip, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(chip)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white hover:bg-[#D8F3DC] text-[#2D6A4F] border border-[#D8F3DC] transition-colors"
                          >
                            ↳ {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                <div className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center animate-pulse">
                  <Bot className="w-3 h-3" />
                </div>
                <span>Checking store records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="p-3 border-t border-[#E5E7EB] bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about stock, hours, orders..."
              disabled={isTyping}
              className="flex-1 h-9 px-3 text-xs bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="h-9 px-3 rounded-lg bg-[#1B4332] text-white hover:bg-[#164E37] disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
