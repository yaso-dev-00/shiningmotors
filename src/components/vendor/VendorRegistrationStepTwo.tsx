import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorApi, VendorRegistration } from '@/integrations/supabase/modules/vendors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building, CreditCard, FileText, MapPin, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const stepTwoSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  government_id_type: z.enum(['Aadhaar', 'Passport', 'VoterID', 'DriversLicense']),
  government_id_number: z.string().min(6, 'Government ID number is required'),
  government_id_document_url: z.string().url('Valid document URL is required'),
  gst_certificate_url: z.string().url('Valid GST certificate URL is required'),
  msme_or_udyam_url: z.string().url('Valid MSME/Udyam certificate URL is required'),
  trade_license_url: z.string().url('Valid trade license URL is required'),
  shop_certificate_url: z.string().url('Valid shop certificate URL is required'),
  utility_bill_url: z.string().url('Valid utility bill URL is required'),
  rent_agreement_url: z.string().url('Valid rent agreement URL is required'),
  property_tax_receipt_url: z.string().url('Valid property tax receipt URL is required'),
  account_holder_name: z.string().min(2, 'Account holder name is required'),
  bank_account_number: z.string().min(9, 'Valid bank account number is required'),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  bank_proof_document_url: z.string().url('Valid bank proof document URL is required'),
  business_logo_url: z.string().url().optional().or(z.literal('')),
  branches: z.array(z.object({
    branchName: z.string().min(2, 'Branch name is required'),
    addressLine1: z.string().min(5, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().regex(/^[0-9]{6}$/, 'Valid postal code is required'),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
  })).optional(),
});

interface VendorRegistrationStepTwoProps {
  onSuccess: () => void;
  vendorRegistration: VendorRegistration;
}

const VendorRegistrationStepTwo: React.FC<VendorRegistrationStepTwoProps> = ({ onSuccess, vendorRegistration }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof stepTwoSchema>>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      business_name: '',
      government_id_type: 'Aadhaar',
      government_id_number: '',
      government_id_document_url: '',
      gst_certificate_url: '',
      msme_or_udyam_url: '',
      trade_license_url: '',
      shop_certificate_url: '',
      utility_bill_url: '',
      rent_agreement_url: '',
      property_tax_receipt_url: '',
      account_holder_name: '',
      bank_account_number: '',
      ifsc_code: '',
      bank_proof_document_url: '',
      business_logo_url: '',
      branches: [],
    }
  });
const { fields, append: appendBranch, remove: removeBranch } = useFieldArray({
  control,
  name: "branches",
});
  useEffect(() => {
    // Only add default branch on initial load, not on every vendorRegistration change
    if (vendorRegistration && !hasInitialized.current) {
      if (!vendorRegistration.branches || vendorRegistration.branches.length === 0) {
        // No branches found, add a blank one
        appendBranch({
          branchName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
        });
      }
    }
  }, [vendorRegistration, appendBranch]);
  useEffect(() => {
    // Only reset the form on initial load, not on every vendorRegistration change
    if (vendorRegistration && !hasInitialized.current) {
      reset({
        business_name: vendorRegistration.business_name || '',
        government_id_type: vendorRegistration.government_id_type || 'Aadhaar',
        government_id_number: vendorRegistration.government_id_number || '',
        government_id_document_url: vendorRegistration.government_id_document_url || '',
        gst_certificate_url: vendorRegistration.gst_certificate_url || '',
        msme_or_udyam_url: vendorRegistration.msme_or_udyam_url || '',
        trade_license_url: vendorRegistration.trade_license_url || '',
        shop_certificate_url: vendorRegistration.shop_certificate_url || '',
        utility_bill_url: vendorRegistration.utility_bill_url || '',
        rent_agreement_url: vendorRegistration.rent_agreement_url || '',
        property_tax_receipt_url: vendorRegistration.property_tax_receipt_url || '',
        account_holder_name: vendorRegistration.account_holder_name || '',
        bank_account_number: vendorRegistration.bank_account_number || '',
        ifsc_code: vendorRegistration.ifsc_code || '',
        bank_proof_document_url: vendorRegistration.bank_proof_document_url || '',
        business_logo_url: vendorRegistration.business_logo_url || '',
        branches: Array.isArray(vendorRegistration.branches)
          ? vendorRegistration.branches.map(branch => ({
              branchName: branch.branchName || '',
              addressLine1: branch.addressLine1 || '',
              addressLine2: branch.addressLine2 || '',
              city: branch.city || '',
              state: branch.state || '',
              postalCode: branch.postalCode || '',
              contactPerson: branch.contactPerson || '',
              contactPhone: branch.contactPhone || '',
              contactEmail: branch.contactEmail || '',
            }))
          : [],
      });
      hasInitialized.current = true;
    }
  }, [vendorRegistration, reset]);


