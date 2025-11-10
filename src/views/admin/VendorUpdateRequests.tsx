
import React, { useState, useEffect } from 'react';
import { vendorApi, VendorUpdateRequest } from '@/integrations/supabase/modules/vendors';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Eye, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UpdateRequestDetailsModal from '@/components/vendor/UpdateRequestDetailsModal';
import UpdateRequestRejectionModal from '@/components/vendor/UpdateRequestRejectionModal';

const VendorUpdateRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState<any>(null);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await vendorApi.admin.getAllUpdateRequests();
      if (error) throw error;
      setRequests(data || []);
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

  const handleApprove = async (request: any) => {
    try {
      await vendorApi.admin.approveUpdateRequest(
        request.id, 
        request.vendor_registration_id, 
        request.requested_changes
      );
      toast({
        title: "Request Approved",
        description: "Update request has been approved successfully"
      });
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    }
  };

  const handleRejectClick = (request: any) => {
    setRequestToReject(request);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!requestToReject) return;

    setRejecting(true);
    try {
      await vendorApi.admin.rejectUpdateRequest(requestToReject.id, reason);
      toast({
        title: "Request Rejected",
        description: "Update request has been rejected"
      });
      setShowRejectModal(false);
      setRequestToReject(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
    } finally {
      setRejecting(false);
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
      <AdminLayout title="Vendor Update Requests" backLink="/admin">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Vendor Update Requests" backLink="/admin">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Update Requests ({requests.filter(r => r.status === 'pending').length} pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No update requests found</h3>
                <p className="text-gray-600">There are no vendor update requests to review.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.vendor_registration?.business_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{getRequestTypeLabel(request.request_type)}</TableCell>
                      <TableCell>
                        {request.requester?.full_name || request.requester?.username || 'Unknown'}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(request)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectClick(request)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Request Details Modal */}
        <UpdateRequestDetailsModal
          request={selectedRequest}
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />

        {/* Rejection Modal */}
        <UpdateRequestRejectionModal
          open={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRequestToReject(null);
          }}
          onConfirm={handleRejectConfirm}
          loading={rejecting}
        />
      </div>
    </AdminLayout>
  );
};

export default VendorUpdateRequests;
