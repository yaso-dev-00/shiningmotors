
import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, MoreHorizontal, Trash2, MapPin, Phone, Mail, Wrench ,Plus} from "lucide-react";
import { simRacingApi } from "@/integrations/supabase/modules/simRacing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SimGarageManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);

  const { data: garages = [], isLoading, refetch } = useQuery({
    queryKey: ["simGarages"],
    queryFn: async () => {
      const { data, error } = await simRacingApi.garages.getAll();
      if (error) {
        console.error("Error fetching sim garages:", error);
        return [];
      }
      return data || [];
    },
  });

  const filteredGarages = garages.filter(garage => 
    garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (garageId: string) => {
    setSelectedGarageId(garageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGarageId) return;
    
    try {
      await simRacingApi.garages.delete(selectedGarageId);
      refetch();

      // Trigger revalidation for sim-racing SSG/ISR
      try {
        await fetch("/api/sim-racing/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedGarageId,
            entityType: "garage",
            action: "delete",
          }),
        });
      } catch (revalidateError) {
        console.error(
          "Error triggering sim-racing revalidation (garage delete):",
          revalidateError
        );
      }
    } catch (error) {
      console.error("Error deleting sim garage:", error);
    }
    
    setDeleteDialogOpen(false);
    setSelectedGarageId(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getLocation = (garage: any) => {
    const parts = [garage.city, garage.state, garage.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <AdminLayout title="Sim Racing Garages Management" backLink="/admin/dashboard">
      <div className="flex flex-col md:flex-row justify-between gap-y-4 border md:border-0 py-4 border-gray-300 rounded-md px-4 md:px-1 w-full md:items-center mb-6">
        <div className="flex items-center gap-4 w-full">
          <Input
            placeholder="Search garages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:w-64 w-full focus-visible:border-none"
          />
        </div>
        <NextLink href={"/admin/sim-garages/create" as any}>
          <Button className="w-full "><Plus className="mr-2 h-4 w-4" /> Create New Garage</Button>
        </NextLink>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableCaption>A list of all sim racing garages.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Garage</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Services</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGarages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No garages found. Create a new one!
                  </TableCell>
                </TableRow>
              ) : (
                filteredGarages.map((garage) => (
                  <TableRow key={garage.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={garage.logo || ''} alt={garage.name} />
                          <AvatarFallback>{getInitials(garage.name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{garage.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-baseline justify-center">
                        <MapPin className="mr-1 relative top-[5px] h-5 w-5 text-muted-foreground" />
                        {getLocation(garage)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {garage.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
                          {garage.phone}
                        </div>
                      )}
                      {garage.email && (
                        <div className="flex items-center text-sm mt-1">
                          <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                          {garage.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {garage.services_offered && garage.services_offered.length > 0 ? (
                        <div className="flex items-center">
                          <Wrench className="mr-1 h-4 w-4 text-muted-foreground" />
                          {garage.services_offered.length} service{garage.services_offered.length !== 1 ? 's' : ''}
                        </div>
                      ) : (
                        "No services listed"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push((`/admin/sim-garages/edit/${garage.id}`) as any)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push((`/admin/sim-garages/services/${garage.id}`) as any)}>
                            <Wrench className="mr-2 h-4 w-4" /> Manage Services
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(garage.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              garage and all associated services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SimGarageManagement;
