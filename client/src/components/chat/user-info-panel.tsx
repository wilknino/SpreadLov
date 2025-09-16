import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface UserInfoPanelProps {
  user: User;
  isVisible: boolean;
  className?: string;
}

export default function UserInfoPanel({
  user,
  isVisible,
  className,
}: UserInfoPanelProps) {
  const formatJoinDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div
      className={cn(
        "w-80 bg-card border-l border-border p-6 transition-all duration-300",
        !isVisible && "hidden",
        className,
      )}
      data-testid="user-info-panel"
    >
      <div className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4 relative">
          <AvatarImage src={user.profilePhoto || undefined} />
          <AvatarFallback className="text-lg">
            {user.firstName[0]}
            {user.lastName[0]}
          </AvatarFallback>
          {user.isOnline && (
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-accent border-2 border-card rounded-full"></div>
          )}
        </Avatar>

        <h3
          className="text-xl font-semibold mb-2"
          data-testid="text-user-full-name"
        >
          {user.firstName} {user.lastName}
        </h3>

        <p
          className={cn(
            "text-sm mb-6",
            user.isOnline ? "text-accent" : "text-muted-foreground",
          )}
          data-testid="text-user-status"
        >
          {user.isOnline ? "Online" : "Offline"}
        </p>

        <div className="space-y-4 text-left">
          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Email
              </h4>
              <p className="text-sm" data-testid="text-user-email">
                {user.email}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Username
              </h4>
              <p className="text-sm" data-testid="text-user-username">
                @{user.username}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Joined
              </h4>
              <p className="text-sm" data-testid="text-user-join-date">
                {formatJoinDate(user.createdAt!)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
