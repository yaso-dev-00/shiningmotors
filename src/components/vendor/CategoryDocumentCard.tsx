import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle,
  Shield,
  Camera,
  Award,
  Building,
  Wrench,
  Monitor,
  Car,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';

interface CategoryDocumentCardProps {
  category: string;
  documents: Record<string, string | string[]>;
  isVerified?: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "service":
      return <Wrench className="w-5 h-5" />;
    case "simracing":
      return <Monitor className="w-5 h-5" />;
    case "automotive":
      return <Car className="w-5 h-5" />;
    case "hardware":
      return <Settings className="w-5 h-5" />;
    default:
      return <Building className="w-5 h-5" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "service":
      return "border-l-blue-500 bg-blue-50";
    case "simracing":
      return "border-l-purple-500 bg-purple-50";
    case "automotive":
      return "border-l-green-500 bg-green-50";
    case "hardware":
      return "border-l-orange-500 bg-orange-50";
    default:
      return "border-l-gray-500 bg-gray-50";
  }
};

const getDocumentIcon = (documentType: string) => {
  switch (documentType.toLowerCase()) {
    case "centerphotosurl":
    case "photos":
      return <Camera className="w-4 h-4" />;
    case "insuranceproofurl":
    case "insurance":
      return <Shield className="w-4 h-4" />;
    case "eventlicenseurl":
    case "license":
      return <Award className="w-4 h-4" />;
    case "hardwareproofurl":
    case "hardware":
      return <Settings className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const formatDocumentName = (documentType: string) => {
  return documentType
    .replace(/([A-Z])/g, " $1")
    .replace(/url$/i, "")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const CategoryDocumentCard: React.FC<CategoryDocumentCardProps> = ({
  category,
  documents,
  isVerified = true,
}) => {
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());

  const toggleExpanded = (documentType: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentType)) {
        newSet.delete(documentType);
      } else {
        newSet.add(documentType);
      }
      return newSet;
    });
  };

  const handleDownload = (url: string, filename: string) => {
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const documentEntries = Object.entries(documents);
  const hasDocuments = documentEntries.some(([_, url]) => {
    if (Array.isArray(url)) {
      return url.some(u => u && typeof u === 'string' && u.trim() !== '');
    }
    return url && typeof url === 'string' && url.trim() !== '';
  });

  return (
    <Card
      className={`border-l-4 ${getCategoryColor(
        category
      )} transition-all duration-200 hover:shadow-md`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {getCategoryIcon(category)}
            <span className="capitalize">{category} Documents</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isVerified ? "default" : "destructive"}
              className="text-xs"
            >
              {isVerified ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Pending
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasDocuments ? (
          <div className="text-center py-6 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents uploaded</p>
          </div>
        ) : (
           <div className="space-y-3">
             {documentEntries.map(([documentType, url]) => {
               const isArray = Array.isArray(url);
               const hasUrl = isArray 
                 ? url.some(u => u && typeof u === 'string' && u.trim() !== '')
                 : url && typeof url === 'string' && url.trim() !== '';
               const documentName = formatDocumentName(documentType);
               const urls = isArray ? url : [url];
               const validUrls = urls.filter(u => u && typeof u === 'string' && u.trim() !== '');
               const isExpanded = expandedDocuments.has(documentType);
               const showExpandButton = isArray && validUrls.length > 1;
               
               return (
                 <div 
                   key={documentType}
                   className={`rounded-lg border ${
                     hasUrl 
                       ? 'bg-white border-gray-200 hover:border-gray-300' 
                       : 'bg-gray-100 border-gray-200'
                   } transition-all duration-200`}
                 >
                   {/* Main Document Header */}
                   <div className="flex items-center justify-between p-3">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${
                         hasUrl ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
                       }`}>
                         {getDocumentIcon(documentType)}
                       </div>
                       <div>
                         <p className="font-medium text-sm">{documentName}</p>
                         <p className="text-xs text-gray-500">
                           {hasUrl 
                             ? isArray 
                               ? `${validUrls.length} document${validUrls.length > 1 ? 's' : ''} uploaded`
                               : 'Document uploaded'
                             : 'No document'
                           }
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-1">
                       {hasUrl ? (
                         <>
                           {showExpandButton ? (
                             <div className="flex items-center gap-1">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => toggleExpanded(documentType)}
                                 className="h-8 px-3 text-xs hover:bg-gray-100 transition-colors"
                               >
                                 {isExpanded ? (
                                   <ChevronDown className="w-3 h-3 mr-1" />
                                 ) : (
                                   <ChevronRight className="w-3 h-3 mr-1" />
                                 )}
                                 {isExpanded ? 'Hide' : 'Show'} Details
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => {
                                   validUrls.forEach(url => window.open(url, '_blank'));
                                 }}
                                 className="h-8 px-2 text-xs hover:bg-blue-100 transition-colors"
                                 title="Open all documents"
                               >
                                 <ExternalLink className="w-3 h-3 text-blue-600" />
                               </Button>
                             </div>
                           ) : (
                             <div className="flex items-center gap-1">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleView(validUrls[0])}
                                 className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors"
                                 title="View document"
                               >
                                 <Eye className="w-4 h-4 text-blue-600" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleDownload(validUrls[0], `${category}_${documentName}.pdf`)}
                                 className="h-8 w-8 p-0 hover:bg-green-100 transition-colors"
                                 title="Download document"
                               >
                                 <Download className="w-4 h-4 text-green-600" />
                               </Button>
                             </div>
                           )}
                         </>
                       ) : (
                         <div className="text-gray-400">
                           <XCircle className="w-4 h-4" />
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Expanded Array Documents */}
                   {showExpandButton && isExpanded && (
                     <div className="border-t border-gray-100 bg-gray-50/50">
                       <div className="p-3 space-y-2">
                         <div className="flex items-center justify-between mb-2">
                           <p className="text-xs font-medium text-gray-600">
                             Individual Documents ({validUrls.length})
                           </p>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               validUrls.forEach(url => {
                                 const link = document.createElement('a');
                                 link.href = url;
                                 link.download = `${category}_${documentName}_all.zip`;
                                 link.target = "_blank";
                                 link.click();
                                
                               });
                             }}
                             className="h-6 px-2 text-xs hover:bg-gray-200 transition-colors"
                           >
                             <Download className="w-3 h-3 mr-1" />
                             Download All
                           </Button>
                         </div>
                         <div className="space-y-1">
                           {validUrls.map((validUrl, index) => (
                             <div 
                               key={index}
                               className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors group"
                             >
                               <div className="flex items-center gap-2">
                                 <div className="p-1 rounded bg-blue-50 group-hover:bg-blue-100 transition-colors">
                                   <FileText className="w-3 h-3 text-blue-600" />
                                 </div>
                                 <span className="text-sm text-gray-700 font-medium">
                                   {documentName} {index + 1}
                                 </span>
                                 <span className="text-xs text-gray-400">
                                   ({validUrl.split('/').pop()?.split('?')[0] || 'document'})
                                 </span>
                               </div>
                               <div className="flex items-center gap-1">
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => handleView(validUrl)}
                                   className="h-6 w-6 p-0 hover:bg-blue-100 transition-colors"
                                   title="View document"
                                 >
                                   <Eye className="w-3 h-3 text-blue-600" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => handleDownload(validUrl, `${category}_${documentName}_${index + 1}.pdf`)}
                                   className="h-6 w-6 p-0 hover:bg-green-100 transition-colors"
                                   title="Download document"
                                 >
                                   <Download className="w-3 h-3 text-green-600" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => window.open(validUrl, '_blank')}
                                   className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
                                   title="Open in new tab"
                                 >
                                   <ExternalLink className="w-3 h-3 text-gray-600" />
                                 </Button>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryDocumentCard;
