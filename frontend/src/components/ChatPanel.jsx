import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Radio, Terminal, Bot } from "lucide-react";
import { client } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPanel({ auditId, lastPageId }) {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: (
        "🤖 **Local Context-Aware Audit Assistant**\n\n" +
        "I am running privately on your machine using Ollama (Qwen2.5:3b-instruct).\n\n" +
        "Ask me details about page scores, critical accessibility violations, or recommended overrides. " +
        "Try clicking one of the suggested questions below:"
      )
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const suggestedQuestions = [
    "Which page is worst?",
    "What should I fix first?",
    "Explain accessibility issues.",
    "Compare pages.",
    "Show critical WCAG violations."
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query || !query.trim()) return;
    
    // Add User message
    setMessages(prev => [...prev, { sender: "user", text: query }]);
    setInput("");
    setLoading(true);

    // Insert empty streaming placeholder for assistant
    setMessages(prev => [...prev, { sender: "assistant", text: "", isStreaming: true }]);

    let accumulatedText = "";
    
    try {
      await client.runQueryStream(auditId, query, (chunk) => {
        accumulatedText += chunk;
        setMessages(prev => {
          const list = [...prev];
          const lastMsg = list[list.length - 1];
          if (lastMsg && lastMsg.sender === "assistant") {
            lastMsg.text = accumulatedText;
            lastMsg.isStreaming = false;
          }
          return list;
        });
      });
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const list = [...prev];
        const lastMsg = list[list.length - 1];
        if (lastMsg) {
          lastMsg.text = "⚠️ **Local AI service offline**. Please check if Ollama is running (`ollama run qwen2.5:3b`).";
          lastMsg.isStreaming = false;
        }
        return list;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto my-8 px-4 text-zinc-100 flex flex-col h-[520px]">
      
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-200">Local Context-Aware Assistant</h3>
        </div>
        <div className="flex items-center space-x-1.5 text-3xs px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold rounded-full">
          <Terminal className="h-3 w-3 animate-pulse" />
          <span>Ollama Qwen2.5:3b</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 font-sans scrollbar-thin">
        <AnimatePresence>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4.5 py-3 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/5"
                    : "bg-zinc-950 border border-zinc-900 text-zinc-300 shadow-md"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {m.text || (m.isStreaming && (
                    <span className="flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-3xs font-extrabold text-zinc-400 hover:text-zinc-200 rounded-lg transition active:scale-[0.98]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input query field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative"
      >
        <input
          type="text"
          placeholder="Ask Qwen about page audit score details (e.g. 'Show critical WCAG violations')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-3.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500 transition"
        />
        <button
          type="submit"
          disabled={loading || !input}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-900 disabled:text-zinc-750 text-zinc-950 rounded-xl transition"
        >
          <Send className="h-4 w-4 fill-current" />
        </button>
      </form>
    </div>
  );
}
