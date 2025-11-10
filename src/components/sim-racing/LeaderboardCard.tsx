
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SimLeaderboardEntry } from '@/integrations/supabase/modules/simAppPage';
import { Trophy, Clock } from 'lucide-react';

interface LeaderboardCardProps {
  title: string;
  entries: (SimLeaderboardEntry & {
    user?: { id: string; username: string; avatar_url?: string } | null;
    team?: { id: string; name: string; logo?: string } | null;
  })[];
  className?: string;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ 
  title, 
  entries = [],
  className = ""
}) => {
  // Format lap time from seconds to mm:ss.ms
  const formatLapTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Trophy size={20} className="mr-2 text-amber-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No entries yet</div>
          ) : (
            entries.map((entry, index) => {
              const user = entry.user;
              const team = entry.team;
              const name = user?.username || team?.name || 'Anonymous';
              const avatarUrl = user?.avatar_url || team?.logo;
              const initials = name.substring(0, 2).toUpperCase();

              return (
                <div 
                  key={entry.id}
                  className={`flex items-center p-2 rounded-md ${
                    index === 0 ? 'bg-amber-50' : 
                    index === 1 ? 'bg-gray-100' : 
                    index === 2 ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3
                    ${index === 0 ? 'bg-amber-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200'
                    }
                  `}>
                    {index + 1}
                  </div>
                  
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={avatarUrl || ''} alt={name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-grow">
                    <div className="font-medium text-sm">{name}</div>
                  </div>
                  
                  {entry.lap_time && (
                    <div className="text-sm font-mono flex items-center">
                      <Clock size={14} className="mr-1 text-gray-500" />
                      {formatLapTime(Number(entry.lap_time))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
