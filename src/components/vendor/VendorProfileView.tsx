
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { VendorRegistration, BranchInfo } from '@/integrations/supabase/modules/vendors';
import { Building, MapPin, Phone, Mail, User, CreditCard, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface VendorProfileViewProps {
  vendorRegistration: VendorRegistration;
}

const VendorProfileView: React.FC<VendorProfileViewProps> = ({ vendorRegistration }) => {
  const getStatusBadge = () => {
    if (vendorRegistration.rejection_reason) {
      return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejected</Badge>;
    }
    if (vendorRegistration.is_verified_by_admin) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-4 h-4 mr-1" />Verified</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Pending Review</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Registration Status
            </span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Submitted On</Label>
              <p className="text-gray-900">
                {vendorRegistration.submitted_at 
                  ? new Date(vendorRegistration.submitted_at).toLocaleDateString()
                  : 'Not submitted'
                }
              </p>
            </div>
            {vendorRegistration.verified_at && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Verified On</Label>
                <p className="text-gray-900">
                  {new Date(vendorRegistration.verified_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            {vendorRegistration.whatsapp_number && (
              <div>
                <Label className="text-sm font-medium text-gray-500">WhatsApp Number</Label>
                <p className="text-gray-900">{vendorRegistration.whatsapp_number}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Business Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {vendorRegistration.categories?.map((category) => (
              <Badge key={category} variant="outline">{category}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Banking Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Account Holder Name</Label>
              <p className="text-gray-900">{vendorRegistration.account_holder_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Bank Account Number</Label>
              <p className="text-gray-900">{vendorRegistration.bank_account_number}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">IFSC Code</Label>
              <p className="text-gray-900">{vendorRegistration.ifsc_code}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Government ID Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Government ID Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">ID Type</Label>
              <p className="text-gray-900">{vendorRegistration.government_id_type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">ID Number</Label>
              <p className="text-gray-900">{vendorRegistration.government_id_number}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches */}
      {vendorRegistration.branches && Array.isArray(vendorRegistration.branches) && vendorRegistration.branches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Branch Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendorRegistration.branches.map((branch: BranchInfo, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{branch.branchName || `Branch ${index + 1}`}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Address</Label>
                      <p>{branch.addressLine1}</p>
                      {branch.addressLine2 && <p>{branch.addressLine2}</p>}
                      <p>{branch.city}, {branch.state} - {branch.postalCode}</p>
                    </div>
                    {branch.contactPerson && (
                      <div>
                        <Label className="text-xs text-gray-500">Contact Person</Label>
                        <p>{branch.contactPerson}</p>
                        {branch.contactPhone && <p className="flex items-center"><Phone className="w-3 h-3 mr-1" />{branch.contactPhone}</p>}
                        {branch.contactEmail && <p className="flex items-center"><Mail className="w-3 h-3 mr-1" />{branch.contactEmail}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason */}
      {vendorRegistration.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{vendorRegistration.rejection_reason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorProfileView;
