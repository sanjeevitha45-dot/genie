import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  HelpCircle,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import { queryCustomerRAG, fetchKnowledgeBase } from '../services/api';
import {
  ChatMessage,
  InventoryItem,
  KnowledgeDoc,
  LocationId,
  PurchaseOrder,
  RAGContextChunk,
} from '../types';

interface CustomerRAGViewProps {
  inventory: InventoryItem[];
  selectedLocation: LocationId;
  purchaseOrders?: PurchaseOrder[];
}

type ChatAppMode = 'all' | 'stock' | 'orders' | 'allergens' | 'locations';

const QUICK_APPS: {
  id: ChatAppMode;
  label: string;
  icon: string;
  description: string;
  suggestedPrompts: string[];
}[] = [
  {
    id: 'all',
    label: 'All-Round Concierge',
    icon: '✨',
    description: 'Ask anything about products, store hours, return policies, or orders.',
    suggestedPrompts: [
      'Do you have Ethiopia Guji Whole Bean in stock?',
      'Is our Barista Edition Oat Milk gluten-free?',
      'What are the weekend operating hours for Downtown Café?',
      'What is our return policy on opened whole bean coffee bags?',
    ],
  },
  {
    id: 'stock',
    label: 'Live Stock & Pricing',
    icon: '☕',
    description: 'Check real-time on-hand quantities, par thresholds, and retail prices.',
    suggestedPrompts: [
      'How much Velvet Canopy Espresso Blend do we have on hand?',
      'Check stock for Barista Edition Oat Milk at Downtown Café',
      'What is the price per kg of Colombia Huila Pink Bourbon?',
      'Do we have compostable 12oz cups in stock at Westside Bakery?',
    ],
  },
  {
    id: 'orders',
    label: 'Order Status Tracker',
    icon: '📦',
    description: 'Trace inbound purchase orders, fulfillment status, and delivery ETA.',
    suggestedPrompts: [
      'What is the status of purchase order PO-2026-0841?',
      'Track incoming shipment for Straus & Meadow oat milk',
      'When is PO-2026-0842 expected to arrive?',
      'Show details for recent inbound deliveries',
    ],
  },
  {
    id: 'allergens',
    label: 'Dietary & Allergen Advisor',
    icon: '🌾',
    description: 'Allergen certifications, vegan alternatives, and milk safety standards.',
    suggestedPrompts: [
      'A customer has celiac disease. Is our oat milk safe and gluten-free?',
      'What vegan pastry options do we have today?',
      'Does the Almond Bostock contain tree nuts?',
      'How do baristas prevent cross-contamination for dairy allergies?',
    ],
  },
  {
    id: 'locations',
    label: 'Store Finder & Hours',
    icon: '📍',
    description: 'Operating schedules, address directions, phone numbers, and offerings.',
    suggestedPrompts: [
      'What are the hours and phone number for the Flagship Roastery?',
      'Is Downtown Café open on Sunday?',
      'What days is the Westside Bakery open in Berkeley?',
      'Where can I pick up wholesale coffee will-call orders?',
    ],
  },
];

