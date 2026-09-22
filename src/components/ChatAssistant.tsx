import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';

interface ChatAssistantProps {
  initialMessage?: string;
  onBack: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  action?: string;
}

export default function ChatAssistant({ initialMessage, onBack }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello. I'm the SERDS AI Assistant. I can help you figure out if you need to dispatch emergency services. Are you currently in immediate physical danger?",
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (initialMessage && messages.length === 1) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'user', text: initialMessage }
      ]);
      // Simulate bot reply
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(), 
            sender: 'bot', 
            text: "I've received your request and am analyzing the situation based on what you described. Does anyone require immediate medical attention?",
          }
        ]);
      }, 1000);
    }
  }, [initialMessage]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: userMessage }
    ]);

    // Simulate generic bot reply for now
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          sender: 'bot', 
          text: "I am routing your information to the appropriate dispatch desk. Please stay safe and follow any instructions provided.",
          action: "Dispatch Traffic Enforcer" // Add action mock for UI showcase
        }
      ]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] relative font-sans">
      {/* Header */}
      <div className="flex items-center p-6 bg-white shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="text-gray-800 p-1 hover:bg-gray-100 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-gray-800 font-medium text-base">AI Chat Assistant</h1>
          <p className="text-[#24A159] text-xs font-medium">Online &bull; Guided Triage</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.sender === 'bot' ? 'bg-[#F9E8EC] mr-3' : 'bg-gray-200 ml-3'}`}>
              {msg.sender === 'bot' ? <Bot className="w-4 h-4 text-[#B41A46]" /> : <User className="w-4 h-4 text-gray-600" />}
            </div>
            <div className={`rounded-2xl p-4 shadow-sm max-w-[80%] ${
              msg.sender === 'user' 
                ? 'bg-[#B41A46] text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              <p className={`text-sm leading-relaxed ${msg.action ? 'mb-3' : ''}`}>
                {msg.text}
              </p>
              {msg.action && (
                <button className="w-full py-2 bg-[#F9E8EC] text-[#B41A46] font-medium text-xs rounded-lg hover:bg-[#f3d3dc] transition-colors">
                  {msg.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={handleSend} className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
          <input 
            type="text" 
            placeholder="Type your message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 py-1"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()} 
            className="w-8 h-8 bg-[#B41A46] rounded-full flex items-center justify-center text-white ml-2 hover:bg-[#9a143a] transition-colors disabled:bg-gray-300 disabled:text-gray-500"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
