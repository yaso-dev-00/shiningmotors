
import React from 'react';
import { motion } from 'framer-motion';
import NextLink from "next/link";
import { MapPin, Phone, Mail, Wrench } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SimGarage } from '@/integrations/supabase/modules/simAppPage';

interface GarageCardProps {
  garage: SimGarage;
  index?: number;
}

export const GarageCard: React.FC<GarageCardProps> = ({ garage, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="h-full transition-all hover:shadow-lg overflow-hidden border-t-4 border-t-sky-500">
        <CardHeader className="pb-2">
          <div className="flex items-center mb-2">
            {garage.logo ? (
              <img 
                src={garage.logo} 
                alt={garage.name} 
                className="w-12 h-12 object-contain rounded-md mr-3" 
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center bg-sky-100 rounded-md mr-3">
                <Wrench size={24} className="text-sky-500" />
              </div>
            )}
            <CardTitle className="text-xl">{garage.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2 text-sm">
            {(garage.city || garage.state || garage.country) && (
              <div className="flex items-center text-gray-600">
                <MapPin size={16} className="text-sky-500 mr-2 flex-shrink-0" />
                <span>
                  {[
                    garage.city,
                    garage.state,
                    garage.country
                  ].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            
            {garage.phone && (
              <div className="flex items-center text-gray-600">
                <Phone size={16} className="text-sky-500 mr-2 flex-shrink-0" />
                <span>{garage.phone}</span>
              </div>
            )}
            
            {garage.email && (
              <div className="flex items-center text-gray-600">
                <Mail size={16} className="text-sky-500 mr-2 flex-shrink-0" />
                <span className="truncate">{garage.email}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <NextLink href={`/sim-racing/garages/${garage.id}`} className="w-full">
            <Button className="w-full bg-sky-500 hover:bg-sky-600">View Services</Button>
          </NextLink>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