console.log(fields)
  const onSubmit = async (data: z.infer<typeof stepTwoSchema>) => {
    if (!user || !vendorRegistration) return;
    const updatedData = {
      ...data,
      step: 2,
      status: 'submitted'
    };

    try {
      const { error } = await vendorApi.updateStepTwo(vendorRegistration.id, updatedData);
      if (error) throw error;

      toast({
        title: 'Registration Completed',
        description: 'Your vendor registration has been submitted for final review.'
      });
      // Reset the initialization flag so the form can be re-initialized if needed
      hasInitialized.current = false;
      onSuccess();
    } catch (error: unknown) {
      console.error('Error submitting step 2:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to complete registration',
        variant: 'destructive',
      });
    }
  };

  return (
   <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
  <Card>
    <CardHeader className='max-[769px]:py-3'>
      <CardTitle className="flex items-center">
        {/* <Building className="w-5 h-5 mr-2" />
        Vendor Registration - Step 2 */}
      </CardTitle>
      <p className="text-gray-600">
        Complete your vendor registration with business information, documents, and bank details.
      </p>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-8">
        {/* Business Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Building className="w-4 h-4 mr-2" /> Business Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input {...register("business_name")} />
              {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="business_logo_url">Business Logo URL</Label>
              <Input type="url" {...register("business_logo_url")} />
            </div>
          </div>
        </div>

        {/* Government ID Info */}
        <div className="space-y-2 md:space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="w-4 h-4 mr-2" /> Government ID Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            <div>
              <Label htmlFor="government_id_type">ID Type *</Label>
              <select {...register("government_id_type")} className="w-full p-2 border rounded-md">
                <option value="Aadhaar">Aadhaar</option>
                <option value="Passport">Passport</option>
                <option value="VoterID">Voter ID</option>
                <option value="DriversLicense">Driver's License</option>
              </select>
            </div>
            <div>
              <Label htmlFor="government_id_number">ID Number *</Label>
              <Input {...register("government_id_number")} />
              {errors.government_id_number && (
                <p className="text-red-500 text-sm mt-1">{errors.government_id_number.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="government_id_document_url">Document URL *</Label>
              <Input type="url" {...register("government_id_document_url")} />
              {errors.government_id_document_url && (
                <p className="text-red-500 text-sm mt-1">{errors.government_id_document_url.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Business Docs */}
        <div className="space-y-2 md:space-y-4">
          <h3 className="text-lg font-semibold">Business Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {[
              ["gst_certificate_url", "GST Certificate URL *"],
              ["msme_or_udyam_url", "MSME/Udyam Certificate URL *"],
              ["trade_license_url", "Trade License URL *"],
              ["shop_certificate_url", "Shop Certificate URL *"],
            ].map(([field, label]) => (
              <div key={field}>
                <Label htmlFor={field}>{label}</Label>
                <Input type="url" {...register(field as any)} />
                {errors[field as keyof typeof errors] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[field as keyof typeof errors]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Address Proofs */}
        <div className="space-y-2 md:space-y-4">
          <h3 className="text-lg font-semibold">Address Proof Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            {[
              ["utility_bill_url", "Utility Bill URL *"],
              ["rent_agreement_url", "Rent Agreement URL *"],
              ["property_tax_receipt_url", "Property Tax Receipt URL *"],
            ].map(([field, label]) => (
              <div key={field}>
                <Label htmlFor={field}>{label}</Label>
                <Input type="url" {...register(field as any)} />
                {errors[field as keyof typeof errors] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[field as keyof typeof errors]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-2 md:space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <CreditCard className="w-4 h-4 mr-2" /> Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {[
              ["account_holder_name", "Account Holder Name *"],
              ["bank_account_number", "Bank Account Number *"],
              ["ifsc_code", "IFSC Code *"],
              ["bank_proof_document_url", "Bank Proof Document URL *"],
            ].map(([field, label]) => (
              <div key={field}>
                <Label htmlFor={field}>{label}</Label>
                <Input type={field.includes("url") ? "url" : "text"} {...register(field as any)} />
                {errors[field as keyof typeof errors] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[field as keyof typeof errors]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Branch Info */}
        <div className="space-y-2 md:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="w-4 h-4 mr-2" /> Branch Information
            </h3>
            <Button 
              type="button" 
              onClick={() => appendBranch({
                branchName: '',
                addressLine1: '',
                city: '',
                state: '',
                postalCode: '',
                addressLine2: '',
                contactPerson: '',
                contactPhone: '',
                contactEmail: '',
              })} 
              variant="outline" 
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Branch
            </Button>
          </div>

          {fields.map((branch, index) => (
            <Card key={branch.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Branch {index + 1}</h4>
                {fields.length > 0 && (
                  <Button
                    type="button"
                    onClick={() => removeBranch(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {[
                  ["branchName", "Branch Name *"],
                  ["addressLine1", "Address Line 1 *"],
                  ["addressLine2", "Address Line 2"],
                  ["city", "City *"],
                  ["state", "State *"],
                  ["postalCode", "Postal Code *"],
                  ["contactPerson", "Contact Person"],
                  ["contactPhone", "Contact Phone"],
                  ["contactEmail", "Contact Email"],
                ].map(([field, label], idx) => (
                  <div key={idx} className={field === "contactEmail" ? "md:col-span-2" : ""}>
                    <Label htmlFor={`branches.${index}.${field}`}>{label}</Label>
                    <Input type="text" {...register(`branches.${index}.${field}` as any)} />
                    {errors?.branches?.[index] && field !== 'id' && (errors.branches[index] as Record<string, { message?: string }>)?.[field] && (
                      <p className="text-red-500 text-sm mt-1">
                        {(errors.branches[index] as Record<string, { message?: string }>)[field]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Complete Registration"}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>

  );
};

export default VendorRegistrationStepTwo;
