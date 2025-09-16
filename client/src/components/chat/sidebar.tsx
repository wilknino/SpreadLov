import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { User, Conversation, Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onOpenProfile: () => void;
}

export default function Sidebar({ currentUser, selectedUser, onSelectUser, onOpenProfile }: SidebarProps) {
  const { logoutMutation } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations = [] } = useQuery<Array<Conversation & { otherUser: User; lastMessage?: Message }>>({
    queryKey: ["/api/conversations"],
  });

  const { data: onlineUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/online"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Listen for online status changes
  useEffect(() => {
    const handleOnlineStatusChanged = () => {
      // Refetch online users when status changes
      queryClient.invalidateQueries({ queryKey: ["/api/users/online"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    };

    window.addEventListener('onlineStatusChanged', handleOnlineStatusChanged);
    return () => window.removeEventListener('onlineStatusChanged', handleOnlineStatusChanged);
  }, [queryClient]);

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date | string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="relative">
              <AvatarImage src={currentUser.profilePhoto || undefined} />
              <AvatarFallback>{currentUser.firstName[0]}{currentUser.lastName[0]}</AvatarFallback>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-card rounded-full"></div>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm" data-testid="text-current-user-name">
                {currentUser.firstName}
              </h3>
              <p className="text-xs text-accent">Online</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenProfile}
              data-testid="button-profile-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-destructive hover:text-destructive"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-conversations"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "p-3 hover:bg-secondary cursor-pointer rounded-md transition-colors",
                selectedUser?.id === conversation.otherUser.id && "bg-secondary border-l-2 border-primary"
              )}
              onClick={() => onSelectUser(conversation.otherUser)}
              data-testid={`conversation-${conversation.otherUser.id}`}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="relative">
                  <AvatarImage src={conversation.otherUser.profilePhoto || undefined} />
                  <AvatarFallback>
                    {conversation.otherUser.firstName[0]}{conversation.otherUser.lastName[0]}
                  </AvatarFallback>
                  {conversation.otherUser.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-card rounded-full"></div>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate" data-testid={`text-user-name-${conversation.otherUser.id}`}>
                      {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                    </h4>
                    {conversation.lastMessage && (
                      <span className="text-xs text-muted-foreground" data-testid={`text-last-message-time-${conversation.otherUser.id}`}>
                        {formatTime(conversation.lastMessage.timestamp!)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate" data-testid={`text-last-message-preview-${conversation.otherUser.id}`}>
                      {conversation.lastMessage.imageUrl ? "📷 Photo" : conversation.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Online Users */}
      <div className="border-t border-border p-4">
        <h5 className="text-sm font-medium text-muted-foreground mb-3">Online Now</h5>
        <div className="flex space-x-2 overflow-x-auto">
          {onlineUsers.map((user) => (
            <Avatar
              key={user.id}
              className="relative cursor-pointer hover:ring-2 hover:ring-primary transition-all flex-shrink-0"
              onClick={() => onSelectUser(user)}
              data-testid={`avatar-online-user-${user.id}`}
            >
              <AvatarImage src={user.profilePhoto || undefined} />
              <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-card rounded-full"></div>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
