import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PiAgentService } from '../services/integrations/piAgentService';
import { useApp } from '../contexts/AppContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const RentrixAiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Rentrix AI Assistant. How can I help you manage your properties today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { db } = useApp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const piService = PiAgentService.getInstance();
      
      // Contextualize the prompt with some app data if needed
      const contextPrompt = `
        Current App Context:
        - Total Properties: ${db.properties.length}
        - Total Units: ${db.units.length}
        - Active Contracts: ${db.contracts.filter(c => c.status === 'ACTIVE').length}
        - Open Maintenance: ${db.maintenanceRecords.filter(m => m.status === 'NEW' || m.status === 'IN_PROGRESS').length}
        
        User Question: ${userMessage}
      `;

      const response = await piService.chat(contextPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'I am sorry, I could not process that request.' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Rentrix AI Assistant</h3>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest">Powered by pi-coding-agent</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground italic">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about your properties..."
                  className="w-full bg-card border border-border rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          isOpen 
            ? 'bg-danger text-danger-foreground rotate-90' 
            : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <>
            <Sparkles className="w-6 h-6" />
            {!isOpen && <span className="font-bold text-sm pr-2">Ask Rentrix AI</span>}
          </>
        )}
      </button>
    </div>
  );
};

export default RentrixAiAssistant;
