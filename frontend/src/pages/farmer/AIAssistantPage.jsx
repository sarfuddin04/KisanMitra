import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot, Send, User, Sparkles, Trash2, RefreshCw,
  Wheat, Leaf, Droplets, Bug, FlaskConical, Sun, MessageCircle
} from 'lucide-react';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Quick prompts in Hindi/Hinglish + English for natural farmer conversations
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: Wheat,       label: "Gehu mein patta peela ho raha hai",       emoji: "🌾" },
  { icon: Bug,         label: "Tamatar mein keeda lag gaya",             emoji: "🐛" },
  { icon: Leaf,        label: "Aloo mein patta murjha rha hai kya kru",  emoji: "🥔" },
  { icon: FlaskConical,label: "Urea kab aur kitna daalu?",              emoji: "🧪" },
  { icon: Droplets,    label: "Drip irrigation subsidy kaise milegi?",   emoji: "💧" },
  { icon: Sun,         label: "Main organic kheti shuru karna chahta hu", emoji: "🌿" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Markdown renderer for bot messages
// ─────────────────────────────────────────────────────────────────────────────
const BotMessageContent = ({ text }) => (
  <ReactMarkdown
    components={{
      h1: ({ children }) => <h3 className="text-base font-bold text-gray-900 mt-2 mb-1">{children}</h3>,
      h2: ({ children }) => <h4 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h4>,
      h3: ({ children }) => <h4 className="text-sm font-semibold text-gray-800 mt-2 mb-1">{children}</h4>,
      strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
      em: ({ children }) => <em className="text-gray-500 italic">{children}</em>,
      ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 ml-1">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 ml-1">{children}</ol>,
      li: ({ children }) => <li className="text-gray-700">{children}</li>,
      p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
      hr: () => <hr className="my-2 border-gray-200" />,
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline hover:text-emerald-800">
          {children}
        </a>
      ),
      code: ({ children }) => (
        <code className="bg-gray-100 text-emerald-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
      ),
    }}
  >
    {text}
  </ReactMarkdown>
);

// ─────────────────────────────────────────────────────────────────────────────
// Typing dots animation
// ─────────────────────────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-start space-x-3">
    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md">
      <Bot className="w-5 h-5" />
    </div>
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl rounded-tl-sm border border-gray-200/80 shadow-xs">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-gray-400 font-medium ml-2">
          Soch raha hu... 🌾
        </span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main AI Chat Page
// ─────────────────────────────────────────────────────────────────────────────
export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "🙏 **Namaste Kisan Mitra!**\n\nMain hoon aapka **KisanMitra AI Advisor** — aapka apna kheti salahkar!\n\nAap mujhse Hindi, Hinglish ya English mein baat kar sakte hain. Mujhe batayein:\n\n- 🌾 **Fasal ki koi problem?** (patte peele, keede, bimari)\n- 🧪 **Khad aur dawai ka sawaal?**\n- 💧 **Sinchai ya mitti ki jaankari?**\n- 🏛️ **Sarkari yojana ya subsidy?**\n- 💡 **Koi naya idea ya plan?**\n\n**Poochiye, main help karta hoon!** 👨‍🌾",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = { sender: "user", text: query, timestamp: new Date() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    if (!textToSend) setInput("");
    setLoading(true);

    // Focus back on input for rapid follow-up
    setTimeout(() => inputRef.current?.focus(), 100);

    try {
      const res = await api.post('/ai-assistant/chat', {
        message: query,
        history: newMsgs.slice(-12).map(m => ({ sender: m.sender, text: m.text }))
      });

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: res.data.reply, timestamp: new Date() }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ **Maaf kijiye!** Abhi kuch technical problem aa rahi hai.\n\nKripya thodi der baad dobara try karein. Agar problem bani rahe, toh apne nezdeki **KVK (Krishi Vigyan Kendra)** se bhi madad le sakte hain.\n\n_Main jald wapas aaunga!_ 🙏",
          timestamp: new Date()
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
        text: "🔄 Chat clear ho gaya! Aap naya sawaal pooch sakte hain.\n\nMain **fasal, mitti, keede, khad, dawai, sarkari yojana** — kisi bhi topic par madad kar sakta hoon. 🌾",
        timestamp: new Date()
      }
    ]);
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between glass-panel px-5 py-3.5 rounded-2xl shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 via-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base tracking-tight">
              KisanMitra AI Advisor
            </h2>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
              Aapka Kheti Salahkar • Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center text-[10px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg font-medium">
            <MessageCircle className="w-3 h-3 mr-1" />
            {messages.length - 1} messages
          </span>
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 text-xs font-semibold flex items-center space-x-1 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* ── Chat Messages ── */}
      <div
        ref={chatContainerRef}
        className="flex-1 rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs overflow-y-auto custom-scrollbar space-y-4"
        style={{
          background: 'linear-gradient(180deg, #f0fdf4 0%, #f8faf9 30%, #ffffff 100%)'
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-br from-purple-600 to-teal-500 text-white'
            }`}>
              {msg.sender === 'user'
                ? <User className="w-4 h-4" />
                : <Bot className="w-4 h-4" />
              }
            </div>

            {/* Message Bubble */}
            <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
              <div className={`p-3.5 sm:p-4 text-[13px] sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-emerald-600/15 font-medium whitespace-pre-line'
                  : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-2xl rounded-bl-sm border border-gray-200/80 shadow-sm'
              }`}>
                {msg.sender === 'user'
                  ? msg.text
                  : <BotMessageContent text={msg.text} />
                }
              </div>
              {/* Timestamp */}
              <span className={`text-[10px] text-gray-400 mt-1 px-1 ${
                msg.sender === 'user' ? 'text-right' : 'text-left'
              }`}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Prompts ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center mr-0.5">
          <Sparkles className="w-3 h-3 mr-1 text-purple-500" /> Puchiye:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt.label)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-gray-600 text-xs font-semibold rounded-xl border border-gray-200 shadow-xs whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{prompt.emoji}</span>
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>

      {/* ── Input Field ── */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Apna sawaal yahan likhein... (Hindi / English dono chalega) 🌾"
          className="w-full pl-5 pr-14 py-4 rounded-2xl bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-md outline-hidden font-medium placeholder:text-gray-400 transition-shadow hover:shadow-lg"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2.5 top-2.5 p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-200 disabled:to-gray-200 text-white rounded-xl shadow-sm transition-all active:scale-95"
        >
          {loading
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </form>

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-gray-400 text-center shrink-0 leading-relaxed">
        ⚠️ AI salahkar samanya jaankari deta hai. Rasaynik dawaiyon ki sahi matra ke liye apne nazdeeki
        <strong className="text-gray-500"> KVK (Krishi Vigyan Kendra)</strong> se zaroor salah lein.
      </p>

      {/* ── Inline keyframe animation ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
