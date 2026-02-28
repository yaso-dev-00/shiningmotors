
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { VendorRegistration } from '@/integrations/supabase/modules/vendors';
import { useAuth } from '@/contexts/AuthContext';
import { Edit, Save, X } from 'lucide-react';
import { vendorBasicDetailsSchema, VendorBasicDetailsFormData } from '@/lib/validations/vendor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface VendorBasicDetailsEditProps {
  vendorRegistration: VendorRegistration;
  onUpdate: () => void;
}

const VendorBasicDetailsEdit: React.FC<VendorBasicDetailsEditProps> = ({
  vendorRegistration,
  onUpdate
}) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<VendorBasicDetailsFormData>({
    resolver: zodResolver(vendorBasicDetailsSchema),
    defaultValues: {
      personal_name: vendorRegistration.personal_name,
      business_name: vendorRegistration.business_name,
      email: vendorRegistration.email,
      mobile: vendorRegistration.mobile
    }
  });

  const handleSubmit = async (data: VendorBasicDetailsFormData) => {
    setLoading(true);
    const payload = {
      vendor_registration_id: vendorRegistration.id,
      request_type: 'update_details',
      requested_changes: { ...data, justification: 'Basic details update request' },
      current_data: {
        personal_name: vendorRegistration.personal_name,
        business_name: vendorRegistration.business_name,
        email: vendorRegistration.email,
        mobile: vendorRegistration.mobile
      },
      requested_by: vendorRegistration.user_id
    };
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch("/api/vendor/update-requests", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to submit update request");
      }
      toast({
        title: "Update Request Submitted",
        description: "Your basic details update request has been submitted for admin review."
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error submitting update request:', error);
      toast({
        title: "Error",
        description: "Failed to submit update request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Basic Information
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="personal_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Submit Update Request
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Full Name</Label>
              <p className="text-gray-900">{vendorRegistration.personal_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Business Name</Label>
              <p className="text-gray-900">{vendorRegistration.business_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-gray-900">{vendorRegistration.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Mobile</Label>
              <p className="text-gray-900">{vendorRegistration.mobile}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorBasicDetailsEdit;
