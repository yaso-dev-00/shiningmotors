import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { VendorRegistration, BranchInfo, CategorySpecificDetails } from '@/integrations/supabase/modules/vendors';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, AlertCircle } from 'lucide-react';
import CategorySpecificFields from './CategorySpecificFields';
import BranchManagement from './BranchManagement';
import { vendorUpdateRequestSchema, VendorUpdateRequestFormData, categories } from '@/lib/validations/vendor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface VendorUpdateRequestFormProps {
  vendorRegistration: VendorRegistration;
  onSuccess: () => void;
  onCancel: () => void;
}

const VendorUpdateRequestForm: React.FC<VendorUpdateRequestFormProps> = ({
  vendorRegistration,
  onSuccess,
  onCancel
}) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [newBranches, setNewBranches] = useState<BranchInfo[]>([]);
  const [updateDetails, setUpdateDetails] = useState<CategorySpecificDetails>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const availableCategories = categories.filter(cat => 
    !vendorRegistration.categories?.includes(cat)
  );

  const form = useForm<VendorUpdateRequestFormData>({
    resolver: zodResolver(vendorUpdateRequestSchema),
    defaultValues: {
      request_type: 'add_category',
      justification: '',
      newCategories: [],
      newBranches: [],
      updateDetails: {}
    }
  });

  const requestType = form.watch('request_type');

  const validateCategoryDetails = (categories: string[], details: CategorySpecificDetails) => {
    const errors: string[] = [];
    
    // Validate Service category
    if (categories.includes('Service')) {
      const serviceDetails = details.service || {};
      
      // Required fields for Service category
      if (!serviceDetails.centerPhotosUrl || serviceDetails.centerPhotosUrl.trim() === '') {
        errors.push('service');
      }
      
      // At least one certification URL is required
      if (!serviceDetails.certificationUrls || serviceDetails.certificationUrls.length === 0) {
        errors.push('service');
      } else {
        // Check if all certification URLs are valid and not empty
        const validUrls = serviceDetails.certificationUrls.filter((url: string) => 
          url && url.trim() !== '' && url.startsWith('http')
        );
        if (validUrls.length === 0) {
          errors.push('service');
        }
      }
      
      if (!serviceDetails.insuranceProofUrl || serviceDetails.insuranceProofUrl.trim() === '') {
        errors.push('service');
      }
    }
    
    // Validate Shop category
    if (categories.includes('Shop')) {
      const shopDetails = details.shop || {};
      
      if (!shopDetails.productCatalogUrl || shopDetails.productCatalogUrl.trim() === '') {
        errors.push('shop');
      }
      
      if (!shopDetails.brandCertificateUrl || shopDetails.brandCertificateUrl.trim() === '') {
        errors.push('shop');
      }
      
      if (!shopDetails.returnPolicyUrl || shopDetails.returnPolicyUrl.trim() === '') {
        errors.push('shop');
      }
    }
    
    // Validate Vehicle category
    if (categories.includes('Vehicle')) {
      const vehicleDetails = details.vehicle || {};
      
      if (!vehicleDetails.rcDocumentUrl || vehicleDetails.rcDocumentUrl.trim() === '') {
        errors.push('vehicle');
      }
      
      if (!vehicleDetails.dealershipLicenseUrl || vehicleDetails.dealershipLicenseUrl.trim() === '') {
        errors.push('vehicle');
      }
      
      if (!vehicleDetails.aviationOrMarineLicenseUrl || vehicleDetails.aviationOrMarineLicenseUrl.trim() === '') {
        errors.push('vehicle');
      }
    }
    
    // Validate SimRacing category
    if (categories.includes('SimRacing')) {
      const simRacingDetails = details.simRacing || {};
      
      if (!simRacingDetails.hardwareProofUrl || simRacingDetails.hardwareProofUrl.trim() === '') {
        errors.push('simracing');
      }
      
      if (!simRacingDetails.eventLicenseUrl || simRacingDetails.eventLicenseUrl.trim() === '') {
        errors.push('simracing');
      }
    }
    
    // Validate Event category
    if (categories.includes('Event')) {
      const eventDetails = details.events || {};
      
      if (!eventDetails.eventLicenseUrl || eventDetails.eventLicenseUrl.trim() === '') {
        errors.push('event');
      }
    }
    
    return errors;
  };

  const validateBranchDetails = (branches: BranchInfo[]) => {
    const errors: string[] = [];
    
    if (branches.length === 0) {
      errors.push('branches');
      return errors;
    }
    
    branches.forEach((branch, index) => {
      const branchErrors: string[] = [];
      
      // Required fields for each branch
      if (!branch.branchName || branch.branchName.trim() === '') {
        branchErrors.push('branchName');
      }
      
      if (!branch.addressLine1 || branch.addressLine1.trim() === '') {
        branchErrors.push('addressLine1');
      }
      
      if (!branch.city || branch.city.trim() === '') {
        branchErrors.push('city');
      }
      
      if (!branch.state || branch.state.trim() === '') {
        branchErrors.push('state');
      }
      
      if (!branch.postalCode || branch.postalCode.trim() === '') {
        branchErrors.push('postalCode');
      }
      
      // If there are any errors for this branch, add it to the main errors
      if (branchErrors.length > 0) {
        errors.push(`branch_${index}`);
      }
    });
    
    return errors;
  };

  const handleSubmit = async (data: VendorUpdateRequestFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let requestedChanges: {
        categories?: string[];
        category_specific_details?: CategorySpecificDetails;
        branches?: BranchInfo[];
        justification?: string;
        [key: string]: unknown;
      };
      
      switch (data.request_type) {
        case 'add_category':
          if (newCategories.length === 0) {
            toast({
              title: "Error",
              description: "Please select at least one category to add",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          
          // Validate category details
          const errors = validateCategoryDetails(newCategories, updateDetails);
          
          if (errors.length > 0) {
            setValidationErrors(errors);
            toast({
              title: "Validation Error",
              description: "Please provide all required details for the selected categories",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          setValidationErrors([]);
          
          requestedChanges = {
            categories: [...(vendorRegistration.categories || []), ...newCategories],
            category_specific_details: {
              ...vendorRegistration.category_specific_details,
              ...updateDetails
            },
            justification: data.justification
          };
          break;
          
        case 'add_branch':
          if (newBranches.length === 0) {
            toast({
              title: "Error",
              description: "Please add at least one branch",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          
          // Validate branch details
          const branchErrors = validateBranchDetails(newBranches);
          
          if (branchErrors.length > 0) {
            setValidationErrors(branchErrors);
            toast({
              title: "Validation Error",
              description: "Please complete all required fields for the branches",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          setValidationErrors([]);
          
          requestedChanges = {
            branches: [...(vendorRegistration.branches || []), ...newBranches],
            justification: data.justification
          };
          break;
          
        case 'update_details':
          requestedChanges = { ...updateDetails, justification: data.justification } as typeof requestedChanges;
          break;
      }

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/vendor/update-requests", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          vendor_registration_id: vendorRegistration.id,
          request_type: data.request_type,
          requested_changes: requestedChanges,
          current_data: {
            categories: vendorRegistration.categories,
            branches: vendorRegistration.branches,
            category_specific_details: vendorRegistration.category_specific_details
          },
          requested_by: user.id
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to submit update request");
      }

      toast({
        title: "Request Submitted",
        description: "Your update request has been submitted for admin review"
      });
      onSuccess();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Request Updates to Registration
          {validationErrors.length > 0 && (
            <span className="ml-2 text-red-500 text-sm font-normal">
              (Please complete required fields)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='px-3 sm-[764px]:px-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="request_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem 
                        value="add_category" 
                        disabled={availableCategories.length === 0}
                      >
                        Add New Categories {availableCategories.length === 0 && '(All categories already added)'}
                      </SelectItem>
                      <SelectItem value="add_branch">Add New Branches</SelectItem>
                      <SelectItem value="update_details">Update Business Details</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestType === 'add_category' && (
              <div className="space-y-4">
                {availableCategories.length === 0 ? (
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-800">All Categories Added</h3>
                      <p className="text-blue-700">
                        You have already been approved for all available business categories.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Select Additional Categories</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {availableCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={category}
                              checked={newCategories.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewCategories([...newCategories, category]);
                                } else {
                                  setNewCategories(newCategories.filter(c => c !== category));
                                }
                              }}
                            />
                            <Label htmlFor={category}>{category}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {newCategories.length > 0 && (
                      <CategorySpecificFields
                        categories={newCategories}
                        categoryDetails={updateDetails}
                        onChange={(details) => {
                          setUpdateDetails(details);
                          // Clear validation errors when user starts updating
                          if (validationErrors.length > 0) {
                            setValidationErrors([]);
                          }
                        }}
                        errors={validationErrors}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {requestType === 'add_branch' && (
              <BranchManagement
                branches={newBranches}
                onChange={(branches) => {
                  setNewBranches(branches);
                  // Clear validation errors when user starts updating
                  if (validationErrors.length > 0) {
                    setValidationErrors([]);
                  }
                }}
                errors={validationErrors}
              />
            )}

            {requestType === 'update_details' && (
              <div>
                <Label htmlFor="updateDetails">Details to Update (JSON format)</Label>
                <Textarea
                  id="updateDetails"
                  value={JSON.stringify(updateDetails, null, 2)}
                  onChange={(e) => {
                    try {
                      setUpdateDetails(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, keep the string value for now
                    }
                  }}
                  rows={8}
                  placeholder="Enter the fields you want to update in JSON format"
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification for Changes *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Please explain why you need these changes..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3">
              <Button 
                type="submit" 
                disabled={loading || (requestType === 'add_category' && availableCategories.length === 0)}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VendorUpdateRequestForm;
