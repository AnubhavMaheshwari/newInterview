import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { FaUser, FaRobot } from 'react-icons/fa';

const ChatMessage = ({ message }) => {
  const isBot = message.sender === 'bot';
  const isError = message.isError;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      className={`flex gap-3 items-start ${isBot ? '' : 'justify-end'} ${isError ? 'opacity-90' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isBot && (
        <div className="h-9 w-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 flex-shrink-0">
          <FaRobot size={16} />
        </div>
      )}
      <div className={`max-w-[80%] ${isBot ? '' : 'text-right'}`}>
        <div
          className={`rounded-xl px-4 py-3 border ${
            isBot
              ? 'bg-white border-gray-200 text-gray-800'
              : 'bg-gray-900 border-gray-900 text-white'
          } ${isError ? 'border-red-200 bg-red-50 text-red-700' : ''}`}
        >
          {isBot ? (
            <div className="prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-strong:font-bold">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          ) : (
            <p className="font-medium whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
        <span className="mt-1 inline-block text-xs font-medium text-gray-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
      {!isBot && (
        <div className="h-9 w-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 flex-shrink-0">
          <FaUser size={16} />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;