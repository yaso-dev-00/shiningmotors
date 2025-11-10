"use client";
import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2, Calendar, Users, Trophy, Plus } from "lucide-react";
import { simRacingApi, SimEvent } from "@/integrations/supabase/modules/simRacing";
import { format } from "date-fns";

const SimEventManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["simEvents"],
    queryFn: async () => {
      const { data, error } = await simRacingApi.events.getAll();
      if (error) {
        console.error("Error fetching sim events:", error);
        return [];
      }
      return data || [];
    },
  });

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.format?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.track?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.car_class?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEventId) return;
    
    try {
      await simRacingApi.events.delete(selectedEventId);
      refetch();
    } catch (error) {
      console.error("Error deleting sim event:", error);
    }
    
    setDeleteDialogOpen(false);
    setSelectedEventId(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "PP");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <AdminLayout title="Sim Racing Events Management">
      <div className="flex flex-col md:flex-row justify-between gap-y-4 border md:border-0 py-4 border-gray-300 rounded-md px-4 md:px-1 w-full md:items-center mb-6">
        <div className="flex items-center gap-4 w-full">
           <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
        <NextLink href={"/admin/sim-events/create" as any}>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />Create New Event</Button>
        </NextLink>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableCaption>A list of all sim racing events.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Car Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No events found. Create a new one!
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {event.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.platform || "N/A"}</TableCell>
                    <TableCell>{event.track || "N/A"}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(event.start_date ?? undefined)}</TableCell>
                    <TableCell>{event.car_class || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/sim-events/edit/${event.id}` as any)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/sim-events/participants/${event.id}` as any)}>
                            <Users className="mr-2 h-4 w-4" /> Participants
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/sim-events/results/${event.id}` as any)}>
                            <Trophy className="mr-2 h-4 w-4" /> Results
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(event.id)}
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
              event and all associated data.
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

export default SimEventManagement;
