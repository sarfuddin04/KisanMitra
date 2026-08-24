import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Trash2, AlertCircle, RefreshCw, Sprout } from 'lucide-react';
import api from '../../services/api';

const QUICK_PROMPTS = [
  "How to properly apply Urea in Paddy / Rice?",
  "Organic bio-pesticides for tomato leaf curl & early blight",
  "What are the 5 critical irrigation stages for Wheat?",
  "How to increase organic carbon in agricultural soil?"
];

export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Namaste Kisan Mitra! 🙏 I am your **KisanMitra AI Expert Agronomist**. How can I help you today with crop selection, soil health, pest management, fertilizer scheduling, or mandi marketing?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const newMsgs = [...messages, { sender: "user", text: query }];
    setMessages(newMsgs);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await api.post('/ai-assistant/chat', {
        message: query,
        history: newMsgs.map(m => ({ sender: m.sender, text: m.text }))
      });

      setMessages([...newMsgs, { sender: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages([
        ...newMsgs,
        {
          sender: "bot",
          text: "I apologize, but I am currently experiencing difficulty reaching the agronomy knowledge engine. Please check your soil parameters or try asking again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: "Chat cleared. Ask me any farming or agronomy question!"
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-emerald-100 shadow-xs shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-teal-500 text-white flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">KisanMitra AI Agronomist Chat</h2>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
              Active Agronomic Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 text-xs font-semibold flex items-center space-x-1"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs overflow-y-auto custom-scrollbar space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                : 'bg-gray-50 text-gray-800 rounded-tl-xs border border-gray-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-500 border border-gray-200 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
              <span>Analyzing agronomic knowledge base & formulating recommendation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center">
          <Sparkles className="w-3 h-3 mr-1 text-purple-500" /> Suggested:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 bg-white hover:bg-purple-50 hover:text-purple-700 text-gray-600 text-xs font-semibold rounded-xl border border-gray-200 shadow-2xs whitespace-nowrap transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Field */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about crops, soil NPK, pests, fertilizers, or mandi rates..."
          className="w-full pl-5 pr-14 py-4 rounded-2xl bg-white border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-md outline-hidden font-medium"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2.5 top-2.5 p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white rounded-xl shadow-xs transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-400 text-center shrink-0">
        AI Agronomist provides general educational farming guidance. Always verify chemical dosages with local Krishi Vigyan Kendra (KVK).
      </p>

    </div>
  );
};
