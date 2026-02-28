"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { VendorRegistration } from '@/integrations/supabase/modules/vendors';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Plus, Building, FileText, Eye, Edit, Settings, BarChart3, ArrowRight} from 'lucide-react';
import VendorUpdateRequestForm from '@/components/vendor/VendorUpdateRequestForm';
import VendorBasicDetailsEdit from '@/components/vendor/VendorBasicDetailsEdit';
import EnhancedVendorProfile from '@/components/vendor/EnhancedVendorProfile';
import CategoryManagement from '@/components/vendor/CategoryManagement';
import NextLink from 'next/link';
import Layout from '@/components/Layout';

const VendorDashboard = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [vendorRegistration, setVendorRegistration] = useState<VendorRegistration | null>(null);
  const [updateRequests, setUpdateRequests] = useState<{ id: string; request_type: string; status: string; created_at: string; rejection_reason?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendorData = useCallback(async () => {
    if (!user) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/registration?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setVendorRegistration(null);
          setUpdateRequests([]);
          return;
        }
        throw new Error(body?.error || "Failed to fetch registration");
      }
      const body = await res.json();
      const payload = body?.data ?? {};
      setVendorRegistration((payload.registration ?? null) as VendorRegistration | null);
      setUpdateRequests(Array.isArray(payload.updateRequests) ? (payload.updateRequests as { id: string; request_type: string; status: string; created_at: string; rejection_reason?: string | null }[]) : []);
    } catch (err) {
      console.error("Error fetching vendor data:", err);
      toast({ title: "Error", description: "Failed to load vendor data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, session?.access_token, toast]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchVendorData();
    }
  }, [user, fetchVendorData]);

  useEffect(() => {
    if (!pathname?.includes("vendor-dashboard")) return;
    fetchVendorData();
  }, [pathname, fetchVendorData]);

  useEffect(() => {
    const handler = () => {
      if (!user || document.visibilityState !== "visible") return;
      fetchVendorData();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [user, fetchVendorData]);

  const getStatusBadge = (vendor: VendorRegistration) => {
    if (vendor.rejection_reason) {
      return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejected</Badge>;
    }
    if (vendor.is_verified_by_admin) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-4 h-4 mr-1" />Verified</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Pending Review</Badge>;
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto h-screen ">
        <div className="flex items-center justify-center  h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!vendorRegistration) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="bg-gray-100 p-4 rounded-full">
                    <Building className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Vendor Registration Required
                </h2>
                <p className="text-gray-600 mb-2 text-lg">
                  To access the vendor dashboard, you'll need to complete your vendor registration first.
                </p>
                <p className="text-gray-500 mb-8">
                  You can start your vendor registration process in your account settings.
                </p>
                <NextLink href="/settings">
                  <Button 
                    size="lg" 
                    className="bg-sm-red hover:bg-sm-red-light text-white"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Go to Settings
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </NextLink>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (showUpdateForm) {
    return (
      <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <VendorUpdateRequestForm
            vendorRegistration={vendorRegistration}
            onSuccess={() => {
              setShowUpdateForm(false);
              fetchVendorData();
            }}
            onCancel={() => setShowUpdateForm(false)}
          />
        </div>
      </div>
      </Layout>
    );
  }

  const isRejected = vendorRegistration.rejection_reason && !vendorRegistration.is_verified_by_admin;

  return (
    <Layout>
    <div className="container mx-auto px-4 py-8">
      <div className=" mx-auto space-y-4 md:space-y-6">
        <div className="flex items-baseline md:items-center justify-between gap-y-4  flex-col md:flex-row">
          <div className='flex flex-col items-baseline'>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your vendor registration and business</p>
          </div>
          <div className="flex gap-3">
            {vendorRegistration.is_verified_by_admin && (
              <NextLink href={"/vendor/analytics" as any}>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </NextLink>
            )}
            {vendorRegistration.is_verified_by_admin && (
              <Button onClick={() => setShowUpdateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Request Update
              </Button>
            )}
          </div>
        </div>

        {/* Registration Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                {vendorRegistration.business_name}
              </span>
              {getStatusBadge(vendorRegistration)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isRejected && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Registration Rejected</h4>
                <p className="text-red-700">{vendorRegistration.rejection_reason}</p>
                <Button 
                  className="mt-3"
                  onClick={() => window.location.href = '/settings'}
                >
                  Reapply for Registration
                </Button>
              </div>
            )}

            {vendorRegistration.is_verified_by_admin && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Registration Approved</h4>
                <p className="text-green-700">
                  Your vendor registration has been approved. You can now manage your business categories.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full">
             <div className='flex overflow-x-auto w-full md:grid md:grid-cols-6 scrollbar-hide scroll-smooth'>
                <TabsTrigger value="profile" className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              Profile
            </TabsTrigger>
            {vendorRegistration.is_verified_by_admin && (
              <>
                <TabsTrigger value="edit" className="flex items-center">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Details
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  Manage Categories
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="requests" className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Requests ({updateRequests.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Documents
            </TabsTrigger>
             {/* <TabsTrigger value="history">History</TabsTrigger> */}
             </div>
          </TabsList>

          <TabsContent value="profile">
            <EnhancedVendorProfile vendorRegistration={vendorRegistration} />
          </TabsContent>

          {vendorRegistration.is_verified_by_admin && (
            <>
              <TabsContent value="edit">
                <VendorBasicDetailsEdit
                  vendorRegistration={vendorRegistration}
                  onUpdate={fetchVendorData}
                />
              </TabsContent>

              <TabsContent value="categories">
                <CategoryManagement vendorRegistration={vendorRegistration} />
              </TabsContent>
            </>
          )}

          <TabsContent value="requests">
            {updateRequests.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Update Requests ({updateRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {updateRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">
                                {request.request_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </h4>
                              {getRequestStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Submitted: {new Date(request.created_at).toLocaleDateString()}
                            </p>
                            {request.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                <strong>Rejection Reason:</strong> {request.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Update Requests</h3>
                  <p className="text-gray-500">You haven't submitted any update requests yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Required Documents</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Government ID</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>GST Certificate</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Trade License</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Bank Proof</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Address Proofs</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Utility Bill</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Rent Agreement</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Property Tax Receipt</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* <TabsContent value="history">
                      <VendorRegistrationHistory vendorRegistrationId={vendorRegistration.id} />
                    </TabsContent> */}
        </Tabs>
      </div>
    </div>
    </Layout>
  );
};

export default VendorDashboard;
