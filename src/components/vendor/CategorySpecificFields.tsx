
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { CategorySpecificDetails } from '@/integrations/supabase/modules/vendors';

interface CategorySpecificFieldsProps {
  categories: string[];
  categoryDetails: CategorySpecificDetails;
  onChange: (details: CategorySpecificDetails) => void;
  errors?:string[]
}

const CategorySpecificFields: React.FC<CategorySpecificFieldsProps> = ({
  categories,
  categoryDetails,
  onChange,
  errors
}) => {

  const updateCategoryDetail = (category: string, field: string, value: string | string[]) => {
    onChange({
      ...categoryDetails,
      [category]: {
        ...categoryDetails[category as keyof CategorySpecificDetails],
        [field]: value
      }
    });
  };

  const addArrayItem = (category: string, field: string) => {
    const currentArray = (categoryDetails[category as keyof CategorySpecificDetails] as any)?.[field] || [];
    updateCategoryDetail(category, field, [...currentArray, '']);
  };

  const updateArrayItem = (category: string, field: string, index: number, value: string) => {
    const currentArray = (categoryDetails[category as keyof CategorySpecificDetails] as any)?.[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateCategoryDetail(category, field, newArray);
  };

  const removeArrayItem = (category: string, field: string, index: number) => {
    const currentArray = (categoryDetails[category as keyof CategorySpecificDetails] as any)?.[field] || [];
    const newArray = currentArray.filter((_item: unknown, i: number) => i !== index);
    updateCategoryDetail(category, field, newArray);
  };

  return (
    <div className="space-y-6">
      {categories.includes('Shop') && (
        <>
        <Card className={errors?.includes('shop') ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              Shop Category Details
              <span className="text-red-500 ml-2">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="productCatalogUrl" className="flex items-center">
                Product Catalog URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="productCatalogUrl"
                type="url"
                value={categoryDetails.shop?.productCatalogUrl || ''}
                onChange={(e) => updateCategoryDetail('shop', 'productCatalogUrl', e.target.value)}
                placeholder="https://example.com/catalog"
                className={errors?.includes('shop') && (!categoryDetails.shop?.productCatalogUrl || categoryDetails.shop.productCatalogUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('shop') && (!categoryDetails.shop?.productCatalogUrl || categoryDetails.shop.productCatalogUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Product catalog URL is required</p>
              )}
            </div>
            <div>
              <Label htmlFor="brandCertificateUrl" className="flex items-center">
                Brand Certificate URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="brandCertificateUrl"
                type="url"
                value={categoryDetails.shop?.brandCertificateUrl || ''}
                onChange={(e) => updateCategoryDetail('shop', 'brandCertificateUrl', e.target.value)}
                placeholder="https://example.com/certificate"
                className={errors?.includes('shop') && (!categoryDetails.shop?.brandCertificateUrl || categoryDetails.shop.brandCertificateUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('shop') && (!categoryDetails.shop?.brandCertificateUrl || categoryDetails.shop.brandCertificateUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Brand certificate URL is required</p>
              )}
            </div>
            <div>
              <Label htmlFor="returnPolicyUrl" className="flex items-center">
                Return Policy URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="returnPolicyUrl"
                type="url"
                value={categoryDetails.shop?.returnPolicyUrl || ''}
                onChange={(e) => updateCategoryDetail('shop', 'returnPolicyUrl', e.target.value)}
                placeholder="https://example.com/returns"
                className={errors?.includes('shop') && (!categoryDetails.shop?.returnPolicyUrl || categoryDetails.shop.returnPolicyUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('shop') && (!categoryDetails.shop?.returnPolicyUrl || categoryDetails.shop.returnPolicyUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Return policy URL is required</p>
              )}
            </div>
          </CardContent>
        </Card>
         {errors && errors.includes('shop') && (
           <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
             <p className="text-red-700 text-sm font-medium">
               ⚠️ Please complete all required fields for Shop category
             </p>
             <ul className="text-red-600 text-sm mt-1 ml-4 list-disc">
               <li>Product Catalog URL</li>
               <li>Brand Certificate URL</li>
               <li>Return Policy URL</li>
             </ul>
           </div>
         )}
        </>
      )}

      {categories.includes('Vehicle') && (
        <>
        <Card className={errors?.includes('vehicle') ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              Vehicle Category Details
              <span className="text-red-500 ml-2">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rcDocumentUrl" className="flex items-center">
                RC Document URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="rcDocumentUrl"
                type="url"
                value={categoryDetails.vehicle?.rcDocumentUrl || ''}
                onChange={(e) => updateCategoryDetail('vehicle', 'rcDocumentUrl', e.target.value)}
                placeholder="https://example.com/rc-document"
                className={errors?.includes('vehicle') && (!categoryDetails.vehicle?.rcDocumentUrl || categoryDetails.vehicle.rcDocumentUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('vehicle') && (!categoryDetails.vehicle?.rcDocumentUrl || categoryDetails.vehicle.rcDocumentUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">RC document URL is required</p>
              )}
            </div>
            <div>
              <Label htmlFor="dealershipLicenseUrl" className="flex items-center">
                Dealership License URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="dealershipLicenseUrl"
                type="url"
                value={categoryDetails.vehicle?.dealershipLicenseUrl || ''}
                onChange={(e) => updateCategoryDetail('vehicle', 'dealershipLicenseUrl', e.target.value)}
                placeholder="https://example.com/dealership-license"
                className={errors?.includes('vehicle') && (!categoryDetails.vehicle?.dealershipLicenseUrl || categoryDetails.vehicle.dealershipLicenseUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('vehicle') && (!categoryDetails.vehicle?.dealershipLicenseUrl || categoryDetails.vehicle.dealershipLicenseUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Dealership license URL is required</p>
              )}
            </div>
            <div>
              <Label htmlFor="aviationOrMarineLicenseUrl" className="flex items-center">
                Aviation/Marine License URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="aviationOrMarineLicenseUrl"
                type="url"
                value={categoryDetails.vehicle?.aviationOrMarineLicenseUrl || ''}
                onChange={(e) => updateCategoryDetail('vehicle', 'aviationOrMarineLicenseUrl', e.target.value)}
                placeholder="https://example.com/aviation-marine-license"
                className={errors?.includes('vehicle') && (!categoryDetails.vehicle?.aviationOrMarineLicenseUrl || categoryDetails.vehicle.aviationOrMarineLicenseUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('vehicle') && (!categoryDetails.vehicle?.aviationOrMarineLicenseUrl || categoryDetails.vehicle.aviationOrMarineLicenseUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Aviation/Marine license URL is required</p>
              )}
            </div>
          </CardContent>
        </Card>
          {errors && errors.includes('vehicle') && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Please complete all required fields for Vehicle category
              </p>
              <ul className="text-red-600 text-sm mt-1 ml-4 list-disc">
                <li>RC Document URL</li>
                <li>Dealership License URL</li>
                <li>Aviation/Marine License URL</li>
              </ul>
            </div>
          )}
      </>
      )}

      {categories.includes('Service') && (
        <>
        <Card className={errors?.includes('service') ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              Service Category Details
              <span className="text-red-500 ml-2">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="centerPhotosUrl" className="flex items-center">
                Service Center Photos URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="centerPhotosUrl"
                type="url"
                value={categoryDetails.service?.centerPhotosUrl || ''}
                onChange={(e) => updateCategoryDetail('service', 'centerPhotosUrl', e.target.value)}
                placeholder="https://example.com/center-photos"
                className={errors?.includes('service') && (!categoryDetails.service?.centerPhotosUrl || categoryDetails.service.centerPhotosUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('service') && (!categoryDetails.service?.centerPhotosUrl || categoryDetails.service.centerPhotosUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Service center photos URL is required</p>
              )}
            </div>
            <div>
              <Label className="flex items-center">
                Certification URLs
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <p className="text-sm text-gray-600 mb-2">At least one certification URL is required</p>
              {(categoryDetails.service?.certificationUrls || []).map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => updateArrayItem('service', 'certificationUrls', index, e.target.value)}
                    placeholder="https://example.com/certification"
                    className={errors?.includes('service') && (!url || url.trim() === '' || !url.startsWith('http')) ? 'border-red-500' : ''}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('service', 'certificationUrls', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('service', 'certificationUrls')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification URL
              </Button>
              {errors?.includes('service') && (!categoryDetails.service?.certificationUrls || categoryDetails.service.certificationUrls.length === 0) && (
                <p className="text-red-500 text-sm mt-1">At least one certification URL is required</p>
              )}
            </div>
            <div>
              <Label htmlFor="insuranceProofUrl" className="flex items-center">
                Insurance Proof URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="insuranceProofUrl"
                type="url"
                value={categoryDetails.service?.insuranceProofUrl || ''}
                onChange={(e) => updateCategoryDetail('service', 'insuranceProofUrl', e.target.value)}
                placeholder="https://example.com/insurance-proof"
                className={errors?.includes('service') && (!categoryDetails.service?.insuranceProofUrl || categoryDetails.service.insuranceProofUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('service') && (!categoryDetails.service?.insuranceProofUrl || categoryDetails.service.insuranceProofUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Insurance proof URL is required</p>
              )}
            </div>
          </CardContent>
        </Card>
         {errors && errors.includes('service') && (
           <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
             <p className="text-red-700 text-sm font-medium">
               ⚠️ Please complete all required fields for Service category
             </p>
             <ul className="text-red-600 text-sm mt-1 ml-4 list-disc">
               <li>Service Center Photos URL</li>
               <li>At least one Certification URL</li>
               <li>Insurance Proof URL</li>
             </ul>
           </div>
         )}
        </>
      )}

      {categories.includes('SimRacing') && (
        <>
            <Card className={errors?.includes('simracing') ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              Sim Racing Category Details
              <span className="text-red-500 ml-2">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hardwareProofUrl" className="flex items-center">
                Hardware Proof URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="hardwareProofUrl"
                type="url"
                value={categoryDetails.simRacing?.hardwareProofUrl || ''}
                onChange={(e) => updateCategoryDetail('simRacing', 'hardwareProofUrl', e.target.value)}
                placeholder="https://example.com/hardware-proof"
                className={errors?.includes('simracing') && (!categoryDetails.simRacing?.hardwareProofUrl || categoryDetails.simRacing.hardwareProofUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('simracing') && (!categoryDetails.simRacing?.hardwareProofUrl || categoryDetails.simRacing.hardwareProofUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Hardware proof URL is required</p>
              )}
            </div>
            <div>
              <Label htmlFor="eventLicenseUrl" className="flex items-center">
                Event License URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="eventLicenseUrl"
                type="url"
                value={categoryDetails.simRacing?.eventLicenseUrl || ''}
                onChange={(e) => updateCategoryDetail('simRacing', 'eventLicenseUrl', e.target.value)}
                placeholder="https://example.com/event-license"
                className={errors?.includes('simracing') && (!categoryDetails.simRacing?.eventLicenseUrl || categoryDetails.simRacing.eventLicenseUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('simracing') && (!categoryDetails.simRacing?.eventLicenseUrl || categoryDetails.simRacing.eventLicenseUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Event license URL is required</p>
              )}
            </div>
            <div>
              <Label>Past Event Media URLs</Label>
              {(categoryDetails.simRacing?.pastEventMediaUrls || []).map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => updateArrayItem('simRacing', 'pastEventMediaUrls', index, e.target.value)}
                    placeholder="https://example.com/event-media"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('simRacing', 'pastEventMediaUrls', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('simRacing', 'pastEventMediaUrls')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event Media URL
              </Button>
            </div>
          </CardContent>
        </Card>
          {errors && errors.includes('simracing') && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Please complete all required fields for Sim Racing category
              </p>
              <ul className="text-red-600 text-sm mt-1 ml-4 list-disc">
                <li>Hardware Proof URL</li>
                <li>Event License URL</li>
              </ul>
            </div>
          )}
   
        </>
      )}
         {categories.includes('Event') && (
        <>
          <Card className={errors?.includes('event') ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              Event Category Details
              <span className="text-red-500 ml-2">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
         
            <div>
              <Label htmlFor="eventLicenseUrl" className="flex items-center">
                Event License URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="eventLicenseUrl"
                type="url"
                value={categoryDetails.events?.eventLicenseUrl || ''}
                onChange={(e) => updateCategoryDetail('events', 'eventLicenseUrl', e.target.value)}
                placeholder="https://example.com/event-license"
                className={errors?.includes('event') && (!categoryDetails.events?.eventLicenseUrl || categoryDetails.events.eventLicenseUrl.trim() === '') ? 'border-red-500' : ''}
                required
              />
              {errors?.includes('event') && (!categoryDetails.events?.eventLicenseUrl || categoryDetails.events.eventLicenseUrl.trim() === '') && (
                <p className="text-red-500 text-sm mt-1">Event license URL is required</p>
              )}
            </div>
            <div>
              <Label>Past Event Media URLs</Label>
              {(categoryDetails.events?.pastEventMediaUrls || []).map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => updateArrayItem('events', 'pastEventMediaUrls', index, e.target.value)}
                    placeholder="https://example.com/event-media"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('events', 'pastEventMediaUrls', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('events', 'pastEventMediaUrls')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event Media URL
              </Button>
            </div>
          </CardContent>
        </Card>
          {errors && errors.includes('event') && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Please complete all required fields for Event category
              </p>
              <ul className="text-red-600 text-sm mt-1 ml-4 list-disc">
                <li>Event License URL</li>
              </ul>
            </div>
          )}
   
        </>
      )}
    </div>
  );
};

export default CategorySpecificFields;
