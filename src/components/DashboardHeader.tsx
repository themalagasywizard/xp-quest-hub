
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface DashboardHeaderProps {
  username: string;
  level: number;
  xpTotal: number;
  profilePicture?: string;
}

export function DashboardHeader({ username, level, xpTotal, profilePicture }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 mb-6 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary">
          <AvatarImage src={profilePicture} />
          <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">{username}</h2>
          <span className="text-sm text-muted-foreground">Level {level || 1}</span>
        </div>
      </div>
      <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
        <Star className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{(xpTotal || 0).toLocaleString()} XP</span>
      </Badge>
    </div>
  );
}
