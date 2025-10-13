'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Sparkles, Trash2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { chartOfAccountsService, debtorService, creditorService } from '@/lib/firebase';
import { Markdown } from '@/components/ui/markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantChatProps {
  companyId: string;
}

export function AIAssistantChat({ companyId }: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hello! I'm your AI accounting assistant with full access to your company data.

**What I can help you with:**
✅ **Customer Queries** - Search and view your debtors ledger
✅ **Supplier Queries** - Search and view your creditors ledger
✅ **GL Account Questions** - Find and explain accounts in your Chart of Accounts
✅ **Accounting Guidance** - Explain principles, IFRS, SA GAAP, tax regulations
✅ **Transaction Recording** - How to record different types of transactions
✅ **Learning** - Teach accounting concepts in simple terms

**Try asking me:**
- "Show me all current suppliers"
- "Find customer [name]"
- "What GL account should I use for utilities?"
- "Explain the difference between AR and Revenue"
- "What are my current liabilities accounts?"
- "How do I record a customer refund?"

How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [debtors, setDebtors] = useState<any[]>([]);
  const [creditors, setCreditors] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load all data (accounts, debtors, creditors) on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Chart of Accounts
        const charts = await chartOfAccountsService.getCharts(companyId);
        if (charts && charts.length > 0) {
          const activeChart = charts.find(c => c.isActive) || charts[0];
          const accountsList = await chartOfAccountsService.getAccounts(companyId, activeChart.id);
          setAccounts(accountsList);
        }

        // Load Debtors (Customers)
        const debtorsList = await debtorService.getDebtors(companyId);
        setDebtors(debtorsList);
        console.log('[AI Chat] Loaded debtors:', debtorsList.length);

        // Load Creditors (Suppliers)
        const creditorsList = await creditorService.getCreditors(companyId);
        setCreditors(creditorsList);
        console.log('[AI Chat] Loaded creditors:', creditorsList.length);

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load company data');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [companyId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI chat API with conversation context and all company data
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          userMessage: input.trim(),
          accounts, // Pass accounts from client
          debtors, // Pass debtors from client
          creditors, // Pass creditors from client
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const result = await response.json();

      if (result.success && result.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast.error(result.message || 'Failed to get AI response');

        // Add error message to chat
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ Sorry, I encountered an error: ${result.message || 'Unknown error'}

You can try:
- Rephrasing your question
- Asking a simpler question
- Checking your internet connection

If the problem persists, contact support.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to communicate with AI assistant');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ I'm having trouble connecting right now. Please try again in a moment.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `👋 Chat cleared! I'm ready to help you with your accounting questions.

How can I assist you today?`,
        timestamp: new Date(),
      },
    ]);
    toast.success('Chat history cleared');
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-xs text-gray-600">Online • Full access to company data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={clearChat}
            size="sm"
            variant="outline"
            disabled={isLoading || messages.length <= 1}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Capabilities Info Banner */}
      <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            <strong>Full Data Access:</strong> This AI has real-time access to your Chart of Accounts,
            debtors ledger, and creditors ledger. Ask specific questions about customers, suppliers,
            or accounting concepts to get accurate answers!
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1">
                {message.role === 'assistant' && (
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                )}
                <span className="text-xs font-medium opacity-75">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <span className="text-xs opacity-50">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {/* Message Content */}
              <div className="text-sm leading-relaxed">
                {message.role === 'assistant' ? (
                  <Markdown content={message.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about accounting, customers, suppliers, or accounts..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to send,{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Shift + Enter</kbd> for new
          line
        </p>
      </div>
    </div>
  );
}
