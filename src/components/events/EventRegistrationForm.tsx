
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceInfo } from '@/utils/deviceInfo';

interface EventRegistrationFormProps {
  event: {
    id: string;
    title: string;
    fee_amount?: number;
    fee_currency?: string;
    registration_required?: boolean;
  };
  onSuccess?: () => void;
}

const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({ event, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    participantName: '',
    email: '',
    phone: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register for this event",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Capture device information
      const deviceInfo = getDeviceInfo();

      const registrationData = {
        event_id: event.id,
        user_id: user.id,
        registration_data: formData,
        device_info: deviceInfo,
        payment_amount: event.fee_amount || 0,
        payment_currency: event.fee_currency || 'INR',
        status: 'pending'
      };

      const { error } = await supabase
        .from('event_registrations')
        .insert(registrationData as any);

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: `You have successfully registered for ${event.title}`,
      });

      // Reset form
      setFormData({
        participantName: '',
        email: '',
        phone: '',
        notes: ''
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "There was an error processing your registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!event.registration_required) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">No registration required for this event</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Register for {event.title}</h3>
      
      {event.fee_amount && event.fee_amount > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Registration Fee: {event.fee_currency} {event.fee_amount}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="participantName">Full Name *</Label>
          <Input
            id="participantName"
            name="participantName"
            value={formData.participantName}
            onChange={handleInputChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Any special requirements or notes"
            rows={3}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register Now'}
        </Button>
      </form>
    </div>
  );
};

export default EventRegistrationForm;
