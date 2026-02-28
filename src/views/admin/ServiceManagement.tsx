"use client";
import { useState, useEffect } from "react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { serviceCategories } from "@/data/serviceCategories";
import { getServices, deleteService, ServicePost } from "@/integrations/supabase/modules/services";

const ServiceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<ServicePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState<ServicePost[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredServices(services);
    } else {
      const results = services.filter(
        (service) =>
          service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(results);
    }
  }, [searchTerm, services]);

  const fetchServices = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await getServices(user.id);

      if (error) throw error;

      setServices(data || []);
      setFilteredServices(data || []);
    } catch (error: unknown) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const { success, error } = await deleteService(id);

      if (!success) throw error;

      // Remove the service from the list
      setServices((prev) => prev.filter((service) => service.id !== id));

      // Trigger revalidation for services SSG/ISR
      try {
        await fetch("/api/services/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: "delete" }),
        });
      } catch (revalidateError) {
        console.error("Error triggering services revalidation:", revalidateError);
      }

      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    } catch (error: unknown) {
      console.error("Error deleting service:", error);
      const message = error instanceof Error ? error.message : "Failed to delete service";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (tags: string[]) => {
    // Find the first tag that matches a category name or return the first tag
    if (!tags || tags.length === 0) return "Uncategorized";
    
    const foundCategory = serviceCategories.find(
      cat => tags.includes(cat.name)
    );
    
    return foundCategory ? foundCategory.name : tags[0];
  };

  const getServiceTitle = (content: string | null): string => {
    if (!content) return "Untitled Service";
    const firstLine = content.split('\n')[0];
    return firstLine || "Untitled Service";
  };

  return (
    <AdminLayout title="Service Management" backLink="/admin">
      <div className="space-y-6">
        {/* Top actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center w-full sm:w-auto">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mr-2 w-full sm:w-64"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <NextLink href={"/admin/services/create" as any}>
            <Button className="w-full sm:w-auto bg-sm-red hover:bg-sm-red-light">
              <Plus className="mr-2 h-4 w-4" /> Add New Service
            </Button>
          </NextLink>
        </div>

        {/* Services list */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading services...</div>
          ) : filteredServices.length === 0 ? (
            <div className="p-6 text-center">
              {searchTerm ? "No services found matching your search." : "No services have been created yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {service.media_urls && service.media_urls.length > 0 ? (
                          <img
                            src={service.media_urls[0]}
                            alt="Service"
                            className="h-12 w-12 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {service.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {serviceCategories.find((item)=>item.id==service.category)?.name||'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {service.location || "Not specified"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {service.created_at ? new Date(service.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <NextLink href={`/admin/services/edit/${service.id}` as any}>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </NextLink>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => service.id && handleDeleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ServiceManagement;
