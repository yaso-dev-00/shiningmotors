
import React from 'react';
import SimRacingSlideshow from './SimRacingSlideshow';
import NextLink from "next/link";
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Settings, Gamepad } from 'lucide-react';

export const SimRacingHero: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <SimRacingSlideshow />
      
      {/* Quick Navigation Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <NextLink href="/sim-racing/leagues">
          <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-100 shadow-sm border-sky-100 hover:border-sky-200 transition-all">
            <Trophy className="h-8 w-8 text-sky-500" />
            <span className="font-medium">Leagues</span>
          </Button>
        </NextLink>
        
        <NextLink href="/sim-racing/events">
          <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-100 shadow-sm border-sky-100 hover:border-sky-200 transition-all">
            <Calendar className="h-8 w-8 text-sky-500" />
            <span className="font-medium">Events</span>
          </Button>
        </NextLink>
        
        <NextLink href="/sim-racing/garages">
          <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-100 shadow-sm border-sky-100 hover:border-sky-200 transition-all">
            <Settings className="h-8 w-8 text-sky-500" />
            <span className="font-medium">Garages</span>
          </Button>
        </NextLink>
        
        <NextLink href="/sim-racing/equipment">
          <Button variant="outline" className="w-full h-full py-6 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-100 shadow-sm border-sky-100 hover:border-sky-200 transition-all">
            <Gamepad className="h-8 w-8 text-sky-500" />
            <span className="font-medium">Equipment</span>
          </Button>
        </NextLink>
      </div>
    </div>
  );
};