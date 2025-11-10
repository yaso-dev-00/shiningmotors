import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { simAppApi } from "@/integrations/supabase/modules/simAppPage";
import { simRacingApi } from "@/integrations/supabase/modules/simRacing";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, UserPlus, Users } from "lucide-react";
import { SimLeague } from "@/integrations/supabase/modules/simAppPage";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import supabase from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "../ui/command";

interface SimLeagueRegistrationFormProps {
  leagueId: string;
  leagueData?: any;
  onRegistrationComplete: () => void;
  carClasses?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const SimLeagueRegistrationForm: React.FC<SimLeagueRegistrationFormProps> = ({
  leagueId,
  leagueData,
  onRegistrationComplete,
  carClasses = ["GT3", "GT4", "Formula", "Prototype", "Touring", "Other"],
}) => {
  const { user } = useAuth();
  const [registrationType, setRegistrationType] = useState<"solo" | "team">(
    leagueData?.registration_type || "solo"
  );
  const [carClass, setCarClass] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [teamId, setTeamId] = useState("");
  const [driverIds, setDriverIds] = useState<string[]>(user ? [user.id] : []);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>(
    []
  );
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createTeamDialog, setCreateTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentMemberEmail, setCurrentMemberEmail] = useState("");
  const [currentMemberRole, setCurrentMemberRole] = useState("driver");
  const [searchEmail, setSearchEmail] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchEmail.length < 2) return;

      const { data, error } = await supabase
        .from("sim_users")
        .select("id, email")
        .not("email", "eq", user?.email || "")
        .ilike("email", `%${searchEmail}%`); // case-insensitive match

      if (!error) {
        setUserResults(data);
      }
    };

    fetchUsers();
  }, [searchEmail]);
  const maxTeamMembers = 4;
  const minTeamMembers = 2;

  // League registration type determines the available options
  console.log(leagueData?.registration_type);
  const [leagueRegistrationType, setLeagueRegistrationType] = useState<string>(
    leagueData?.registration_type || "open"
  );

  const [maxParticipants, setMaxParticipants] = useState<number>(
    leagueData?.max_participants || 8
  );

  // Fetch league details if not provided
  useEffect(() => {
    const fetchLeagueDetails = async () => {
      if (!leagueData && leagueId) {
        try {
          const { data, error } = await simAppApi.leagues.getLeagueDetails(
            leagueId
          );
          console.log(data);
          if (error) throw error;
          if (data) {
            setLeagueRegistrationType(data.registration_type || "open");
            setMaxParticipants(data.max_participants || 8);
          }
        } catch (error: any) {
          console.error("Error fetching league details:", error);
          toast({
            title: "Error",
            description: "Could not load league details",
            variant: "destructive",
          });
        }
      }
    };

    fetchLeagueDetails();
  }, [leagueId, leagueData]);

  // Fetch user's teams
  useEffect(() => {
    const fetchUserTeams = async () => {
      setIsLoadingTeams(true);
      try {
        // First check if the user is in any team
        if (!user) {
          return;
        }
        const { data: userData, error: userError } = await simRacingApi.users.getById(user.id);
        console.log(userData);
        if (userError) throw userError;
        console.log(userData);
        if (userData?.id) {
          // If user has a team, fetch team details
          const { data: teamData, error: teamError } =
            await simRacingApi.teams.getYourTeam(userData.id);
          if (teamError) throw teamError;
          console.log(teamData);

          const teams = teamData.map((item) => {
            return { id: item.id, name: item.name };
          });

          if (teamData.length) {
            setUserTeams([...teams]);

            // Pre-select this team if it's the only one
            setTeamId(teamData[0].id);
          }
        } else {
          setUserTeams([]);
        }
      } catch (error: any) {
        console.error("Error fetching user teams:", error);
        toast({
          title: "Error loading teams",
          description: error.message || "Failed to load your teams",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTeams(false);
      }
    };

    if (user?.id) {
      fetchUserTeams();
    }
  }, [user?.id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!carClass) newErrors.carClass = "Car class is required";
    if (!carNumber.trim()) newErrors.carNumber = "Car number is required";
    else if (
      isNaN(Number(carNumber)) ||
      Number(carNumber) < 1 ||
      Number(carNumber) > 999
    ) {
      newErrors.carNumber = "Car number must be between 1 and 999";
    }

    if (registrationType === "team") {
      if (!teamId && !createTeamDialog) {
        newErrors.teamId = "Team selection is required";
      }

      if (createTeamDialog) {
        if (!teamName.trim()) {
          newErrors.teamName = "Team name is required";
        }

        if (teamMembers.length < minTeamMembers - 1) {
          // -1 because the user is automatically included
          newErrors.teamMembers = `At least ${minTeamMembers} team members are required`;
        }
      }
    }

    if (!agreedToTerms) newErrors.terms = "You must agree to the league rules";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setErrors((prev) => ({ ...prev, teamName: "Team name is required" }));
      return;
    }

    if (teamMembers.length < minTeamMembers - 1) {
      setErrors((prev) => ({
        ...prev,
        teamMembers: `At least ${minTeamMembers} team members are required (including yourself)`,
      }));
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the team
      const { data: teamData, error: teamError } =
        await simAppApi.teams.createTeam({
          name: teamName,
          description: teamDescription,
          user_id: user?.id || "",
        });

      if (teamError) throw teamError;
      console.log(teamData);
      if (!teamData?.[0]?.id) {
        throw new Error("Failed to create team");
      }

      const { data: membersid, error } = await simRacingApi.users.getByEmails(
        teamMembers.map((item) => item.email)
      );
      const safeMembers = (membersid ?? []).slice();
      console.log(safeMembers);
      const newTeamId = teamData[0].id;
      if (user) safeMembers.push({ id: user.id });

      // Add team members (excluding the user who is automatically added as captain)
      await Promise.allSettled(
        safeMembers.map((member) =>
          simAppApi.teams.addTeamMember(newTeamId, member.id, "driver")
        )
      );

      // Update the UI
      setUserTeams((prev) => [...prev, { id: newTeamId, name: teamName }]);
      setTeamId(newTeamId);
      setCreateTeamDialog(false);

      toast({
        title: "Team Created",
        description: "Your team has been created successfully",
      });
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({
        title: "Team Creation Failed",
        description:
          error.message || "An error occurred while creating your team",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log(registrationType);
  const addTeamMember = async () => {
    if (!currentMemberEmail.trim() || !currentMemberEmail.includes("@")) {
      setErrors((prev) => ({
        ...prev,
        memberEmail: "Valid email is required",
      }));
      return;
    }
    console.log(teamMembers);
    if (teamMembers.length >= maxTeamMembers - 1) {
      setErrors((prev) => ({
        ...prev,
        teamMembers: `Maximum ${maxTeamMembers} team members allowed (including yourself)`,
      }));
      return;
    }
    const isEmailPresent = teamMembers.find(
      (item) => item.email == currentMemberEmail
    );
    if (teamMembers.length && isEmailPresent) {
      toast({
        title: "Duplication",
        description: "email is already added",
        variant: "destructive",
      });
      return;
    }
    // In a real app, you would verify if this email exists
    const newMember: TeamMember = {
      id: `temp-${Date.now()}`, // This would be a real ID in production
      name: currentMemberEmail.split("@")[0],
      email: currentMemberEmail,
      role: currentMemberRole,
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setCurrentMemberEmail("");
    setErrors((prev) => ({ ...prev, memberEmail: "", teamMembers: "" }));
  };

  const removeTeamMember = (email: string) => {
    setTeamMembers((prev) => prev.filter((member) => member.email !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const registrationData = {
        car_class: carClass,
        car_number: parseInt(carNumber),
        // notes
      };

      let response;

      if (registrationType === "solo") {
        // Register solo
        response = await simAppApi.leagues.registerForLeague(
          leagueId,
          user?.id || "",
          registrationData
        );
      } else {
        // Register as team
        response = await simAppApi.leagues.registerTeamForLeague(
          leagueId,
          teamId,
          driverIds,
          registrationData
        );
      }

      if (response.error) {
        toast({
          title: "Registration failed",
          description: response.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "League registration successful!",
        description: `You have registered ${
          registrationType === "team" ? "your team" : "as a solo driver"
        } for this league.`,
      });

      onRegistrationComplete();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if team registration is allowed based on league type
  const isTeamRegistrationAllowed =
    leagueRegistrationType === "open" || leagueRegistrationType === "team";

  // Determine if solo registration is allowed based on league type
  const isSoloRegistrationAllowed =
    leagueRegistrationType === "open" || leagueRegistrationType === "solo";

  // Default to solo if team registration isn't allowed
  useEffect(() => {
    if (!isTeamRegistrationAllowed && registrationType === "team") {
      setRegistrationType("solo");
    }
  }, [isTeamRegistrationAllowed, registrationType]);

  // Create Team Dialog
  const renderCreateTeamDialog = () => (
    <Dialog open={createTeamDialog} onOpenChange={setCreateTeamDialog}>
      <DialogContent className="max-w-md p-2">
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
          <DialogDescription>
            Enter your team details and add team members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name*</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className={errors.teamName ? "border-red-500" : ""}
            />
            {errors.teamName && (
              <p className="text-xs text-red-500">{errors.teamName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamDescription">Team Description</Label>
            <Textarea
              id="teamDescription"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Describe your team"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>
                Team Members ({teamMembers.length + 1}/{maxTeamMembers})
              </span>
              <span className="text-xs text-muted-foreground">
                Including yourself
              </span>
            </Label>

            <div className="p-2 bg-muted rounded-md">
              <div className="flex items-center p-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>
                    {user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.email || ""}</p>
                  <p className="text-xs text-muted-foreground">
                    Team Captain (You)
                  </p>
                </div>
              </div>

              {teamMembers.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between p-2"
                >
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{member.email.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMember(member.email)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {teamMembers.length < maxTeamMembers - 1 && (
              <div className="flex items-end gap-2 mt-2">
                <div className="flex-1">
                  <Label htmlFor="memberEmail">Invite Member</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between ${
                          errors.memberEmail ? "border-red-500" : ""
                        }`}
                      >
                        {currentMemberEmail || "Select email..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search email..."
                          onValueChange={setSearchEmail}
                        />
                        <CommandList>
                          {userResults.length > 0 ? (
                            userResults.map((user) => (
                              <CommandItem
                                key={user.id}
                                onSelect={() => {
                                  setCurrentMemberEmail(user?.email || "");
                                  setOpen(false);
                                }}
                              >
                                {user?.email || ""}
                              </CommandItem>
                            ))
                          ) : (
                            <CommandItem disabled>No users found.</CommandItem>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.memberEmail && (
                    <p className="text-xs text-red-500">{errors.memberEmail}</p>
                  )}
                </div>

                <div className="w-24">
                  <Label htmlFor="memberRole">Role</Label>
                  <Select
                    value={currentMemberRole}
                    onValueChange={setCurrentMemberRole}
                  >
                    <SelectTrigger id="memberRole">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="mb-[1px]"
                  size="icon"
                  variant="outline"
                  onClick={addTeamMember}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {errors.teamMembers && (
              <p className="text-xs text-red-500">{errors.teamMembers}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setCreateTeamDialog(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateTeam} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Team"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Render invitation only message
  if (leagueRegistrationType === "invitation_only") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation Only League</CardTitle>
          <CardDescription>
            This league requires an invitation to join
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Contact the league organizer for an invitation to join this league.
          </p>
        </CardContent>
      </Card>
    );
  }
  console.log(registrationType);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Register for League</CardTitle>
        <CardDescription>
          Participate in this league{" "}
          {isTeamRegistrationAllowed && isSoloRegistrationAllowed
            ? "as a solo driver or with your team"
            : isTeamRegistrationAllowed
            ? "with your team"
            : "as a solo driver"}
        </CardDescription>
      </CardHeader>

      {/* Only show tabs if both registration types are allowed */}
      {isTeamRegistrationAllowed && isSoloRegistrationAllowed ? (
        <Tabs
          defaultValue="solo"
          onValueChange={(value) =>
            setRegistrationType(value as "solo" | "team")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="solo">Solo Driver</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="solo">
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="soloCarClass">Car Class</Label>
                  <Select value={carClass} onValueChange={setCarClass}>
                    <SelectTrigger
                      id="soloCarClass"
                      className={errors.carClass ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select car class" />
                    </SelectTrigger>
                    <SelectContent>
                      {carClasses.map((carClass) => (
                        <SelectItem key={carClass} value={carClass}>
                          {carClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.carClass && (
                    <p className="text-xs text-red-500">{errors.carClass}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soloCarNumber">Car Number</Label>
                  <Input
                    id="soloCarNumber"
                    type="number"
                    min="1"
                    max="999"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    placeholder="Enter your car number (1-999)"
                    className={errors.carNumber ? "border-red-500" : ""}
                  />
                  {errors.carNumber && (
                    <p className="text-xs text-red-500">{errors.carNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soloNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="soloNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information or special requirements"
                    rows={3}
                  />
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="team">
              <CardContent className="space-y-4 pt-4">
                {userTeams.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="team">Select Your Team</Label>
                    {isLoadingTeams ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Select value={teamId} onValueChange={setTeamId}>
                        <SelectTrigger
                          id="team"
                          className={errors.teamId ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select your team" />
                        </SelectTrigger>
                        <SelectContent>
                          {userTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.teamId && (
                      <p className="text-xs text-red-500">{errors.teamId}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 border rounded-md border-dashed">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <h4 className="font-medium">No Teams Available</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        You need to create or join a team first
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setCreateTeamDialog(true)}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create a Team
                      </Button>
                    </div>
                  </div>
                )}

                {userTeams.length > 0 && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => setCreateTeamDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create another team
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="teamCarClass">Car Class</Label>
                  <Select value={carClass} onValueChange={setCarClass}>
                    <SelectTrigger
                      id="teamCarClass"
                      className={errors.carClass ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select car class" />
                    </SelectTrigger>
                    <SelectContent>
                      {carClasses.map((carClass) => (
                        <SelectItem key={carClass} value={carClass}>
                          {carClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.carClass && (
                    <p className="text-xs text-red-500">{errors.carClass}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamCarNumber">Team Car Number</Label>
                  <Input
                    id="teamCarNumber"
                    type="number"
                    min="1"
                    max="999"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    placeholder="Enter team car number (1-999)"
                    className={errors.carNumber ? "border-red-500" : ""}
                  />
                  {errors.carNumber && (
                    <p className="text-xs text-red-500">{errors.carNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="teamNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information or special requirements"
                    rows={3}
                  />
                </div>
              </CardContent>
            </TabsContent>

            <CardContent className="pt-0">
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) =>
                    setAgreedToTerms(checked as boolean)
                  }
                  className={errors.terms ? "border-red-500" : ""}
                />
                <Label
                  htmlFor="terms"
                  className={`text-sm ${errors.terms ? "text-red-500" : ""}`}
                >
                  I agree to the league rules and regulations
                </Label>
              </div>
              {errors.terms && (
                <p className="text-xs text-red-500 mt-1">{errors.terms}</p>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  (registrationType === "team" && userTeams.length === 0)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Register ${
                    registrationType === "team" ? "Team" : "as Solo Driver"
                  }`
                )}
              </Button>
            </CardFooter>
          </form>
        </Tabs>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            {/* Solo registration form (no tabs) */}
            {isSoloRegistrationAllowed && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="carClass">Car Class</Label>
                  <Select value={carClass} onValueChange={setCarClass}>
                    <SelectTrigger
                      id="carClass"
                      className={errors.carClass ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select car class" />
                    </SelectTrigger>
                    <SelectContent>
                      {carClasses.map((carClass) => (
                        <SelectItem key={carClass} value={carClass}>
                          {carClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.carClass && (
                    <p className="text-xs text-red-500">{errors.carClass}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carNumber">Car Number</Label>
                  <Input
                    id="carNumber"
                    type="number"
                    min="1"
                    max="999"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    placeholder="Enter your car number (1-999)"
                    className={errors.carNumber ? "border-red-500" : ""}
                  />
                  {errors.carNumber && (
                    <p className="text-xs text-red-500">{errors.carNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information or special requirements"
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Team registration form (no tabs) */}
            {isTeamRegistrationAllowed && !isSoloRegistrationAllowed && (
              <>
                {userTeams.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="team">Select Your Team</Label>
                    {isLoadingTeams ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Select value={teamId} onValueChange={setTeamId}>
                        <SelectTrigger
                          id="team"
                          className={errors.teamId ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select your team" />
                        </SelectTrigger>
                        <SelectContent>
                          {userTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.teamId && (
                      <p className="text-xs text-red-500">{errors.teamId}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 border rounded-md border-dashed">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <h4 className="font-medium">No Teams Available</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        You need to create or join a team first
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setCreateTeamDialog(true)}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create a Team
                      </Button>
                    </div>
                  </div>
                )}

                {userTeams.length > 0 && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => setCreateTeamDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create another team
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="teamCarClass">Car Class</Label>
                  <Select value={carClass} onValueChange={setCarClass}>
                    <SelectTrigger
                      id="teamCarClass"
                      className={errors.carClass ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select car class" />
                    </SelectTrigger>
                    <SelectContent>
                      {carClasses.map((carClass) => (
                        <SelectItem key={carClass} value={carClass}>
                          {carClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.carClass && (
                    <p className="text-xs text-red-500">{errors.carClass}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamCarNumber">Team Car Number</Label>
                  <Input
                    id="teamCarNumber"
                    type="number"
                    min="1"
                    max="999"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    placeholder="Enter team car number (1-999)"
                    className={errors.carNumber ? "border-red-500" : ""}
                  />
                  {errors.carNumber && (
                    <p className="text-xs text-red-500">{errors.carNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="teamNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information or special requirements"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked as boolean)
                }
                className={errors.terms ? "border-red-500" : ""}
              />
              <Label
                htmlFor="terms"
                className={`text-sm ${errors.terms ? "text-red-500" : ""}`}
              >
                I agree to the league rules and regulations
              </Label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-500 mt-1">{errors.terms}</p>
            )}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                (isTeamRegistrationAllowed &&
                  !isSoloRegistrationAllowed &&
                  userTeams.length === 0)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Register ${
                  isTeamRegistrationAllowed && !isSoloRegistrationAllowed
                    ? "Team"
                    : "as Solo Driver"
                }`
              )}
            </Button>
          </CardFooter>
        </form>
      )}

      {/* Team creation dialog */}
      {renderCreateTeamDialog()}
    </Card>
  );
};

export default SimLeagueRegistrationForm;
