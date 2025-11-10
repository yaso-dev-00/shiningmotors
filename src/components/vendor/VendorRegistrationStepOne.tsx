import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { CategorySpecificDetails, vendorApi } from '@/integrations/supabase/modules/vendors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Building, User, Phone, Mail, Tag } from 'lucide-react';
import { categorySpecificDetailsSchema } from '@/lib/validations/vendor';
import CategorySpecificFields from './CategorySpecificFields';
import VendorOnboardingAgreement from '@/views/vendor/VendorOnboardAgreement';

const stepOneSchema = z.object({
  personal_name: z.string().min(2, 'Full name must be at least 2 characters'),
  mobile: z.string().min(10, 'Enter valid mobile number').max(10,"Mobile number must be 10 digits"),
  email: z.string().email('Invalid email format'),
  whatsapp_number: z.string().min(10, 'Enter valid number').max(10,"Number must be 10 digits"),
  categories: z.array(z.string()).min(1, 'Please select at least one category'),
  category_specific_details: categorySpecificDetailsSchema,
}).superRefine((data, ctx) => {
  const selected = data.categories.map(item => item.toLowerCase());
  const details = data.category_specific_details;

  selected.forEach((category) => {
    let categoryDetails: CategorySpecificDetails[keyof CategorySpecificDetails] | undefined;
  
    if (category == "simracing") {
      categoryDetails = details["simRacing"];
    } else if (category === "event") {
      // Handle both 'event' (schema) and 'events' (interface) for compatibility
      // The schema uses 'event' but the interface uses 'events'
      const eventDetails = (details as Record<string, unknown>)["event"];
      categoryDetails = eventDetails as CategorySpecificDetails["events"];
    } else {
      // Map category names to interface keys (schema uses 'event', interface uses 'events')
      const categoryKeyMap: Record<string, keyof CategorySpecificDetails> = {
        'shop': 'shop',
        'vehicle': 'vehicle',
        'service': 'service',
        'event': 'events',
      };
      const categoryKey = categoryKeyMap[category] || (category.toLowerCase() as keyof CategorySpecificDetails);
      // Cast details to CategorySpecificDetails to handle schema/interface mismatch (event vs events)
      categoryDetails = (details as CategorySpecificDetails)?.[categoryKey];
    }
    console.log(categoryDetails, category)
    if (!categoryDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Details required for ${category}`,
        path: ['category_specific_details', category],
      });
      return;
    }

    const hasEmptyField = Object.values(categoryDetails).some(
      (v) =>
        v === '' ||
        (Array.isArray(v) && v.length === 0)
    );

    if (hasEmptyField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `All fields must be filled for ${category}`,
        path: ['category_specific_details', category],
      });
    }
  });
});
type StepOneData = z.infer<typeof stepOneSchema>;

interface VendorRegistrationStepOneProps {
  onSuccess: () => void;
  existingData?: Partial<StepOneData>;
}

const categories = ['Shop', 'Vehicle', 'Service', 'SimRacing', 'Event'];

const VendorRegistrationStepOne = ({ onSuccess, existingData }: VendorRegistrationStepOneProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
   const [showAgreement, setShowAgreement] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const onClose=()=>{
      setShowAgreement(false)
  }
 const handleAgreementAccept = () => {
    setAgreementAccepted(true);
    setShowAgreement(false);
    toast({
      title: "Agreement Accepted",
      description: "You can now proceed with your vendor registration.",
    });
  };

  const handleAgreementDecline = () => {
    setShowAgreement(false);
    toast({
      title: "Agreement Declined",
      description: "You must accept the vendor agreement to proceed with registration.",
      variant: "destructive"
    });
  };
  const form = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      personal_name: existingData?.personal_name || '',
      mobile: existingData?.mobile || '',
      email: existingData?.email || user?.email || '',
      whatsapp_number: existingData?.whatsapp_number || '',
      categories: existingData?.categories || [],
      category_specific_details: existingData?.category_specific_details || {
        shop: {
          productCatalogUrl: "",
          brandCertificateUrl: "",
          returnPolicyUrl: "",
        },
        vehicle: {
          rcDocumentUrl: "",
          dealershipLicenseUrl: "",
          aviationOrMarineLicenseUrl: "",
        },
        simRacing: {
          hardwareProofUrl: "",
          eventLicenseUrl: "",
          pastEventMediaUrls: []
        },
        service: {
          centerPhotosUrl: "",
          certificationUrls: [],
          insuranceProofUrl: ""
        },
        event:{
           eventLicenseUrl:"",
           pastEventMediaUrls:[]
        }
      }
    }
  });
  console.log(form.formState.errors, form.getValues())
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const [originalData] = useState(form.getValues());
  const onSubmit = async (data: StepOneData) => {
    if (!user) return;
     if (!existingData && !agreementAccepted) {
      setShowAgreement(true);
      return;
    }
   
    const filterData = data.categories.reduce((acc, item) => {
      const categoryKeys = Object.keys(data.category_specific_details || {});
      const matchedKey = categoryKeys.find(
        (key) => key.toLowerCase() === item.toLowerCase()
      );

      if (matchedKey) {
        const categoryKey = item === 'simRacing' ? 'simRacing' : matchedKey;
        const matchedKeyTyped = matchedKey as keyof typeof data.category_specific_details;
        acc[categoryKey] = data.category_specific_details[matchedKeyTyped];
      }

      return acc;
    }, {} as Record<string, any>);
    console.log(filterData)
    try {
      const registrationData = {
        ...data,
        category_specific_details: { ...filterData },
        user_id: user.id,
        step: 1,
        status: 'step_one_submitted'
      };

      const { error } = await vendorApi.createStepOne(registrationData);
      if (error) throw error;

      toast({
        title: "Step 1 Submitted Successfully",
        description: "Your basic information has been submitted for review. You'll receive an email once approved to continue with Step 2.",
      });

      onSuccess();
    } catch (error: unknown) {
      console.error('Error submitting step 1:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit registration";
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const selectedCategories = watch('categories');

  const handleCategoryChange = (category: string, checked: boolean) => {
    const current = selectedCategories || [];
    setValue(
      'categories',
      checked ? [...current, category] : current.filter((c) => c !== category),
      { shouldValidate: true }
    );

  };

  const [changedFields, setChangedFields] = useState<string[]>([]);
  const handleCategoryDetailsChange = (details: CategorySpecificDetails) => {
    form.setValue('category_specific_details', details);

    // if (JSON.stringify(originalData.category_specific_details) !== JSON.stringify(details)) {
    //   setChangedFields(prev => [...new Set([...prev, 'category_specific_details'])]);
    // }
  };
  return (
    <>
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center " >
            {/* <Building className="w-5 h-5 mr-2" />
            Vendor Registration - Step 1 */}
          </CardTitle>
          <p className="text-gray-600">
            Please provide your basic information and select business categories. This will be reviewed by our admin team.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            {/* Personal Information */}
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="w-4 h-4 mr-2" />
                Personal Information
              </h3>

              <div>
                <Label htmlFor="personal_name">Full Name *</Label>
                <Input id="personal_name" {...register('personal_name')} className={errors.personal_name ? 'border-red-500' : ''} />
                {errors.personal_name && <p className="text-red-500 text-sm mt-1">{errors.personal_name.message}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input id="mobile" type="tel" {...register('mobile')} className={errors.mobile ? 'border-red-500' : ''} />
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>}
                </div>

                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input id="whatsapp_number"  type="tel" {...register('whatsapp_number')}  className={errors.whatsapp_number? 'border-red-500' : ''}  />
                  {errors.whatsapp_number && <p className="text-red-500 text-sm mt-1">{errors.whatsapp_number.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
            </div>

            {/* Business Categories */}
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Business Categories *
              </h3>
              <p className="text-sm text-gray-600">
                Select the categories you want to sell in. You can add more categories later after approval.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                    />
                    <Label htmlFor={category} className="cursor-pointer">{category}</Label>
                  </div>
                ))}
              </div>
              {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories.message}</p>}
            </div>
            {selectedCategories && selectedCategories.length > 0 && (
              <CategorySpecificFields
                categories={selectedCategories}
                categoryDetails={watch('category_specific_details') || {}}
                onChange={handleCategoryDetailsChange}
                errors={form.formState.errors.category_specific_details && Object.keys(form.formState.errors?.category_specific_details) || []}
              />

            )}


            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Step 1 for Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>

      <VendorOnboardingAgreement
        {...{onClose}}
        isOpen={showAgreement}
        onAccept={handleAgreementAccept}
        onDecline={handleAgreementDecline}
      />
    
    </>
  );
};

export default VendorRegistrationStepOne;
