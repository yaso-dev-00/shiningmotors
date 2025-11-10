
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { vendorApi, VendorUpdateRequest } from '@/integrations/supabase/modules/vendors';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UpdateRequestDetailsModal from './UpdateRequestDetailsModal';

interface VendorUpdateRequestsListProps {
  vendorRegistrationId: string;
}

const VendorUpdateRequestsList: React.FC<VendorUpdateRequestsListProps> = ({ vendorRegistrationId }) => {
  const [requests, setRequests] = useState<VendorUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VendorUpdateRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [vendorRegistrationId]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await vendorApi.getUpdateRequests(vendorRegistrationId);
      if (error) throw error;
      // Type assertion needed because API returns string for request_type but interface expects union
      setRequests((data || []) as VendorUpdateRequest[]);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      toast({
        title: "Error",
        description: "Failed to load update requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'add_category':
        return 'Add Categories';
      case 'add_branch':
        return 'Add Branches';
      case 'update_details':
        return 'Update Details';
      default:
        return type;
    }
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Update Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No update requests</p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{getRequestTypeLabel(request.request_type)}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.reviewed_at && (
                      <p className="text-sm text-gray-500">
                        Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                    {request.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Rejection Reason:</strong> {request.rejection_reason}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UpdateRequestDetailsModal
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </>
  );
};

export default VendorUpdateRequestsList;
