import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  Search,
  CheckCheck,
  Check,
  Clock
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useMessages, Message } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";

const ClientMessages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { conversations, messages, loading, fetchMessages, sendMessage } = useMessages();
  const typingChannelRef = useRef<any>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;
    const channel = supabase.channel(`typing-${selectedConversation}`);
    typingChannelRef.current = channel;
    channel.subscribe();
    return () => {
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const formattedConversations = conversations.map(conv => {
    const lawyerProfile = conv.lawyer_profiles?.profiles;
    const conversationMessages = messages[conv.id] || [];
    const lastMsg = conversationMessages[conversationMessages.length - 1];
    
    return {
      id: conv.id,
      lawyerId: conv.lawyer_id,
      lawyerName: lawyerProfile?.full_name || "Unknown Lawyer",
      lawyerAvatar: lawyerProfile?.avatar_url || undefined,
      lastMessage: lastMsg?.content || "No messages yet",
      lastMessageTime: lastMsg ? new Date(lastMsg.created_at) : new Date(conv.created_at),
      unreadCount: 0,
      messages: conversationMessages,
    };
  });

  const quickReplies = [
    "Thank you for the information.",
    "Can we schedule a follow-up?",
    "I have some additional questions.",
    "When can I expect an update?"
  ];

  const filteredConversations = formattedConversations.filter(conv =>
    conv.lawyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = formattedConversations.find(c => c.id === selectedConversation);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    await sendMessage(selectedConversation, messageText);
    setMessageText("");
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Communicate securely with your lawyers</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lawyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredConversations.length > 0 ? (
                <div className="space-y-1 px-3 pb-3">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={conv.lawyerAvatar} />
                          <AvatarFallback>{conv.lawyerName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">{conv.lawyerName}</p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(conv.lastMessageTime, 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          {selectedConv ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConv.lawyerAvatar} />
                    <AvatarFallback>{selectedConv.lawyerName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedConv.lawyerName}</CardTitle>
                    <p className="text-xs text-muted-foreground">Attorney</p>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {selectedConv.messages.map((message: any) => {
                    const isClientMessage = message.sender_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isClientMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isClientMessage ? 'order-2' : ''}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              isClientMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                            isClientMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{format(new Date(message.created_at), 'h:mm a')}</span>
                            {isClientMessage && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Quick Replies */}
              <div className="px-4 py-2 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Quick Replies:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessageText(reply)}
                      className="text-xs"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <CardContent className="border-t pt-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      if (typingChannelRef.current) {
                        typingChannelRef.current.send({
                          type: "broadcast",
                          event: "typing",
                          payload: { sender_id: currentUserId },
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                    className="flex-1 resize-none"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-[600px]">
              <MessageSquare className="h-20 w-20 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-center mb-2">Select a conversation</p>
              <p className="text-sm text-muted-foreground text-center">
                Choose a lawyer from the list to start messaging
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Response Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Lawyers typically respond within 24 hours during business days. For urgent matters, 
            please contact your lawyer directly via phone or schedule an immediate consultation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientMessages;
