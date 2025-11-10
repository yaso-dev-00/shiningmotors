
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { VendorRegistration, BranchInfo } from '@/integrations/supabase/modules/vendors';
// @ts-ignore - file-saver types not available
import { saveAs } from 'file-saver';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Eye,
  Calendar,
  Shield,
  Globe,
  MessageSquare,
  Star,
  TrendingUp,
  Award,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CategoryDocumentCard from './CategoryDocumentCard';
import BusinessLogoEdit from './BusinessLogoEdit';

interface EnhancedVendorProfileProps {
  vendorRegistration: VendorRegistration;
}

export const DocumentCard = ({ title, url, description ,isVerified=true}: { title: string; url: string; description: string ,isVerified?:boolean}) => {

    return <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3 max-[769px]:py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <Eye className="w-4 h-4 text-gray-600" onClick={()=>window.open("https://storage.googleapis.com/amazing-insight-415210.appspot.com/Documents/file/as122ds_332_asa222.pdf")}/>
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Download className="w-4 h-4 text-gray-600" onClick={()=> saveAs(url,title)} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-[769px]:pb-4 pt-0">
        {description &&<p className="text-xs text-gray-600">{description}</p>}
        {isVerified && <div className="mt-2 flex items-center">
          <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
          <span className="text-xs text-green-600">Verified</span>
        </div>}
      </CardContent>
    </Card>
}
const EnhancedVendorProfile: React.FC<EnhancedVendorProfileProps> = ({ vendorRegistration }) => {
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(vendorRegistration.business_logo_url || null);
  const { user } = useAuth();

  const getStatusBadge = () => {
    if (vendorRegistration.rejection_reason) {
      return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejected</Badge>;
    }
    if (vendorRegistration.is_verified_by_admin) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-4 h-4 mr-1" />Verified</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Pending Review</Badge>;
  };

  const handleLogoUpdate = (newLogoUrl: string | null) => {
    setCurrentLogoUrl(newLogoUrl);
  };



  return (
    <div className="space-y-6 md:space-y-10">
      {/* Header Section */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 opacity-5"></div>
        <CardHeader className="relative pb-6 pt-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <BusinessLogoEdit
                  currentLogoUrl={currentLogoUrl || undefined}
                  vendorId={vendorRegistration.id}
                  businessName={vendorRegistration.business_name || ""}
                  onLogoUpdate={handleLogoUpdate}
                  isEditable={user?.id === vendorRegistration.user_id}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{vendorRegistration.business_name}</h1>
                  <p className="text-lg text-gray-600 font-medium mt-1">{vendorRegistration.personal_name}</p>
                </div>
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                  {getStatusBadge()}
                  {vendorRegistration.is_mobile_verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                      <Shield className="w-3 h-3 mr-1" />
                      Mobile Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-500 font-medium">Member since</div>
              <div className="text-lg font-bold text-gray-900">
                {new Date(vendorRegistration.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900">{vendorRegistration.categories?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Branches</p>
                <p className="text-3xl font-bold text-gray-900">{vendorRegistration.branches?.length || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-3xl font-bold text-gray-900">4.5</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Trust Score</p>
                <p className="text-3xl font-bold text-gray-900">98%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className='max-[769px]:p-6 p-8'>
          <CardTitle className="flex items-center text-xl font-bold text-gray-900 max-[769px]:text-[22px]">
            <Phone className="w-6 h-6 mr-3 text-blue-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:p-6 max-[769px]:pt-0 p-8 pt-0'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div>
              <Label className="text-sm font-medium text-gray-500">Primary Email</Label>
              <div className="flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <p className="text-gray-900">{vendorRegistration.email}</p>
                <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-500">Mobile Number</Label>
              <div className="flex items-center mt-1">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <p className="text-gray-900">{vendorRegistration.mobile}</p>
                {vendorRegistration.is_mobile_verified && (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                )}
              </div>
            </div>
            
            {vendorRegistration.whatsapp_number && (
              <div>
                <Label className="text-sm font-medium text-gray-500">WhatsApp Number</Label>
                <div className="flex items-center mt-1">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{vendorRegistration.whatsapp_number}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Categories */}
      <Card className="border-0 shadow-lg">
        <CardHeader className='max-[769px]:p-6 p-8'>
          <CardTitle className="flex items-center text-xl font-bold text-gray-900 max-[769px]:text-[22px]">
            <Building className="w-6 h-6 mr-3 text-blue-600" />
            Business Categories & Services
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:px-6 p-8 pt-0'>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              {vendorRegistration.categories?.map((category) => (
                <Badge key={category} variant="outline" className="px-4 py-2 text-sm">
                  {category}
                </Badge>
              ))}
            </div>
            
            {vendorRegistration.category_specific_details && (
              <div className="mt-6">
                <h4 className="font-semibold mb-4 text-lg">Category-Specific Documents</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(vendorRegistration.category_specific_details).map(([category, details]) => (
                    <CategoryDocumentCard
                      key={category}
                      category={category}
                      documents={details as Record<string, string>}
                      isVerified={Object.values(details as Record<string, string>).some(url => url && url.trim() !== '')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className='max-[769px]:p-6 p-8'>
          <CardTitle className="flex items-center text-xl font-bold text-gray-900 max-[769px]:text-[22px]">
            <CreditCard className="w-6 h-6 mr-3 text-blue-600" />
            Banking & Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:p-6 p-8 pt-0'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div>
              <Label className="text-sm font-medium text-gray-500">Account Holder Name</Label>
              <p className="text-gray-900 font-medium mt-1">{vendorRegistration.account_holder_name}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-500">Bank Account Number</Label>
              <p className="text-gray-900 font-mono mt-1">
                {vendorRegistration.bank_account_number ? `****${vendorRegistration.bank_account_number.slice(-4)}` : "N/A"}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-500">IFSC Code</Label>
              <p className="text-gray-900 font-mono mt-1">{vendorRegistration.ifsc_code}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Government ID Information */}
      <Card>
        <CardHeader className='max-[769px]:px-4 max-[769px]:py-4'>
          <CardTitle className="flex items-center max-[769px]:text-[22px]">
            <Shield className="w-5 h-5 mr-2" />
            Government ID & Verification
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:px-4'>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">ID Type</Label>
              <p className="text-gray-900 font-medium mt-1">{vendorRegistration.government_id_type}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-500">ID Number</Label>
              <p className="text-gray-900 font-mono mt-1">
                {vendorRegistration.government_id_number ? `****${vendorRegistration.government_id_number.slice(-4)}` : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader className='max-[769px]:px-4'>
          <CardTitle className="flex items-center max-[769px]:text-[22px]">
            <FileText className="w-5 h-5 mr-2" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:px-4'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentCard
              title="Government ID"
              url={vendorRegistration.government_id_document_url || ""}
              description="Valid government-issued identification document"
            />
            
            <DocumentCard
              title="GST Certificate"
              url={vendorRegistration.gst_certificate_url || ""}
              description="Goods and Services Tax registration certificate"
            />
            
            <DocumentCard
              title="Trade License"
              url={vendorRegistration.trade_license_url || ""}
              description="Business trade license or registration"
            />
            
            <DocumentCard
              title="MSME/Udyam Certificate"
              url={vendorRegistration.msme_or_udyam_url || ""}
              description="Micro, Small & Medium Enterprises certificate"
            />
            
            <DocumentCard
              title="Shop Certificate"
              url={vendorRegistration.shop_certificate_url || ""}
              description="Shop establishment certificate"
            />
            
            <DocumentCard
              title="Bank Proof"
              url={vendorRegistration.bank_proof_document_url || ""}
              description="Bank account verification document"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Proofs */}
      <Card>
        <CardHeader className='max-[769px]:px-4'>
          <CardTitle className="flex items-center max-[769px]:text-[22px]">
            <MapPin className="w-5 h-5 mr-2" />
            Address Verification Documents
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:px-4'>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DocumentCard
              title="Utility Bill"
              url={vendorRegistration.utility_bill_url || ""}
              description="Recent electricity/water/gas bill"
            />
            
            <DocumentCard
              title="Rent Agreement"
              url={vendorRegistration.rent_agreement_url || ""}
              description="Property rental agreement document"
            />
            
            <DocumentCard
              title="Property Tax Receipt"
              url={vendorRegistration.property_tax_receipt_url || ""}
              description="Municipal property tax payment receipt"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branch Locations */}
      {vendorRegistration.branches && Array.isArray(vendorRegistration.branches) && vendorRegistration.branches.length > 0 && (
        <Card>
          <CardHeader className='max-[769px]:px-4'>
            <CardTitle className="flex items-center max-[769px]:text-[22px]">
              <MapPin className="w-5 h-5 mr-2" />
              Branch Locations ({vendorRegistration.branches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='max-[769px]:px-4'>
            <div className="space-y-3 md:space-y-6">
              {vendorRegistration.branches.map((branch: BranchInfo, index: number) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2 max-[769px]:py-3 md:pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      {branch.branchName || `Branch ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Address</Label>
                        <div className="mt-1 text-sm text-gray-900">
                          <p>{branch.addressLine1}</p>
                          {branch.addressLine2 && <p>{branch.addressLine2}</p>}
                          <p>{branch.city}, {branch.state} - {branch.postalCode}</p>
                        </div>
                      </div>
                      
                      {branch.contactPerson && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Contact Person</Label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-900">{branch.contactPerson}</p>
                            {branch.contactPhone && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {branch.contactPhone}
                              </p>
                            )}
                            {branch.contactEmail && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {branch.contactEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Verification Status</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader className='max-[769px]:px-4'>
          <CardTitle className="flex items-center max-[769px]:text-[22px]">
            <Calendar className="w-5 h-5 mr-2" />
            Registration Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className='max-[769px]:px-4'>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Registration Submitted</p>
                <p className="text-xs text-gray-500">
                  {vendorRegistration.submitted_at 
                    ? new Date(vendorRegistration.submitted_at).toLocaleDateString()
                    : 'Not submitted'
                  }
                </p>
              </div>
            </div>
            
            {vendorRegistration.is_verified_by_admin && vendorRegistration.verified_at && (
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Registration Approved</p>
                  <p className="text-xs text-gray-500">
                    {new Date(vendorRegistration.verified_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-xs text-gray-500">
                  {new Date(vendorRegistration.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Reason (if applicable) */}
      {vendorRegistration.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Rejection Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{vendorRegistration.rejection_reason}</p>
            <div className="mt-4 p-3 bg-red-100 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Next Steps:</p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                <li>Review the rejection reason carefully</li>
                <li>Update the necessary documents or information</li>
                <li>Resubmit your application for review</li>
                <li>Contact support if you need assistance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVendorProfile;
