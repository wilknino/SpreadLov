import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SocketProvider } from "@/hooks/use-socket";
import Sidebar from "@/components/chat/sidebar";
import ChatWindow from "@/components/chat/chat-window";
import UserInfoPanel from "@/components/chat/user-info-panel";
import ProfileModal from "@/components/chat/profile-modal";
import { User } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  return (
    <SocketProvider>
      <div className="h-screen flex overflow-hidden" data-testid="chat-interface">
        {/* Sidebar */}
        <Sidebar 
          currentUser={user}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
          onOpenProfile={() => setShowProfile(true)}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatWindow 
            currentUser={user}
            selectedUser={selectedUser}
            onToggleUserInfo={() => setShowUserInfo(!showUserInfo)}
          />
        </div>

        {/* User Info Panel - Desktop only */}
        {selectedUser && (
          <UserInfoPanel 
            user={selectedUser}
            isVisible={showUserInfo}
            className="hidden lg:block"
          />
        )}

        {/* Profile Modal */}
        <ProfileModal 
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          user={user}
        />
      </div>
    </SocketProvider>
  );
}