export const CustomerRAGView: React.FC<CustomerRAGViewProps> = ({
  inventory,
  selectedLocation,
  purchaseOrders = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I am **Artisan Concierge**, your AI Chatbot powered by our live store **Retrieval-Augmented Generation (RAG)** system.\n\nI have real-time access to our **inventory ledger (${inventory.length} SKUs)**, **active purchase orders**, **store schedules**, and **dietary safety standards** across all locations.\n\nHow may I assist you today?`,
      timestamp: 'Just now',
      modelUsed: 'gemini-2.5-flash / rag',
      suggestedFollowUps: [
        'Do we have Ethiopia Guji in stock?',
        'Is our oat milk certified gluten-free?',
        'What are the Downtown Café weekend hours?',
        'Track purchase order PO-2026-0841',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeApp, setActiveApp] = useState<ChatAppMode>('all');
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Knowledge Explorer Tab
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  const [knowledgeCorpus, setKnowledgeCorpus] = useState<KnowledgeDoc[]>([]);
  const [kbSearch, setKbSearch] = useState('');
  const [kbCategory, setKbCategory] = useState('All');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    fetchKnowledgeBase().then((res) => {
      if (res && res.corpus) setKnowledgeCorpus(res.corpus);
    });
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || isTyping) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    // Format chat history for context continuity
    const historyPayload = messages
      .filter((m) => m.id !== 'msg-welcome')
      .slice(-4)
      .map((m) => ({
        role: m.sender,
        content: m.text,
      }));

    try {
      const result = await queryCustomerRAG(q, selectedLocation, historyPayload);

      if (result) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: result.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          retrievedChunks: result.retrievedChunks,
          suggestedFollowUps: result.suggestedFollowUps,
          modelUsed: result.modelUsed,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const fallback: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: `I've checked our local records for ${selectedLocation.toUpperCase()}, but could not find a direct answer. Please verify with our baristas or store dispatch.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'local-retrieval-synthesizer',
        };
        setMessages((prev) => [...prev, fallback]);
      }
    } catch {
      // Fallback
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared. I am ready for your next customer inquiry or stock check!`,
        timestamp: 'Just now',
        modelUsed: 'gemini-2.5-flash / rag',
        suggestedFollowUps: [
          'Do we have Ethiopia Guji in stock?',
          'Is our oat milk gluten-free?',
          'What are the store hours for the Roastery?',
        ],
      },
    ]);
  };

  const handleExportChat = () => {
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.text}\n`)
      .join('\n----------------------------------------\n\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `artisan-concierge-chat-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleChunks = (msgId: string) => {
    setExpandedChunks((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const currentAppConfig = QUICK_APPS.find((a) => a.id === activeApp) || QUICK_APPS[0];

  return (
    <div className="space-y-4">
      {/* Top Header & Application Selector */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111827]">Artisan Concierge Chatbot</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D8F3DC] text-[#1B4332]">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                  RAG Grounded Active
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Conversational assistant grounded in live stock ({inventory.length} SKUs), store hours, and dietary policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
              Chatbot
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('knowledge')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === 'knowledge'
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              <Database className="w-3.5 h-3.5 inline mr-1" />
              Knowledge Base
            </button>
            <button
              type="button"
              onClick={handleExportChat}
              title="Download chat transcript"
              className="p-1.5 text-xs font-medium bg-white text-[#4B5563] border border-[#E5E7EB] rounded hover:bg-[#F9FAFB] transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-1.5 text-xs font-medium bg-white text-red-600 border border-[#E5E7EB] rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Specialized RAG Applications Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider shrink-0 mr-1">
            Applications:
          </span>
          {QUICK_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setActiveApp(app.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                activeApp === app.id
                  ? 'bg-[#1B4332] text-white shadow-sm ring-2 ring-[#74A892]'
                  : 'bg-[#F9FAFB] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F3F4F6]'
              }`}
            >
              <span>{app.icon}</span>
              <span>{app.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CHATBOT VIEW */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#F9FAFB]/50">
            {messages.map((msg) => {
              const isBot = msg.sender === 'assistant';
              const isExpanded = Boolean(expandedChunks[msg.id]);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Bot Avatar */}
                  {isBot && (
                    <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                    <div
                      className={`rounded-2xl px-5 py-3.5 shadow-sm text-[14px] leading-relaxed ${
                        isBot
                          ? 'bg-white text-[#1F2937] border border-[#E5E7EB]'
                          : 'bg-[#1B4332] text-white rounded-br-none'
                      }`}
                    >
                      <div className="whitespace-pre-line font-sans">{msg.text}</div>

                      {/* Bot Message Footer */}
                      {isBot && (
                        <div className="pt-3 mt-3 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between text-[11px] text-[#6B7280] gap-2">
                          <span className="font-mono text-[#2D6A4F] bg-[#EBF7EE] px-2 py-0.5 rounded">
                            {msg.modelUsed || 'RAG Synthesizer'}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[#9CA3AF]">{msg.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="hover:text-[#111827] inline-flex items-center gap-1 transition-colors"
                              title="Copy text"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grounding Citations Accordion (Bot Only) */}
                    {isBot && msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                      <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => toggleChunks(msg.id)}
                          className="w-full px-3 py-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] flex items-center justify-between text-[#4B5563] font-medium transition-colors"
                        >
                          <span className="flex items-center gap-1.5 text-[12px]">
                            <Layers className="w-3.5 h-3.5 text-[#1B4332]" />
                            <strong>{msg.retrievedChunks.length} Verified Sources Grounded</strong>
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="p-3 space-y-2 border-t border-[#E5E7EB] divide-y divide-[#F3F4F6]">
                            {msg.retrievedChunks.map((c, idx) => (
                              <div key={idx} className="pt-2 first:pt-0 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[#111827] text-[12px]">
                                    {c.title}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D8F3DC] text-[#1B4332]">
                                    {c.relevanceScore}% Match
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#6B7280] leading-snug">
                                  {c.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Follow-Up Chips */}
                    {isBot && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedFollowUps.map((chip, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(chip)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-[#D8F3DC] text-[#2D6A4F] border border-[#D8F3DC] transition-all text-left shadow-2xs font-medium"
                          >
                            ↳ {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {!isBot && (
                    <div className="w-8 h-8 rounded-full bg-[#E5E7EB] text-[#374151] flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-sm inline-flex items-center gap-2 text-xs text-[#6B7280]">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span>Artisan Concierge is retrieving live store facts...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar & Query Input Container */}
          <div className="border-t border-[#E5E7EB] bg-white p-3 sm:p-4 space-y-2.5">
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-[#9CA3AF] shrink-0 font-medium">Try:</span>
              {currentAppConfig.suggestedPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  className="text-[11px] px-2.5 py-1 rounded bg-[#F9FAFB] hover:bg-[#E5E7EB] text-[#374151] border border-[#E5E7EB] shrink-0 transition-colors"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputQuery);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Ask Artisan Concierge (${currentAppConfig.label})...`}
                  disabled={isTyping}
                  className="w-full h-11 pl-4 pr-10 text-[14px] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition-all disabled:opacity-50"
                />
                {inputQuery && (
                  <button
                    type="button"
                    onClick={() => setInputQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#374151]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isTyping || !inputQuery.trim()}
                className="h-11 px-5 inline-flex items-center gap-2 text-[14px] font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#164E37] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Grounded responses with verified database citations
              </span>
              <span>Target: {selectedLocation === 'all' ? 'All Locations' : selectedLocation.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* KNOWLEDGE BASE TAB */}
      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search knowledge documents..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#F9FAFB] border border-[#D1D5DB] rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {['All', 'Locations & Hours', 'Dietary & Allergens', 'Policies', 'Wholesale', 'Products'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setKbCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    kbCategory === cat
                      ? 'bg-[#1B4332] text-white font-medium'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeCorpus
              .filter((doc) => {
                const matchesCat = kbCategory === 'All' || doc.category === kbCategory;
                const matchesText =
                  doc.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
                  doc.body.toLowerCase().includes(kbSearch.toLowerCase());
                return matchesCat && matchesText;
              })
              .map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#1B4332] transition-colors space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EBF7EE] text-[#1B4332]">
                        {doc.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">{doc.lastUpdated}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#111827]">{doc.title}</h4>
                    <p className="text-xs text-[#4B5563] line-clamp-4">{doc.body}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('chat');
                      handleSendMessage(`Tell me more about ${doc.title}`);
                    }}
                    className="text-[11px] font-semibold text-[#1B4332] hover:underline pt-2 inline-flex items-center gap-1"
                  >
                    Ask chatbot about this ↳
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
