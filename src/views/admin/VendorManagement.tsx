"use client";
import React, { useState } from "react";
import {
  sendVendorEmail,
  vendorApi,
} from "@/integrations/supabase/modules/vendors";
import AdminLayout from "@/components/admin/AdminLayout";
import VendorDataView from "@/components/admin/VendorDataView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Database, X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UpdateRequestDetailsModal from "@/components/vendor/UpdateRequestDetailsModal";
import UpdateRequestRejectionModal from "@/components/vendor/UpdateRequestRejectionModal";
import { DocumentCard } from "@/components/vendor/EnhancedVendorProfile";
import { Label } from "@/components/ui/label";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const VendorManagement = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRejectRequestModal, setShowRejectRequestModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("vendors");
  const [emailLoading, setEmailLoading] = useState<string | null>(null);
  const [showVendorData, setShowVendorData] = useState<any>(null);

  const { data: vendorsData, isLoading: loading, refetch } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Add timestamp to prevent browser caching
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/vendors?_t=${timestamp}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch vendors');
      }

      const result = await response.json();
      return {
        vendors: result.data?.vendors || [],
        updateRequests: result.data?.updateRequests || [],
      };
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const vendors = vendorsData?.vendors || [];
  const updateRequests = vendorsData?.updateRequests || [];

  const handleApproveStepOne = async (vendor: any, vendorId: string) => {
    try {
      await vendorApi.admin.approveStepOne(vendorId);
      toast({
        title: "Step 1 Approved",
        description: "Vendor can now proceed to Step 2",
      });
      const requestData = vendor;
      await sendVendorEmail(
        requestData.email,
        requestData.personal_name,
        "registration",
        "step approval",
        "registration"
      );

      refetch();
    } catch (error) {
      console.error("Error approving Step 1:", error);
      toast({
        title: "Error",
        description: "Failed to approve Step 1",
        variant: "destructive",
      });
    }
    setSelectedVendor(null);
  };

  const handleRejectStepOne = async (vendorId: string, reason: string) => {
    try {
      await vendorApi.admin.rejectStepOne(vendorId, reason);
      toast({
        title: "Step 1 Rejected",
        description: "Vendor has been notified",
      });
      const requestData = vendors.find((item: any) => item.user_id == vendorId);
      await sendVendorEmail(
        requestData.email,
        requestData.personal_name,
        "registration",
        "step rejection",
        "registration",
        reason
      );

      refetch();
    } catch (error) {
      console.error("Error rejecting Step 1:", error);
      toast({
        title: "Error",
        description: "Failed to reject Step 1",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (vendor: any) => {
    try {
      await vendorApi.admin.approve(vendor.id);
      toast({
        title: "Vendor Approved",
        description: "Vendor registration has been approved successfully",
      });

      const requestData = vendor;
      console.log(requestData);
      await sendVendorEmail(
        requestData.email,
        requestData.personal_name,
        requestData.business_name,
        "vendor approval",
        "registration"
      );
      refetch();
    } catch (error) {
      console.error("Error approving vendor:", error);
      toast({
        title: "Error",
        description: "Failed to approve vendor",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedVendor || !rejectionReason.trim()) return;
    console.log(getCurrentStep(selectedVendor), selectedVendor);
    try {
      if (getCurrentStep(selectedVendor) === 1) {
        await handleRejectStepOne(selectedVendor.id, rejectionReason);
      } else {
        await vendorApi.admin.reject(selectedVendor.id, rejectionReason);
      }

      toast({
        title: "Vendor Rejected",
        description: "Vendor registration has been rejected",
      });

      const requestData = selectedVendor;
      console.log(requestData);
      if (requestData) {
        try {
          await sendVendorEmail(
            requestData.email,
            requestData.personal_name,
            requestData.business_name || "registration",
            "step rejection",
            "registration",
            rejectionReason
          );
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError);
        }
      }
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedVendor(null);
      refetch();
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      toast({
        title: "Error",
        description: "Failed to reject vendor",
        variant: "destructive",
      });
    }
  };

  const handleApproveUpdateRequest = async (
    requestId: string,
    vendorRegistrationId: string,
    requestedChanges: any
  ) => {
    setEmailLoading(requestId);
    try {
      await vendorApi.admin.approveUpdateRequest(
        requestId,
        vendorRegistrationId,
        requestedChanges
      );
      toast({
        title: "Request Approved",
        description: "Update request has been approved successfully",
      });
      refetch();
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(null);
    }
  };

  const handleRejectUpdateRequest = async (reason: string) => {
    if (!selectedRequest) return;

    setEmailLoading(selectedRequest.id);
    try {
      await vendorApi.admin.rejectUpdateRequest(selectedRequest.id, reason);
      toast({
        title: "Request Rejected",
        description: "Update request has been rejected",
      });
      setShowRejectRequestModal(false);
      setSelectedRequest(null);
      refetch();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(null);
    }
  };

  const getStatusBadge = (vendor: any) => {
    if (!vendor) return null;

    if (vendor.rejection_reason) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-4 h-4 mr-1" />
          Rejected
        </Badge>
      );
    }

    const currentStep = getCurrentStep(vendor);

    if (currentStep === 1) {
      if (vendor.status === "submitted") {
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Step 1 Pending
          </Badge>
        );
      }
      if (
        vendor.status === "approved" ||
        vendor.is_verified_by_admin === true
      ) {
        return (
          <Badge variant="default" className="bg-blue-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Step 1 Approved
          </Badge>
        );
      }
    }

    if (currentStep === 2) {
      if (vendor.status === "under_review" || vendor.status === "submitted") {
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Step 2 Pending
          </Badge>
        );
      }
      if (
        vendor.status === "approved" &&
        vendor.is_verified_by_admin === true
      ) {
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Fully Approved
          </Badge>
        );
      }
    }

    return (
      <Badge variant="secondary">
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </Badge>
    );
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canApproveStepOne = (vendor: any) => {
    if (!vendor) return false;
    return (
      getCurrentStep(vendor) === 1 &&
      vendor.status === "submitted" &&
      !vendor.rejection_reason
    );
  };

  const canApproveStepTwo = (vendor: any) => {
    if (!vendor) return false;
    return (
      getCurrentStep(vendor) === 2 &&
      (vendor.status === "under_review" || vendor.status === "submitted") &&
      !vendor.is_verified_by_admin &&
      !vendor.rejection_reason
    );
  };

  const getCurrentStep = (vendor: any) => {
    if (!vendor) return 1;

    // Use the step field from database, fallback to data analysis
    if (vendor.step) {
      return parseInt(vendor.step);
    }

    // Legacy fallback: If business_name is not provided, it's Step 1
    if (!vendor.business_name || vendor.business_name.trim() === "") {
      return 1;
    }

    // If business_name is provided, it's Step 2
    return 2;
  };

  const filteredVendors = vendors.filter((vendor: any) => {
    if (!vendor) return false;
    
    // If search query is empty, show all vendors
    if (!searchQuery.trim()) return true;
    
    const businessName = vendor.business_name || "";
    const personalName = vendor.personal_name || "";
    const email = vendor.email || "";
    const mobile = vendor.mobile || "";
    const categories = vendor.categories || [];

    const searchTerm = searchQuery.toLowerCase().trim();
    return (
      businessName.toLowerCase().includes(searchTerm) ||
      personalName.toLowerCase().includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm) ||
      mobile.toLowerCase().includes(searchTerm) ||
      categories.some((category: string) => 
        category.toLowerCase().includes(searchTerm)
      )
    );
  });
  console.log(updateRequests);
  const filteredRequests = updateRequests.filter((request: any) => {
    if (!request || !request.vendor_registration) return false;
    
    // If search query is empty, show all requests
    if (!searchQuery.trim()) return true;
    
    const businessName = request.vendor_registration.business_name || "";
    const personalName = request.vendor_registration.personal_name || "";
    const email = request.vendor_registration.email || "";
    const requestType = request.request_type || "";

    const searchTerm = searchQuery.toLowerCase().trim();
    return (
      businessName.toLowerCase().includes(searchTerm) ||
      personalName.toLowerCase().includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm) ||
      requestType.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <AdminLayout title="Vendor Management" backLink="/admin">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Show vendor data view if selected
  if (showVendorData) {
    return (
      <AdminLayout title="Vendor Data" backLink="/admin/vendor-management">
        <VendorDataView
          vendorId={showVendorData.user_id}
          vendorName={
            showVendorData.business_name || showVendorData.personal_name
          }
        />
      </AdminLayout>
    );
  }

  const getCategorySpecificDocument = (name: string) => {
    let category = name.toLowerCase();
    if (category == "simracing") {
      category = "simRacing";
    }

    const documents = selectedVendor.category_specific_details[category]
      ? Object.keys(selectedVendor.category_specific_details[category])
      : [];

    if (documents.length == 0) {
      return;
    }

    return (
      <>
        {documents.map((item) => {
          return (
            <div key={item}>
              <DocumentCard
                isVerified={false}
                title={item}
                url={selectedVendor.category_specific_details[category][item]}
                description="Valid government-issued identification document"
              />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <AdminLayout title="Vendor Management" backLink="/admin">
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search vendors by name, email, mobile, or category..."
              className="pl-10 pr-10 w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 p-0 -translate-y-1/2 hover:bg-gray-100"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="vendors">
              Vendor Registrations ({filteredVendors.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Update Requests (
              {filteredRequests.filter((r: any) => r && r.status === "pending").length}
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Vendor Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredVendors.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No vendors found matching your search' : 'No vendor registrations found'}
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? `No vendors match "${searchQuery}". Try a different search term.`
                        : 'There are no vendor registrations to review.'
                      }
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Step</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendors.map((vendor: any) => (
                        <TableRow key={vendor?.id || "unknown"}>
                          <TableCell className="font-medium">
                            {vendor?.business_name ||
                              vendor?.personal_name ||
                              "N/A"}
                          </TableCell>
                          <TableCell>{vendor?.email || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {vendor?.categories
                                ?.slice(0, 2)
                                .map((category: string) => (
                                  <Badge
                                    key={category}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {category}
                                  </Badge>
                                )) || []}
                              {vendor?.categories?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{vendor.categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(vendor)}</TableCell>
                          <TableCell>{getCurrentStep(vendor)}</TableCell>
                          <TableCell>
                            {vendor?.created_at
                              ? new Date(vendor.created_at).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVendor(vendor)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Only show data button for approved vendors */}
                              {vendor.is_verified_by_admin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowVendorData(vendor)}
                                  className="bg-blue-50 hover:bg-blue-100"
                                >
                                  <Database className="w-4 h-4" />
                                </Button>
                              )}

                              {canApproveStepOne(vendor) && (
                                <>
                                  {/* <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>{ handleApproveStepOne(vendor,vendor.id)}
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button> */}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVendor(vendor);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {canApproveStepTwo(vendor) && (
                                <>
                                  {/* <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApprove(vendor)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button> */}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVendor(vendor);
                                      setShowRejectDialog(true);
                                    }}
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
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader className="max-[769px]:py-3">
                <CardTitle className="flex items-center max-[769px]:p-0">
                  <FileText className="w-5 h-5 mr-2" />
                  Update Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 max-[769px]:px-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No update requests found matching your search' : 'No update requests found'}
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? `No requests match "${searchQuery}". Try a different search term.`
                        : 'There are no update requests to review.'
                      }
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-4">
                    {filteredRequests.map((request: any) => (
                      <div
                        key={request?.id || "unknown"}
                        className="border rounded-lg p-2 md:p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">
                                {request?.vendor_registration?.business_name ||
                                  request?.vendor_registration?.personal_name ||
                                  "N/A"}
                              </h3>
                              {getRequestStatusBadge(
                                request?.status || "unknown"
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Request Type:{" "}
                              <span className="font-medium">
                                {request?.request_type
                                  ? request.request_type.replace("_", " ")
                                  : "N/A"}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              Requested by:{" "}
                              {request?.requester?.full_name ||
                                request?.requester?.username ||
                                "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Date:{" "}
                              {request?.created_at
                                ? new Date(
                                    request.created_at
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                            {request?.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                <strong>Rejection Reason:</strong>{" "}
                                {request.rejection_reason}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <div className="flex flex-col md:flex-row gap-2">
                              {request?.status === "pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                      handleApproveUpdateRequest(
                                        request.id,
                                        request.vendor_registration_id,
                                        request.requested_changes
                                      )
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={emailLoading === request.id}
                                  >
                                    {emailLoading === request.id
                                      ? "Processing..."
                                      : "Approve"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowRejectRequestModal(true);
                                    }}
                                    disabled={emailLoading === request.id}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Vendor Details Modal */}
        <Dialog
          open={!!selectedVendor && !showRejectDialog}
          onOpenChange={() => setSelectedVendor(null)}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] md:max-h-[100vh] overflow-y-auto p-3 py-5">
            <DialogHeader>
              <DialogTitle>
                Vendor Registration Details - Step{" "}
                {getCurrentStep(selectedVendor)}
              </DialogTitle>
              <DialogDescription>
                Review all vendor registration information and documents
              </DialogDescription>
            </DialogHeader>

            {selectedVendor && (
              <div className="space-y-4 md:space-y-6">
                {/* Personal Information (Always shown) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <User className="w-5 h-5 mr-2" />
                      Personal Information (Step 1)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                    <div>
                      <h4 className="font-semibold">Full Name</h4>
                      <p className="text-gray-600">
                        {selectedVendor.personal_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Email</h4>
                      <p className="text-gray-600">
                        {selectedVendor.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Mobile</h4>
                      <p className="text-gray-600">
                        {selectedVendor.mobile || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">WhatsApp</h4>
                      <p className="text-gray-600">
                        {selectedVendor.whatsapp_number || "Not provided"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <h4 className="font-semibold">Categories</h4>
                      <div className="flex flex-wrap flex-col gap-2 mt-3 md:mt-5">
                        {selectedVendor.categories?.map((category: string) => (
                          <>
                            <Badge
                              key={category}
                              className="text-[18px] w-max text-sm-red"
                              variant="outline"
                            >
                              {category}
                            </Badge>
                            {selectedVendor && (
                              <Card>
                                <CardHeader className="max-[769px]:py-4">
                                  <CardTitle className="flex items-center text-lg">
                                    <FileText className="w-5 h-5 mr-2" />
                                    Documents
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                  {getCategorySpecificDocument(category)}
                                </CardContent>
                              </Card>
                            )}
                          </>
                        )) || (
                          <span className="text-gray-500">No categories</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Information (Step 2 - if available) */}
                {selectedVendor?.business_name && (
                  <Card className="space-y-2">
                    <CardHeader className="max-[769px]:py-4">
                      <CardTitle className="flex items-center text-lg">
                        <Building className="w-5 h-5 mr-2" />
                        Business Information (Step 2)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                      <div>
                        <h4 className="font-semibold">Business Name</h4>
                        <p className="text-gray-600">
                          {selectedVendor.business_name}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Business Logo</h4>
                        {selectedVendor.business_logo_url ? (
                          <a
                            href={selectedVendor.business_logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Logo
                          </a>
                        ) : (
                          <p className="text-gray-400">Not provided</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">Account Holder Name</h4>
                        <p className="text-gray-600">
                          {selectedVendor.account_holder_name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Bank Account Number</h4>
                        <p className="text-gray-600">
                          {selectedVendor.bank_account_number || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold">IFSC Code</h4>
                        <p className="text-gray-600">
                          {selectedVendor.ifsc_code || "Not provided"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Documents */}
                {selectedVendor?.business_name && (
                  <Card>
                    <CardHeader className="max-[769px]:py-4">
                      <CardTitle className="flex items-center text-lg">
                        <FileText className="w-5 h-5 mr-2" />
                        Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                      {selectedVendor.gst_certificate_url && (
                        <div>
                          <h4 className="font-semibold">GST Certificate</h4>
                          <a
                            href={selectedVendor.gst_certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Certificate
                          </a>
                        </div>
                      )}
                      {selectedVendor.trade_license_url && (
                        <div>
                          <h4 className="font-semibold">Trade License</h4>
                          <a
                            href={selectedVendor.trade_license_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View License
                          </a>
                        </div>
                      )}
                      {selectedVendor.bank_proof_document_url && (
                        <div>
                          <h4 className="font-semibold">Bank Proof</h4>
                          <a
                            href={selectedVendor.bank_proof_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {selectedVendor?.business_name &&
                  selectedVendor.branches &&
                  Array.isArray(selectedVendor.branches) &&
                  selectedVendor.branches.length > 0 && (
                    <Card>
                      <CardHeader className="max-[769px]:py-4">
                        <CardTitle className="flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          Branch Locations ({selectedVendor.branches.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 md:space-y-6">
                          {selectedVendor.branches.map(
                            (branch: any, index: number) => (
                              <Card
                                key={index}
                                className="border-l-4 border-l-green-500"
                              >
                                <CardHeader className="max-[769px]:py-3 md:pb-3">
                                  <CardTitle className="text-lg flex items-center">
                                    <Building className="w-5 h-5 mr-2" />
                                    {branch.branchName || `Branch ${index + 1}`}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-500">
                                        Address
                                      </Label>
                                      <div className="mt-1 text-sm text-gray-900">
                                        <p>{branch.addressLine1}</p>
                                        {branch.addressLine2 && (
                                          <p>{branch.addressLine2}</p>
                                        )}
                                        <p>
                                          {branch.city}, {branch.state} -{" "}
                                          {branch.postalCode}
                                        </p>
                                      </div>
                                    </div>

                                    {branch.contactPerson && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">
                                          Contact Person
                                        </Label>
                                        <div className="mt-1 space-y-1">
                                          <p className="text-sm text-gray-900">
                                            {branch.contactPerson}
                                          </p>
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
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  {canApproveStepOne(selectedVendor) && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectDialog(true);
                        }}
                      >
                        Reject Step 1
                      </Button>
                      <Button
                        onClick={() => {
                          handleApproveStepOne(
                            selectedVendor,
                            selectedVendor.id
                          );
                          setSelectedVendor(null);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve Step 1
                      </Button>
                    </>
                  )}
                  {canApproveStepTwo(selectedVendor) && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectDialog(true);
                        }}
                      >
                        Reject Step 2
                      </Button>
                      <Button
                        onClick={() => {
                          handleApprove(selectedVendor);
                          setSelectedVendor(null);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve Step 2
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Request Details Modal */}
        <UpdateRequestDetailsModal
          request={selectedRequest}
          open={!!selectedRequest && !showRejectRequestModal}
          onClose={() => setSelectedRequest(null)}
        />

        {/* Update Request Rejection Modal */}
        <UpdateRequestRejectionModal
          open={showRejectRequestModal}
          onClose={() => {
            setShowRejectRequestModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleRejectUpdateRequest}
          loading={!!emailLoading}
        />

        {/* Reject Dialog */}
        <Dialog
          open={showRejectDialog}
          onOpenChange={() => {
            setShowRejectDialog(false);
            setSelectedVendor(null);
          }}
        >
          <DialogContent className="p-2">
            <DialogHeader>
              <DialogTitle>Reject Vendor Registration</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this vendor registration.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 md:space-y-4">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Registration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default VendorManagement;
