
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, ExternalLink, FileText, MapPin, Building2, User, Phone, Mail } from 'lucide-react';
import { VendorUpdateRequest, CategorySpecificDetails, BranchInfo } from '@/integrations/supabase/modules/vendors';

interface UpdateRequestDetailsModalProps {
  request: VendorUpdateRequest | null;
  open: boolean;
  onClose: () => void;
}

const UpdateRequestDetailsModal: React.FC<UpdateRequestDetailsModalProps> = ({
  request,
  open,
  onClose
}) => {
  if (!request) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-4 h-4 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const DocumentLink = ({ url, label }: { url: string | undefined; label: string }) => {
    if (!url) return null;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(url, '_blank')}
        className="w-full justify-start"
      >
        <FileText className="w-4 h-4 mr-2" />
        {label}
        <ExternalLink className="w-4 h-4 ml-auto" />
      </Button>
    );
  };

  const InfoRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-gray-100">
      <span className="font-medium text-sm text-gray-700">{label}:</span>
      <span className="md:col-span-2 text-sm text-gray-900">{value}</span>
    </div>
  );

  const renderCategoryDetails = (details: CategorySpecificDetails) => {
    if (!details) return null;

    return (
      <Card>
        <CardHeader className='max-[769px]:py-4'>
          <CardTitle className="text-sm flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Category Specific Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-[769px]:pb-3">
          {details.shop && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-blue-700">Shop Documents:</h4>
              <div className="grid grid-cols-1 gap-2">
                <DocumentLink url={details.shop.productCatalogUrl} label="Product Catalog" />
                <DocumentLink url={details.shop.brandCertificateUrl} label="Brand Certificate" />
                <DocumentLink url={details.shop.returnPolicyUrl} label="Return Policy" />
              </div>
            </div>
          )}
          {details.vehicle && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-green-700">Vehicle Documents:</h4>
              <div className="grid grid-cols-1 gap-2">
                <DocumentLink url={details.vehicle.rcDocumentUrl} label="RC Document" />
                <DocumentLink url={details.vehicle.dealershipLicenseUrl} label="Dealership License" />
                <DocumentLink url={details.vehicle.aviationOrMarineLicenseUrl} label="Aviation/Marine License" />
              </div>
            </div>
          )}
          {details.service && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-purple-700">Service Documents:</h4>
              <div className="grid grid-cols-1 gap-2">
                <DocumentLink url={details.service.centerPhotosUrl} label="Service Center Photos" />
                <DocumentLink url={details.service.insuranceProofUrl} label="Insurance Proof" />
                {details.service.certificationUrls?.map((url: string, index: number) => (
                  <DocumentLink key={index} url={url} label={`Certification ${index + 1}`} />
                ))}
              </div>
            </div>
          )}
          {details.simRacing && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-orange-700">Sim Racing Documents:</h4>
              <div className="grid grid-cols-1 gap-2">
                <DocumentLink url={details.simRacing.hardwareProofUrl} label="Hardware Proof" />
                <DocumentLink url={details.simRacing.eventLicenseUrl} label="Event License" />
                {details.simRacing.pastEventMediaUrls?.map((url: string, index: number) => (
                  <DocumentLink key={index} url={url} label={`Event Media ${index + 1}`} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderBranchDetails = (branches: BranchInfo[]) => {
    if (!branches || branches.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Branch Details ({branches.length} {branches.length === 1 ? 'Branch' : 'Branches'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branches.map((branch: BranchInfo, index: number) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Building2 className="w-4 h-4 mt-1 text-gray-500" />
                    <div className="flex-1">
                      <h4 className={`font-medium text-lg ${index > ((request?.current_data?.branches as BranchInfo[])?.length || 0) - 1 ? 'text-sm-red' : ''}`}>{branch.branchName}</h4>
                      <div className="mt-2 space-y-1">
                        <InfoRow label="Address" value={
                          <div>
                            <div>{branch.addressLine1}</div>
                            {branch.addressLine2 && <div>{branch.addressLine2}</div>}
                            <div>{branch.city}, {branch.state} - {branch.postalCode}</div>
                          </div>
                        } />
                        {branch.contactPerson && (
                          <InfoRow label="Contact Person" value={
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {branch.contactPerson}
                            </span>
                          } />
                        )}
                        {branch.contactPhone && (
                          <InfoRow label="Phone" value={
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {branch.contactPhone}
                            </span>
                          } />
                        )}
                        {branch.contactEmail && (
                          <InfoRow label="Email" value={
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {branch.contactEmail}
                            </span>
                          } />
                        )}
                      </div>
                    </div>
                  </div>

                  {branch.branchProofs && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        Branch Documents:
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        <DocumentLink 
                          url={branch.branchProofs.utilityBillUrl} 
                          label="Utility Bill" 
                        />
                        <DocumentLink 
                          url={branch.branchProofs.rentAgreementUrl} 
                          label="Rent Agreement" 
                        />
                        <DocumentLink 
                          url={branch.branchProofs.propertyTaxReceiptUrl} 
                          label="Property Tax Receipt" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRequestChanges = () => {
    const changes = request.requested_changes as Record<string, unknown>;
    
    switch (request.request_type) {
      case 'add_category': {
        const categories = changes.categories as string[] | undefined;
        const categoryDetails = changes.category_specific_details as CategorySpecificDetails | undefined;
        const justification = changes.justification as string | undefined;
        
        return (
          <div className="md:space-y-4 flex flex-col gap-y-2">
            {categories && Array.isArray(categories) && (
              <Card>
                <CardHeader className='max-[769px]:py-4'>
                  <CardTitle className="text-sm">New Categories</CardTitle>
                </CardHeader>
                <CardContent className='max-[769px]:py-3'>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category: string) => {
                      const currentCategories = (request?.current_data?.categories as string[]) || [];
                      return (
                        <Badge key={category} variant="outline" className={`text-sm ${!currentCategories.includes(category) ? 'bg-sm-red text-white' : ''}`}>{category}</Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            {categoryDetails && renderCategoryDetails(categoryDetails)}
            {justification && (
              <Card>
                <CardHeader className='max-[769px]:py-3'>
                  <CardTitle className="text-sm">Justification</CardTitle>
                </CardHeader>
                <CardContent className='max-[769px]:py-3'>
                  <p className="text-sm text-gray-600 leading-relaxed">{justification}</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      }
        
      case 'add_branch': {
        const branches = changes.branches as BranchInfo[] | undefined;
        const justification = changes.justification as string | undefined;
        
        return (
          <div className="space-y-4">
            {branches && Array.isArray(branches) && renderBranchDetails(branches)}
            {justification && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Justification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">{justification}</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      }
        
      case 'update_details': {
        const categoryDetails = changes.category_specific_details as CategorySpecificDetails | undefined;
        const branches = changes.branches as BranchInfo[] | undefined;
        const justification = changes.justification as string | undefined;
        
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Updated Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(changes).map(([key, value]) => {
                    if (key === 'justification' || key === 'category_specific_details' || key === 'branches') return null;
                    
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    if (typeof value === 'string' && (value.includes('http') || value.includes('blob:'))) {
                      return (
                        <div key={key} className="py-2 border-b border-gray-100">
                          <span className="font-medium text-sm text-gray-700">{displayKey}:</span>
                          <div className="mt-1">
                            <DocumentLink url={value} label={displayKey} />
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <InfoRow key={key} label={displayKey} value={String(value)} />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {categoryDetails && renderCategoryDetails(categoryDetails)}
            {branches && Array.isArray(branches) && renderBranchDetails(branches)}
            
            {justification && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Justification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">{justification}</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      }
        
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
                {JSON.stringify(changes, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'add_category':
        return 'Add Categories';
      case 'add_branch':
        return 'Add Branches';
      case 'update_details':
        return 'Update Details';
      default:
        return type.replace('_', ' ');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto py-4 px-2">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Building2 className="w-5 h-5 mr-2" />
            Update Request Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 md:space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader className='max-[769px]:py-4'>
              <CardTitle className="text-base">Request Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <InfoRow label="Request Type" value={getRequestTypeLabel(request.request_type)} />
                <InfoRow label="Status" value={getStatusBadge(request.status)} />
                <InfoRow label="Requested Date" value={new Date(request.created_at).toLocaleDateString()} />
                {request.reviewed_at && (
                  <InfoRow label="Reviewed Date" value={new Date(request.reviewed_at).toLocaleDateString()} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Changes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Requested Changes</h3>
            {renderRequestChanges()}
          </div>

          {/* Rejection Reason */}
          {request.rejection_reason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm text-red-800 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 leading-relaxed">{request.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateRequestDetailsModal;
