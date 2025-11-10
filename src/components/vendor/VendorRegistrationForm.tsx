
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { vendorApi, CategorySpecificDetails, BranchInfo, VendorRegistration } from '@/integrations/supabase/modules/vendors';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import CategorySpecificFields from './CategorySpecificFields';
import BranchManagement from './BranchManagement';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import { vendorRegistrationSchema, VendorRegistrationFormData, categories, governmentIdTypes } from '@/lib/validations/vendor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface VendorRegistrationFormProps {
  onSuccess: () => void;
  existingRegistration?: VendorRegistration;
  isReapplication?: boolean;
}

const VendorRegistrationForm: React.FC<VendorRegistrationFormProps> = ({ 
  onSuccess, 
  existingRegistration,
  isReapplication = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Check if form should be read-only
  const isReadOnly = existingRegistration && 
    !isReapplication && 
    ['submitted', 'under_review', 'approved'].includes(existingRegistration.status);

  const form = useForm<VendorRegistrationFormData>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      personal_name: existingRegistration?.personal_name || '',
      government_id_type: existingRegistration?.government_id_type || 'Aadhaar',
      government_id_number: existingRegistration?.government_id_number || '',
      government_id_document_url: existingRegistration?.government_id_document_url || '',
      business_name: existingRegistration?.business_name || '',
      gst_certificate_url: existingRegistration?.gst_certificate_url || '',
      msme_or_udyam_url: existingRegistration?.msme_or_udyam_url || '',
      trade_license_url: existingRegistration?.trade_license_url || '',
      shop_certificate_url: existingRegistration?.shop_certificate_url || '',
      utility_bill_url: existingRegistration?.utility_bill_url || '',
      rent_agreement_url: existingRegistration?.rent_agreement_url || '',
      property_tax_receipt_url: existingRegistration?.property_tax_receipt_url || '',
      account_holder_name: existingRegistration?.account_holder_name || '',
      bank_account_number: existingRegistration?.bank_account_number || '',
      ifsc_code: existingRegistration?.ifsc_code || '',
      bank_proof_document_url: existingRegistration?.bank_proof_document_url || '',
      mobile: existingRegistration?.mobile || '',
      email: existingRegistration?.email || '',
      whatsapp_number: existingRegistration?.whatsapp_number || '',
      business_logo_url: existingRegistration?.business_logo_url || '',
      categories: (existingRegistration?.categories || []) as typeof categories[number][],
      category_specific_details: existingRegistration?.category_specific_details || {},
      branches: existingRegistration?.branches || [],
      user_id: user?.id || ''
    }
  });

  const [originalData] = useState(form.getValues());
  const [changedFields, setChangedFields] = useState<string[]>([]);

  const selectedCategories = form.watch('categories');

  const handleCategoryChange = (category: typeof categories[number], checked: boolean) => {
    const currentCategories = form.getValues('categories');
    const newCategories: typeof categories[number][] = checked 
      ? [...currentCategories, category]
      : currentCategories.filter((c): c is typeof categories[number] => c !== category);
    
    form.setValue('categories', newCategories);
    
    if (isReapplication && JSON.stringify(originalData.categories) !== JSON.stringify(newCategories)) {
      setChangedFields(prev => [...new Set([...prev, 'categories'])]);
    }
  };

  const handleCategoryDetailsChange = (details: CategorySpecificDetails) => {
    form.setValue('category_specific_details', details);
    
    if (isReapplication && JSON.stringify(originalData.category_specific_details) !== JSON.stringify(details)) {
      setChangedFields(prev => [...new Set([...prev, 'category_specific_details'])]);
    }
  };

  const handleBranchesChange = (branches: BranchInfo[]) => {
    form.setValue('branches', branches);
    
    if (isReapplication && JSON.stringify(originalData.branches) !== JSON.stringify(branches)) {
      setChangedFields(prev => [...new Set([...prev, 'branches'])]);
    }
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    toast({
      title: "Terms Accepted",
      description: "You can now complete your vendor registration."
    });
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
    toast({
      title: "Terms Declined",
      description: "You must accept the terms and conditions to register as a vendor.",
      variant: "destructive"
    });
  };

  const handleSubmit = async (data: VendorRegistrationFormData) => {
    if (!user) return;

    // Check if terms are accepted for new registrations
    if (!existingRegistration && !termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    setLoading(true);
    try {
      if (existingRegistration && isReapplication) {
        await vendorApi.update(existingRegistration.id, data, changedFields);
        toast({
          title: "Reapplication Submitted",
          description: "Your updated vendor registration has been resubmitted for admin review."
        });
      } else if (existingRegistration) {
        await vendorApi.update(existingRegistration.id, data);
        toast({
          title: "Registration Updated",
          description: "Your vendor registration has been updated successfully."
        });
      } else {
        await vendorApi.create(data);
        toast({
          title: "Registration Submitted",
          description: "Your vendor registration has been submitted for admin review."
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error submitting vendor registration:', error);
      toast({
        title: "Error",
        description: "Failed to submit vendor registration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show read-only message if form is not editable
  if (isReadOnly) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Registration Submitted</h3>
              <p className="text-blue-700">
                Your vendor registration has been submitted and cannot be edited while under review. 
                If rejected, you'll be able to reapply with corrections.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {isReapplication && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Reapplication</h3>
                    <p className="text-orange-700">
                      You are reapplying after rejection. Please address the issues mentioned in the rejection reason.
                      Changed fields will be highlighted for admin review.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={changedFields.includes('personal_name') ? 'ring-2 ring-orange-300 rounded-md p-2' : ''}>
                <FormField
                  control={form.control}
                  name="personal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Full Name * {changedFields.includes('personal_name') && <span className="text-orange-600">(Updated)</span>}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className={changedFields.includes('government_id_type') ? 'ring-2 ring-orange-300 rounded-md p-2' : ''}>
                <FormField
                  control={form.control}
                  name="government_id_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Government ID Type * {changedFields.includes('government_id_type') && <span className="text-orange-600">(Updated)</span>}
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {governmentIdTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type === 'Aadhaar' ? 'Aadhaar Card' : 
                               type === 'VoterID' ? 'Voter ID' :
                               type === 'DriversLicense' ? "Driver's License" : type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="government_id_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Government ID Number *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="government_id_document_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Government ID Document URL *</FormLabel>
                    <FormControl>
                      <Input type="url" {...field} placeholder="Upload document and paste URL here" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gst_certificate_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Certificate URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="msme_or_udyam_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MSME/Udyam Certificate URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trade_license_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade License URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shop_certificate_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Certificate URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="whatsapp_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Logo URL</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Business Categories *</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category) => (
                        <FormField
                          key={category}
                          control={form.control}
                          name="categories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category)}
                                    onCheckedChange={(checked) => 
                                      handleCategoryChange(category, checked as boolean)
                                    }
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>{category}</FormLabel>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Category Specific Details */}
          {selectedCategories && selectedCategories.length > 0 && (
            <CategorySpecificFields
              categories={selectedCategories}
              categoryDetails={form.watch('category_specific_details') || {}}
              onChange={handleCategoryDetailsChange}
            />
          )}

          {/* Branch Management */}
          <BranchManagement
            branches={form.watch('branches') || []}
            onChange={handleBranchesChange}
          />

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="account_holder_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account Number *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ifsc_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., HDFC0000123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_proof_document_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Proof Document URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Proofs */}
          <Card>
            <CardHeader>
              <CardTitle>Address Proofs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="utility_bill_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Utility Bill URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rent_agreement_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent Agreement URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_tax_receipt_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Tax Receipt URL *</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !form.formState.isValid}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isReapplication 
                ? 'Resubmit Registration' 
                : existingRegistration 
                  ? 'Update Registration' 
                  : 'Submit Registration'
              }
            </Button>
          </div>
        </form>
      </Form>

      <TermsAndConditionsModal
        open={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </>
  );
};

export default VendorRegistrationForm;
