"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import  AdminLayout  from "@/components/admin/AdminLayout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Vehicle } from "@/integrations/supabase/modules/vehicles";

  const initialForm = {
  title: "",
  category: "",
  price: "",
  year: "",
  make: "",
  model: "",
  condition: "",
  status: "Available",
  description: ""
};

const VehicleManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const form = useFormValidation(initialForm);
  
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
     
      const { data, error } = await supabase
        .from('vehicles')
        .select('*').eq("seller_id", userId);
      
      if (error) throw error;
      
      const vehiclesWithStatus = data.map(vehicle => ({
        ...vehicle,
        status: vehicle.status || 'Available'
      }));
      
      setVehicles(vehiclesWithStatus);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddVehicle = () => {
    router.push("/admin/vehicles/create");
  };
   
  const handleEditVehicle = (id: string) => {
    router.push(`/admin/vehicles/edit/${id}`);
  };
  
  const handleDeleteVehicle = async (id: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Vehicle deleted",
          description: "The vehicle has been deleted successfully",
        });
        
        await fetchVehicles();
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        toast({
          title: "Error",
          description: "Failed to delete vehicle",
          variant: "destructive",
        });
      }
    }
  };
  
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <AdminLayout title="Vehicle Management" backLink="/admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex w-full max-w-md items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search vehicles..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
         <Button 
          className="bg-sm-red hover:bg-sm-red-light"
          onClick={handleAddVehicle}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      
      </div>
      
      <Card>
        <CardContent className="p-0">
          {loading && !isAddDialogOpen ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="mr-2 animate-spin text-sm-red" />
              <span>Loading vehicles...</span>
            </div>
          ) : filteredVehicles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.title}</TableCell>
                    <TableCell>{vehicle.category}</TableCell>
                    <TableCell>${vehicle.price?.toLocaleString() || '0'}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.condition || 'Unknown'}</TableCell>
                    <TableCell>
                      <span 
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          vehicle.status === "Available"
                            ? "bg-green-100 text-green-800"
                            : vehicle.status === "Reserved"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {vehicle.status || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditVehicle(vehicle.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-gray-500">No vehicles found</p>
              <Button 
                className="bg-sm-red hover:bg-sm-red-light"
                onClick={handleAddVehicle}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Vehicle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default VehicleManagement;
