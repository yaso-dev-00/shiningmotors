
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorApi } from '@/integrations/supabase/modules/vendors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VendorRegistrationStepOne from '@/components/vendor/VendorRegistrationStepOne';
import VendorRegistrationStepTwo from '@/components/vendor/VendorRegistrationStepTwo';
import VendorRegistrationHistory from '@/components/vendor/VendorRegistrationHistory';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle, Building, History, User, FileText } from 'lucide-react';
import NextLink from "next/link";

const VendorRegistrationTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStepOne, setShowStepOne] = useState(false);
  const [showStepTwo, setShowStepTwo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, [user]);

  const fetchVendorData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await vendorApi.getByUserId(user.id);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setVendorData(data);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepOneSuccess = () => {
    setShowStepOne(false);
    fetchVendorData();
  };

  const handleStepTwoSuccess = () => {
    setShowStepTwo(false);
    fetchVendorData();
  };

  // Determine current step based on data completeness and step field
  const getCurrentStep = (vendor: any) => {
    if (!vendor) return 1;
    
    // Use the step field from database, fallback to data analysis
    if (vendor.step) {
      return parseInt(vendor.step);
    }
    
    // Legacy fallback: If business_name is not provided, it's Step 1
    if (!vendor.business_name || vendor.business_name.trim() === '') {
      return 1;
    }
    
    // If business_name is provided, it's Step 2
    return 2;
  };

  // Check if Step 1 is completed and approved
  const isStepOneCompleted = (vendor: any) => {
    if (!vendor) return false;
    return getCurrentStep(vendor) === 1 && vendor.status === 'approved' && vendor.is_verified_by_admin === true;
  };

  // Check if Step 2 is completed and approved - FIXED: Only allow vendor dashboard after Step 2 approval
  const isStepTwoCompleted = (vendor: any) => {
    if (!vendor) return false;
    return getCurrentStep(vendor) === 2 && 
           vendor.status === 'approved' && 
           vendor.is_verified_by_admin === true;
  };

  // Check if user can proceed to Step 2
  const canProceedToStepTwo = (vendor: any) => {
    if (!vendor) return false;
    return getCurrentStep(vendor) === 1 && 
           vendor.status === 'approved' && 
           vendor.is_verified_by_admin === true;
  };

  // Check if user can access vendor dashboard - FIXED: Only after Step 2 completion
  const canAccessVendorDashboard = (vendor: any) => {
    if (!vendor) return false;
    return isStepTwoCompleted(vendor);
  };

  const getStatusBadge = (vendor: any) => {
    if (!vendor) return null;

    const currentStep = getCurrentStep(vendor);
    
    // Handle rejection
    if (vendor.rejection_reason) {
      return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejected</Badge>;
    }

    // Step 1 statuses
    if (currentStep === 1) {
      if (vendor.status === 'submitted') {
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Step 1 Under Review</Badge>;
      }
      if (vendor.status === 'approved' && vendor.is_verified_by_admin === true) {
        return <Badge variant="default" className="bg-blue-600"><CheckCircle className="w-4 h-4 mr-1" />Step 1 Approved</Badge>;
      }
    }

    // Step 2 statuses
    if (currentStep === 2) {
      if (vendor.status === 'submitted' || vendor.status === 'under_review') {
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Step 2 Under Review</Badge>;
      }
      if (vendor.status === 'approved' && vendor.is_verified_by_admin === true) {
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-4 h-4 mr-1" />Fully Approved</Badge>;
      }
    }

    return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Draft</Badge>;
  };

  const canEditStepOne = (vendor: any) => {
    if (!vendor) return true;
    return vendor.step==1 && (vendor.status === 'draft' || vendor.status === 'rejected');
  };
  const canEditStepTwo= (vendor: any) => {
    if (!vendor) return true;
    return vendor.step==2 && (vendor.status === 'draft' || vendor.status === 'rejected');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (showStepOne) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold  max-[769px]:text-[20px] whitespace-nowrap">Vendor Registration - Step 1</h2>
          <Button variant="outline" onClick={() => setShowStepOne(false)}>
            Cancel
          </Button>
        </div>
        <VendorRegistrationStepOne 
          onSuccess={handleStepOneSuccess}
          existingData={vendorData}
        />
      </div>
    );
  }

  if (showStepTwo) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 md:items-center flex-col md:flex-row justify-between">
          <h2 className="text-2xl font-bold ">Vendor Registration - Step 2</h2>
          <Button variant="outline" className='w-max' onClick={() => setShowStepTwo(false)}>
            Cancel
          </Button>
        </div>
        <VendorRegistrationStepTwo 
          onSuccess={handleStepTwoSuccess}
          vendorRegistration={vendorData}
        />
      </div>
    );
  }

  if (showHistory && vendorData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Registration History</h2>
          <Button variant="outline" onClick={() => setShowHistory(false)}>
            Back to Registration
          </Button>
        </div>
        <VendorRegistrationHistory vendorRegistrationId={vendorData.id} />
      </div>
    );
  }

  if (!vendorData) {
    return (
      <Card>
        <CardHeader className='max-[769px]:py-4'>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Become a Vendor
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:py-2'>
          <div className="text-center py-4  md:py-8">
            <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start Selling on Our Platform</h3>
            <p className="text-gray-600 mb-4 md:mb-6">
              Register as a vendor to start selling products, vehicles, services, or sim racing equipment.
              Our registration process has two steps for better verification.
            </p>
            <div className="space-y-3 md:space-y-4">
              <div className="text-left bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Step 1: Basic Information
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  • Personal information and contact details
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  • Business categories selection
                </p>
                <p className="text-sm text-gray-600">
                  • Admin review and approval required
                </p>
              </div>
              <div className="text-left bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Step 2: Complete Documentation
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  • Business information and documents
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  • Bank details and branch information
                </p>
                <p className="text-sm text-gray-600">
                  • Final admin review and approval
                </p>
              </div>
            </div>
            <Button onClick={() => setShowStepOne(true)} className="mt-6">
              Start Step 1 Registration
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStep = getCurrentStep(vendorData);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-y-3  md:items-center flex-col  md:flex-row justify-between">
            <span className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Vendor Registration Status - Step {currentStep}
            </span>
            {getStatusBadge(vendorData)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {/* Progress Indicator */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm">Basic Info</span>
              </div>
              <div className={`flex-1 h-1 ${
                canProceedToStepTwo(vendorData) || currentStep === 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  currentStep === 2 && isStepTwoCompleted(vendorData) ? 'bg-green-600' : 
                  currentStep === 2 ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm">Documentation</span>
              </div>
            </div>

            {/* Step 1 Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Personal Name</h4>
                <p className="text-gray-600">{vendorData.personal_name || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Email</h4>
                <p className="text-gray-600">{vendorData.email || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Mobile</h4>
                <p className="text-gray-600">{vendorData.mobile || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {vendorData.categories?.map((category: string) => (
                    <Badge key={category} variant="outline">{category}</Badge>
                  )) || <span className="text-gray-500">No categories</span>}
                </div>
              </div>
            </div>

            {/* Step 2 Information (if available) */}
            {currentStep === 2 && vendorData.business_name && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Business Information (Step 2)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium">Business Name</h5>
                    <p className="text-gray-600">{vendorData.business_name}</p>
                  </div>
                  <div>
                    <h5 className="font-medium">Account Holder</h5>
                    <p className="text-gray-600">{vendorData.account_holder_name || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status-specific messages and actions */}
            {vendorData.status === 'submitted' && currentStep === 1 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Step 1 Under Review</h4>
                <p className="text-blue-700">
                  Your basic information is being reviewed by our admin team. You will be notified once approved to proceed with Step 2.
                </p>
              </div>
            )}

            {canProceedToStepTwo(vendorData) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Step 1 Approved!</h4>
                <p className="text-green-700 mb-3">
                  Great! Your basic information has been approved. Now you can proceed with Step 2 to complete your vendor registration.
                </p>
                <Button 
                  onClick={() => setShowStepTwo(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Continue to Step 2
                </Button>
              </div>
            )}

            {vendorData.status === 'submitted' && currentStep === 2 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Step 2 Under Review</h4>
                <p className="text-blue-700">
                  Your complete registration is under final review. You will be notified once it's processed.
                </p>
              </div>
            )}

            {canAccessVendorDashboard(vendorData) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Vendor Approved!</h4>
                <p className="text-green-700 mb-3">
                  Congratulations! Your vendor registration has been fully approved. You can now access your vendor dashboard.
                </p>
                <NextLink href="/vendor-dashboard">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Go to Vendor Dashboard
                  </Button>
                </NextLink>
              </div>
            )}

            {vendorData.status === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Registration Rejected</h4>
                <p className="text-red-700 mb-2">{vendorData.rejection_reason || 'No reason provided'}</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() =>vendorData.step==1 ?setShowStepOne(true):setShowStepTwo(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Start New Registration
                  </Button>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-1 md:pt-3">
              {canEditStepOne(vendorData) && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowStepOne(true)}
                >
                  {vendorData.status === 'rejected' ? 'Resubmit Step 1' : 'Edit Step 1'}
                </Button>
              )}
               {canEditStepTwo(vendorData) && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowStepTwo(true)}
                >
                  {vendorData.status === 'rejected' ? 'Resubmit Step 2' : 'Edit Step 2'}
                </Button>
              )}
              
              {canProceedToStepTwo(vendorData) && (
                <Button 
                  onClick={() => setShowStepTwo(true)}
                >
                  Continue Step 2
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setShowHistory(true)}
              >
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
              
              {canAccessVendorDashboard(vendorData) && (
                <NextLink href="/vendor-dashboard">
                  <Button>Vendor Dashboard</Button>
                </NextLink>
              )}
            </div>

            <div className="text-sm text-gray-500 pt-1 md:pt-2">
              Registration Date: {vendorData.created_at ? new Date(vendorData.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorRegistrationTab;
