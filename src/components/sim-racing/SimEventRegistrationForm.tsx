
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { simRacingApi } from "@/integrations/supabase/modules/simRacing";
import { useAuth } from "@/contexts/AuthContext";

interface SimEventRegistrationFormProps {
  eventId: string;
  onRegistrationComplete: () => void;
  carClasses?: string[];
}

const SimEventRegistrationForm: React.FC<SimEventRegistrationFormProps> = ({ 
  eventId, 
  onRegistrationComplete,
  carClasses = ["GT3", "GT4", "Formula", "Prototype", "Touring", "Other"]
}) => {
  const { user } = useAuth();
  const [carClass, setCarClass] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!carClass) newErrors.carClass = 'Car class is required';
    if (!carNumber.trim()) newErrors.carNumber = 'Car number is required';
    else if (isNaN(Number(carNumber)) || Number(carNumber) < 1 || Number(carNumber) > 999) {
      newErrors.carNumber = 'Car number must be between 1 and 999';
    }
    if (!agreedToTerms) newErrors.terms = 'You must agree to the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Register for event using the simRacingApi
      const registrationData = {
        car_class: carClass,
        car_number: parseInt(carNumber),
        
      };
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to register for events",
          variant: "destructive",
        });
        return;
      }

      const { error } = await simRacingApi.events.registerSolo(
        eventId, 
        user.id, 
        registrationData
      );
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Registration successful!",
        description: "You have successfully registered for this event.",
      });
      
      onRegistrationComplete();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Register for Event</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carClass">Car Class</Label>
            <Select value={carClass} onValueChange={setCarClass}>
              <SelectTrigger id="carClass" className={errors.carClass ? "border-red-500" : ""}>
                <SelectValue placeholder="Select car class" />
              </SelectTrigger>
              <SelectContent>
                {carClasses.map((carClass) => (
                  <SelectItem key={carClass} value={carClass}>{carClass}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.carClass && <p className="text-xs text-red-500">{errors.carClass}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carNumber">Car Number</Label>
            <Input
              id="carNumber"
              type="number"
              min="1"
              max="999"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              placeholder="Enter your car number (1-999)"
              className={errors.carNumber ? "border-red-500" : ""}
            />
            {errors.carNumber && <p className="text-xs text-red-500">{errors.carNumber}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information or special requirements"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className={errors.terms ? "border-red-500" : ""}
            />
            <Label 
              htmlFor="terms" 
              className={`text-sm ${errors.terms ? "text-red-500" : ""}`}
            >
              I agree to the sim racing rules and regulations
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-red-500 mt-1">{errors.terms}</p>}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : "Submit Registration"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SimEventRegistrationForm;
