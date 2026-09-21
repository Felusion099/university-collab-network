import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/VerificationBadge';
import {
  Send,
  Search,
  MessageSquare,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const {
    currentUser,
    users,
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    openUserProfile,
    startConversationWithUser,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);
  // Mobile: show the conversation list OR the chat pane (md+ shows both).
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>(() =>
    activeConversationId ? 'chat' : 'list',
  );

  // Navigating here with a conversation pre-selected (Message buttons,
  // notification links) opens the chat directly on mobile.
  useEffect(() => {
    if (activeConversationId) setMobilePane('chat');
  }, [activeConversationId]);

  // Active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const activeRecipientId = activeConversation
    ? activeConversation.participantIds.find((id) => id !== currentUser.id)
    : null;
  const activeRecipient = users.find((u) => u.id === activeRecipientId);

  const activeMessages = activeConversation
    ? messages.filter((m) => m.conversationId === activeConversation.id)
    : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;
    sendMessage(activeConversation.id, inputMessage.trim());
    setInputMessage('');
  };

  const openConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobilePane('chat');
  };

  const candidateUsers = users.filter((u) => {
    if (u.id === currentUser.id) return false;
    const term = searchUserQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      u.name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.department.toLowerCase().includes(term) ||
      u.skills.some((s) => s.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden h-[78vh] min-h-[520px] flex">

        {/* Left: Conversations Sidebar */}
        <div className={`${mobilePane === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-zinc-200 flex-col bg-zinc-50/50`}>

          {/* Header */}
          <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between">
            <h2 className="font-bold text-base text-zinc-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-700" />
              <span>Campus Messages</span>
            </h2>
            <button
              onClick={() => setIsStartingNewChat(!isStartingNewChat)}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-medium flex items-center gap-1"
              title="Start conversation with a student or professor"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          {/* New Chat search popup / panel */}
          {isStartingNewChat && (
            <div className="p-3 border-b border-zinc-200 bg-white">
              <div className="text-[11px] font-semibold text-zinc-500 mb-1.5">
                Start conversation with campus member:
              </div>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Search students, faculty..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-zinc-100">
                {candidateUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      startConversationWithUser(u.id);
                      setIsStartingNewChat(false);
                      setSearchUserQuery('');
                    }}
                    className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-zinc-100 text-left transition-colors"
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-6 h-6 rounded-full object-cover border border-zinc-200"
                    />
                    <div className="truncate">
                      <div className="text-xs font-medium text-zinc-900 flex items-center gap-1">
                        {u.name}
                        <VerificationBadge verification={u.verification} size="sm" />
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">{u.department}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No active conversations yet. Reach out to peer builders or faculty!
              </div>
            ) : (
              conversations.map((c) => {
                const otherId = c.participantIds.find((id) => id !== currentUser.id);
                const otherUser = users.find((u) => u.id === otherId);
                const isSelected = c.id === activeConversation?.id;

                if (!otherUser) return null;

                return (
                  <div
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-white border-l-4 border-l-zinc-900 shadow-xs' : 'hover:bg-zinc-100/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          otherUser.availability === 'available' ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-zinc-900 truncate flex items-center gap-1">
                          {otherUser.name}
                          <VerificationBadge verification={otherUser.verification} size="sm" />
                        </span>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {c.lastMessageTimestamp}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat View */}
        {activeRecipient && activeConversation ? (
          <div className={`${mobilePane === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white`}>

            {/* Active Thread Header */}
            <div className="p-3 sm:p-4 border-b border-zinc-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back to the conversation list (mobile only) */}
                <button
                  onClick={() => setMobilePane('list')}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-zinc-600 hover:bg-zinc-100"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                <div className="relative shrink-0">
                  <img
                    src={activeRecipient.avatar}
                    alt={activeRecipient.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-zinc-200"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      activeRecipient.availability === 'available' ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-zinc-900 truncate">{activeRecipient.name}</span>
                    <VerificationBadge verification={activeRecipient.verification} size="sm" />
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {activeRecipient.yearOrTitle}
                    <span className="hidden sm:inline"> · {activeRecipient.department}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openUserProfile(activeRecipient.id)}
                className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 font-medium shrink-0"
              >
                View Profile
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/30">
              {activeMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-zinc-400">
                  Say hello and propose your project collaboration or service inquiry!
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-zinc-900 text-white rounded-br-xs'
                            : 'bg-white text-zinc-800 border border-zinc-200/90 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Composer */}
            <form onSubmit={handleSend} className="p-3 border-t border-zinc-200 bg-white flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Write a message to ${activeRecipient.name}...`}
                className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-zinc-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className={`${mobilePane === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col items-center justify-center p-8 text-center text-zinc-400 bg-white`}>
            <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-xs">Select a conversation or start a new chat with a peer.</p>
          </div>
        )}

      </div>
    </div>
  );
};
