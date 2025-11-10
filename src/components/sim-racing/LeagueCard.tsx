
import React from 'react';
import { motion } from 'framer-motion';
import NextLink from "next/link";
import { Calendar, Flag, Trophy, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { SimLeague } from '@/integrations/supabase/modules/simAppPage';

interface LeagueCardProps {
  league: SimLeague;
  index?: number;
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, index = 0 }) => {
  const startDate = league.start_date ? new Date(league.start_date) : null;
  const endDate = league.end_date ? new Date(league.end_date) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="h-full transition-all hover:shadow-lg overflow-hidden border-t-4 border-t-purple-500">
        <CardHeader className="pb-2">
          <div className="flex items-center mb-1">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
              {league.platform || 'Mixed Platform'}
            </Badge>
          </div>
          <CardTitle className="text-xl">{league.name}</CardTitle>
          <CardDescription className="line-clamp-2">{league.description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2 text-sm">
            {startDate && endDate && (
              <div className="flex items-center text-gray-600">
                <Calendar size={16} className="text-purple-500 mr-2" />
                <span>{format(startDate, 'PPP')} - {format(endDate, 'PPP')}</span>
              </div>
            )}
            
            <div className="flex items-center text-gray-600">
              <Trophy size={16} className="text-purple-500 mr-2" />
              <span>
                {league.registration_type === 'team' ? 'Team Event' : 'Individual Event'}
              </span>
            </div>
            
            {league.max_participants && (
              <div className="flex items-center text-gray-600">
                <Users size={16} className="text-purple-500 mr-2" />
                <span>Max Participants: {league.max_participants}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <NextLink href={`/sim-racing/leagues/${league.id}`} className="w-full">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">View League</Button>
          </NextLink>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
