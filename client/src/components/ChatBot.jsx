import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';
import API from '../utils/api';
import { FaRobot, FaTimes, FaPaperPlane, FaMicrophone, FaVolumeUp, FaStop } from 'react-icons/fa';
import ChatMessage from './ChatMessage.jsx';

const ChatBot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [usedVoiceInput, setUsedVoiceInput] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const location = useLocation();

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        setUsedVoiceInput(true);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = user ? `Hi ${user.name}! 👋` : 'Hi there! 👋';
      setMessages([
        {
          id: Date.now(),
          text: `${greeting} I'm your AI interview assistant. I can help you with:\n\n• Summarizing interview experiences\n• Creating preparation strategies\n• Answering interview-related questions\n\nHow can I help you today?`,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length, user]);

  // Cleanup
  useEffect(() => {
    setIsOpen(false);
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [location.pathname]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice =>
        voice.name.includes('Female') ||
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Microsoft Zira') ||
        voice.name.includes('Samantha') ||
        (voice.name.includes('en') && voice.gender === 'female')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    stopSpeaking();

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = {
        currentPage: location.pathname
      };

      const interviewMatch = location.pathname.match(/\/interview\/([a-f0-9]+)/);
      if (interviewMatch) {
        context.interviewId = interviewMatch[1];
      }

      const response = await API.post('/api/chatbot/chat', {
        message: inputMessage,
        context
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      if (autoSpeak && usedVoiceInput) {
        setTimeout(() => speakText(response.data.response), 500);
        setUsedVoiceInput(false);
      }
    } catch (error) {
      console.error('Chat error:', error);

      let errorText = 'Sorry, I encountered an error. Please try again.';
      if (error.response?.data?.error) {
        errorText = error.response.data.error;
      } else if (error.message) {
        errorText = error.message;
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = async (action) => {
    stopSpeaking();
    setIsLoading(true);

    try {
      let response;
      let actionText = '';

      switch (action) {
        case 'homeOverview':
          actionText = 'Give me an overview of all interviews';
          response = await API.post('/api/chatbot/overview');

          const overviewMessage = {
            id: Date.now(),
            text: response.data.overview,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, overviewMessage]);
          break;

        case 'summarize':
          const interviewMatch = location.pathname.match(/\/interview\/([a-f0-9]+)/);
          if (interviewMatch) {
            actionText = 'Summarize this interview';
            response = await API.post(`/api/chatbot/summarize/${interviewMatch[1]}`);

            const summaryMessage = {
              id: Date.now(),
              text: response.data.summary,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, summaryMessage]);

            if (autoSpeak && usedVoiceInput) {
              setTimeout(() => speakText(response.data.summary), 500);
              setUsedVoiceInput(false);
            }
          } else {
            throw new Error('No interview found on this page');
          }
          break;

        case 'strategy':
          const interviewMatch2 = location.pathname.match(/\/interview\/([a-f0-9]+)/);
          if (interviewMatch2) {
            actionText = 'Create prep strategy based on this interview';
            response = await API.post(`/api/chatbot/interview-strategy/${interviewMatch2[1]}`);
          } else {
            actionText = 'Create a general preparation strategy';
            response = await API.post('/api/chatbot/strategy', {});
          }

          const strategyMessage = {
            id: Date.now(),
            text: response.data.strategy,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, strategyMessage]);

          if (autoSpeak && usedVoiceInput) {
            setTimeout(() => speakText(response.data.strategy), 500);
            setUsedVoiceInput(false);
          }
          break;

        default:
          break;
      }

      if (actionText) {
        const userMessage = {
          id: Date.now() - 1,
          text: actionText,
          sender: 'user',
          timestamp: new Date()
        };
        setMessages(prev => [...prev.slice(0, -1), userMessage, prev[prev.length - 1]]);
      }
    } catch (error) {
      console.error('Quick action error:', error);
      const errorMessage = {
        id: Date.now(),
        text: error.message || 'Sorry, I couldn\'t complete that action. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        {isOpen ? <FaTimes size={20} /> : <FaRobot size={24} />}
      </motion.button>

      {/* Side Panel Chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                  <FaRobot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">AI Interview Assistant</h3>
                  <p className="text-xs text-gray-500">Powered by Groq AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`w-8 h-8 rounded-lg border ${
                    autoSpeak ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                  } flex items-center justify-center hover:bg-gray-800 hover:text-white transition`}
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  title={autoSpeak ? 'Auto-speech enabled' : 'Auto-speech disabled'}
                >
                  <FaVolumeUp size={14} />
                </button>
                <button
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 transition"
                  onClick={() => setIsOpen(false)}
                  title="Close chatbot"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap gap-2">
              {location.pathname === '/' ? (
                <button
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={() => handleQuickAction('homeOverview')}
                  disabled={isLoading}
                >
                  Interview Overview
                </button>
              ) : location.pathname.includes('/interview/') ? (
                <>
                  <button
                    className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                    onClick={() => handleQuickAction('summarize')}
                    disabled={isLoading}
                  >
                    Summarize
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                    onClick={() => handleQuickAction('strategy')}
                    disabled={isLoading}
                  >
                    Prep Strategy
                  </button>
                </>
              ) : null}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center">
                    <FaRobot size={14} className="text-gray-400" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Status */}
            {(isListening || isSpeaking) && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-3 text-sm text-gray-600">
                {isListening && '🎤 Listening...'}
                {isSpeaking && (
                  <>
                    <div className="flex gap-1 items-center">
                      <span className="w-1 h-4 bg-gray-400 rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 h-4 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span>Speaking...</span>
                    <button
                      className="ml-auto px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition"
                      onClick={stopSpeaking}
                    >
                      <FaStop size={10} className="inline mr-1" /> Stop
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-end gap-2">
                <button
                  className={`w-10 h-10 rounded-lg border ${
                    isListening
                      ? 'bg-red-100 text-red-600 border-red-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  } flex items-center justify-center transition flex-shrink-0`}
                  onClick={toggleVoiceInput}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <FaMicrophone size={16} />
                </button>
                <textarea
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition resize-none"
                  placeholder="Ask me anything..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={1}
                  disabled={isLoading}
                  style={{ minHeight: '42px', maxHeight: '120px' }}
                />
                <button
                  className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <FaPaperPlane size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;