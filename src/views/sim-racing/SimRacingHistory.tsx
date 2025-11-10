
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from '@/components/Layout';
import SimRacingMyEvents from './SimRacingEvents';
import SimRacingMyLeagues from './SimRacingMyLeagues';
import { Trophy, Calendar, Clock } from 'lucide-react';

const SimRacingHistory = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">My Racing History</h1>
        <p className="text-gray-500 mb-6">Track your sim racing events and league participation</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            title="Events" 
            value="Coming Soon" 
            description="Total events participated" 
            icon={<Calendar className="h-5 w-5 text-blue-500" />} 
          />
          <StatsCard 
            title="Leagues" 
            value="Coming Soon" 
            description="Active league registrations" 
            icon={<Trophy className="h-5 w-5 text-yellow-500" />} 
          />
          <StatsCard 
            title="Hours" 
            value="Coming Soon" 
            description="Total racing hours" 
            icon={<Clock className="h-5 w-5 text-green-500" />} 
          />
        </div>
        
        {/* <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events" className="mt-0">
            <SimRacingMyEvents />
          </TabsContent>
          
          <TabsContent value="leagues" className="mt-0">
            <SimRacingMyLeagues />
          </TabsContent>
        </Tabs> */}
      </div>
    </Layout>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, icon }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-xs">
            {description}
          </CardDescription>
        </div>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default SimRacingHistory;
