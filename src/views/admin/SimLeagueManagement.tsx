
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
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2, Calendar, Users, ChevronRight ,Plus} from "lucide-react";
import { simRacingApi } from "@/integrations/supabase/modules/simRacing";
import { format, parseISO } from "date-fns";

const SimLeagueManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  const { data: leagues = [], isLoading, refetch } = useQuery({
    queryKey: ["simLeagues"],
    queryFn: async () => {
      const { data, error } = await simRacingApi.leagues.getAll();
      if (error) {
        console.error("Error fetching sim leagues:", error);
        return [];
      }
      return data || [];
    },
  });

  const filteredLeagues = leagues.filter(league => 
    league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    league.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    league.registration_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLeagueId) return;
    
    try {
      await simRacingApi.leagues.delete(selectedLeagueId);
      refetch();
    } catch (error) {
      console.error("Error deleting sim league:", error);
    }
    
    setDeleteDialogOpen(false);
    setSelectedLeagueId(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "PP");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <AdminLayout title="Sim Racing Leagues Management">
      <div className="flex flex-col md:flex-row justify-between gap-y-4 border md:border-0 py-4 border-gray-300 rounded-md px-4 md:px-1 w-full md:items-center mb-6">
        <div className="flex items-center gap-4 w-full">
           <Input
            placeholder="Search leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
        <NextLink href={"/admin/sim-leagues/create" as any}>
          <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Create New League</Button>
        </NextLink>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableCaption>A list of all sim racing leagues.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Max Participants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeagues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No leagues found. Create a new one!
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell className="font-medium">{league.name}</TableCell>
                    <TableCell>
                      {league.platform ? (
                        <Badge variant="outline">
                          {league.platform}
                        </Badge>
                      ) : "N/A"}
                    </TableCell>
                    <TableCell>
                      {league.registration_type || "N/A"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(league.start_date ?? undefined)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(league.end_date ?? undefined)}</TableCell>
                    <TableCell>{league.max_participants || "Unlimited"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push((`/admin/sim-leagues/edit/${league.id}`) as any)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push((`/admin/sim-leagues/events/${league.id}`) as any)}>
                            <Calendar className="mr-2 h-4 w-4" /> Events
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push((`/admin/sim-leagues/participants/${league.id}`) as any)}>
                            <Users className="mr-2 h-4 w-4" /> Participants
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push((`/admin/sim-leagues/standings/${league.id}`) as any)}>
                            <ChevronRight className="mr-2 h-4 w-4" /> Standings
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(league.id)}
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
              league and may affect associated events and participants.
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

export default SimLeagueManagement;
