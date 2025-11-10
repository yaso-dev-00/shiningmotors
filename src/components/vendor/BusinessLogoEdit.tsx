import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit3, 
  Image as ImageIcon
} from 'lucide-react';
import BusinessLogoUploader from './BusinessLogoUploader';

interface BusinessLogoEditProps {
  currentLogoUrl?: string;
  vendorId: string;
  businessName: string;
  onLogoUpdate: (newLogoUrl: string | null) => void;
  isEditable?: boolean;
}

export const BusinessLogoEdit: React.FC<BusinessLogoEditProps> = ({
  currentLogoUrl,
  vendorId,
  businessName,
  onLogoUpdate,
  isEditable = true
}) => {
  return (
    <div className="relative">
      <Card className="w-24 h-24 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-md transition-all duration-200">
        <CardContent className="p-0 h-full flex items-center justify-center">
          {currentLogoUrl ? (
            <div className="relative w-full h-full group">
              <img
                src={currentLogoUrl}
                alt={businessName}
                className="w-full h-full object-cover rounded-lg"
              />
              
              {/* Edit overlay */}
              {isEditable && (
                <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <BusinessLogoUploader
                    currentLogoUrl={currentLogoUrl}
                    vendorId={vendorId}
                    businessName={businessName}
                    onLogoUpdate={onLogoUpdate}
                    isEditable={isEditable}
                  >
                    <div className="bg-white bg-opacity-95 rounded-full p-2 hover:bg-opacity-100 hover:scale-110 transition-all duration-200 shadow-lg">
                      <Edit3 className="w-5 h-5 text-gray-700" />
                    </div>
                  </BusinessLogoUploader>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6 mb-1" />
              {/* <span className="text-xs text-center">No Logo</span> */}
              {isEditable && (
                <BusinessLogoUploader
                  currentLogoUrl={currentLogoUrl}
                  vendorId={vendorId}
                  businessName={businessName}
                  onLogoUpdate={onLogoUpdate}
                  isEditable={isEditable}
                >
                  <div className="mt-2 text-xs text-blue-600 hover:text-blue-800 cursor-pointer font-medium hover:underline transition-all duration-200">
                    Add Logo
                  </div>
                </BusinessLogoUploader>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessLogoEdit;
