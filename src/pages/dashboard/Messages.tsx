import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { formatTime } from '@/lib/admin-helpers';

interface Conversation {
  userId: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const Messages = () => {
  const { user, role } = useAuth();
  const isStaff = role === 'super_admin' || role === 'admin' || role === 'sub_admin';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (!msgs) return;

    const userIds = new Set<string>();
    msgs.forEach(m => {
      if (m.sender_id !== user.id) userIds.add(m.sender_id);
      if (m.receiver_id !== user.id) userIds.add(m.receiver_id);
    });

    // For clients: show staff they can message. For staff: show clients who messaged
    if (!isStaff) {
      // Get staff profiles
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      const staffIds = (roles || []).filter(r => ['super_admin', 'admin', 'sub_admin'].includes(r.role)).map(r => r.user_id);
      if (staffIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', staffIds);
        setStaffList(profiles || []);
      }
    }

    if (userIds.size > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', Array.from(userIds));
      const convos: Conversation[] = Array.from(userIds).map(uid => {
        const profile = profiles?.find(p => p.user_id === uid);
        const userMsgs = msgs.filter(m => m.sender_id === uid || m.receiver_id === uid);
        const last = userMsgs[0];
        const unread = userMsgs.filter(m => m.receiver_id === user.id && !m.is_read).length;
        return {
          userId: uid,
          name: profile?.full_name || 'Unknown',
          lastMessage: last?.content || '',
          lastTime: last?.created_at || '',
          unread,
        };
      });
      setConversations(convos.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()));
    }
  };

  // Load messages for selected user
  useEffect(() => {
    if (!user || !selectedUser) return;

    const loadMessages = async () => {
      const { data } = await supabase.from('messages').select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      setMessages(data || []);

      // Mark as read
      await supabase.from('messages').update({ is_read: true })
        .eq('receiver_id', user.id).eq('sender_id', selectedUser.id).eq('is_read', false);
    };
    loadMessages();

    // Subscribe to realtime
    const channel = supabase.channel(`user:${user.id}:chat-${selectedUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any;
        if ((msg.sender_id === selectedUser.id && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === selectedUser.id)) {
          setMessages(prev => [...prev, msg]);
          if (msg.receiver_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !selectedUser || !newMsg.trim()) return;
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: newMsg.trim(),
    });
    setNewMsg('');
  };

  const startConversation = (profile: any) => {
    setSelectedUser({ id: profile.user_id, name: profile.full_name });
  };

  // Chat view
  if (selectedUser) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedUser(null); loadConversations(); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-serif text-lg font-semibold text-foreground">{selectedUser.name}</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card text-card-foreground rounded-bl-md border border-border'
                }`}>
                  {msg.content}
                  <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button size="icon" onClick={sendMessage} disabled={!newMsg.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Conversation list
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Messages</h1>

        {/* For clients: show button to message tailor if no conversations */}
        {!isStaff && conversations.length === 0 && staffList.length > 0 && (
          <Card className="p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-3">Start a conversation with your tailor</p>
            {staffList.map(s => (
              <Button key={s.user_id} variant="outline" className="w-full mb-2" onClick={() => startConversation(s)}>
                💬 Chat with {s.full_name}
              </Button>
            ))}
          </Card>
        )}

        {conversations.length === 0 && staffList.length === 0 && (
          <Card className="p-8 text-center">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No messages yet</p>
          </Card>
        )}

        <div className="space-y-2">
          {conversations.map(conv => (
            <Card
              key={conv.userId}
              className="p-3 flex items-center gap-3 cursor-pointer hover:shadow-warm transition-shadow"
              onClick={() => setSelectedUser({ id: conv.userId, name: conv.name })}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-foreground">{conv.name}</p>
                  {conv.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* For clients: start new conversation */}
        {!isStaff && conversations.length > 0 && staffList.length > 0 && (
          <div className="mt-4">
            {staffList.filter(s => !conversations.find(c => c.userId === s.user_id)).map(s => (
              <Button key={s.user_id} variant="outline" className="w-full mb-2" onClick={() => startConversation(s)}>
                💬 Chat with {s.full_name}
              </Button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Messages;
