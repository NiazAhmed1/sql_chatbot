'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, UploadCloud } from 'lucide-react';

export default function ChatWithSQLite() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [dbFile, setDbFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async () => {
    if (!dbFile) return alert('Select a .db file first');

    const fileName = dbFile.name.toLowerCase();
    if (!fileName.endsWith('.db')) {
      alert('❌ Please upload a valid .db file');
      return;
    }

    const formData = new FormData();
    formData.append('file', dbFile);

    try {
      setIsUploading(true);
      const res = await fetch('http://localhost:8000/upload_db/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.message) {
        setUploaded(true);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('question', trimmed);

      const res = await fetch('http://localhost:8000/ask/', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer || data.error },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please check the backend.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';
    return (
      <div
        className={`flex items-start gap-3 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'order-2 bg-indigo-600' : 'bg-purple-700'
          }`}
        >
          {isUser ? (
            <User size={18} className="text-white" />
          ) : (
            <Bot size={18} className="text-white" />
          )}
        </div>
        <div
          className={`px-4 py-3 rounded-lg max-w-[80%] ${
            isUser ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-100'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  };

  const LoadingIndicator = () => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center">
        <Bot size={18} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-lg bg-gray-800">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
          <div
            className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 py-4 px-6 bg-gray-800 shadow-md flex items-center gap-2">
        <Bot size={24} className="text-purple-400" />
        <h1 className="text-xl font-semibold">SQLite Chatbot</h1>
      </header>

      {/* Upload Block – Centered until uploaded */}
      {!uploaded ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md text-center shadow-xl">
            <UploadCloud size={36} className="mx-auto text-purple-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upload your `.db` file</h2>
            <p className="text-gray-400 text-sm mb-6">Only .db files are allowed</p>
            <input
              type="file"
              accept=".db"
              onChange={(e) => setDbFile(e.target.files[0])}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-600 file:text-white
                hover:file:bg-indigo-700 mb-4"
            />
            <button
              onClick={handleUpload}
              disabled={isUploading || !dbFile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload & Start Chat'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3 max-w-md">
                  <Bot
                    size={48}
                    className="mx-auto text-purple-500 opacity-50"
                  />
                  <h2 className="text-xl font-medium text-gray-300">
                    Upload a DB and Start Chatting
                  </h2>
                  <p className="text-gray-400">
                    Ask SQL questions and get real answers from your database.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <ChatMessage key={i} message={m} />
                ))}
                {isLoading && <LoadingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4 bg-gray-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 py-3 px-4 rounded-full border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
