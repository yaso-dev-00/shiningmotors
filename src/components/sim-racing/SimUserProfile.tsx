"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { simRacingApi } from '@/integrations/supabase/client';
import { SimUser } from '@/integrations/supabase/modules/simRacing';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useProfileUpload } from '@/hooks/use-profile-upload';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit2, Trophy, Car, Clock } from 'lucide-react';

const platformOptions = [
  { value: 'iracing', label: 'iRacing' },
  { value: 'assetto_corsa', label: 'Assetto Corsa' },
  { value: 'rfactor2', label: 'rFactor 2' },
  { value: 'automobilista', label: 'Automobilista' },
  { value: 'project_cars', label: 'Project CARS' },
  { value: 'gran_turismo', label: 'Gran Turismo' },
  { value: 'forza', label: 'Forza' },
  { value: 'other', label: 'Other' }
];

const SimUserProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadProfilePicture, uploading } = useProfileUpload();

  const [simUser, setSimUser] = useState<SimUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [simIds, setSimIds] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    username: '',
    rank: '',
    preferredPlatform: '',
  });

  useEffect(() => {
    const fetchSimUser = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await simRacingApi.users.getById(user.id);
        if (error) throw error;
        
        if (data) {
          setSimUser(data);
          const simIdsObj = data.sim_ids && typeof data.sim_ids === 'object' && !Array.isArray(data.sim_ids) 
            ? data.sim_ids as Record<string, string> 
            : {};
          setFormData({
            username: data.username || '',
            rank: data.rank || '',
            preferredPlatform: simIdsObj?.preferredPlatform || '',
          });
          setSimIds(simIdsObj);
        }
      } catch (error) {
        console.error('Error fetching sim user:', error);
        toast({
          title: 'Error',
          description: 'Failed to load SIM profile',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimUser();
  }, [user, toast]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const url = await uploadProfilePicture(file);
    
    if (url && user) {
      try {
        const { error } = await simRacingApi.users.update(user.id, {
          profile_picture: url
        });
        
        if (error) throw error;
        
        setSimUser(prev => prev ? { ...prev, profile_picture: url } : null);
        
        toast({
          title: 'Success',
          description: 'Profile picture updated successfully',
        });
      } catch (error) {
        console.error('Error updating profile picture:', error);
        toast({
          title: 'Error',
          description: 'Failed to update profile picture',
          variant: 'destructive',
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlatformIdChange = (platform: string, value: string) => {
    setSimIds(prev => ({ ...prev, [platform]: value }));
  };

  const handlePreferredPlatform = (value: string) => {
    setFormData(prev => ({ ...prev, preferredPlatform: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const updatedSimIds = {
        ...simIds,
        preferredPlatform: formData.preferredPlatform
      };
      
      const { error } = await simRacingApi.users.update(user.id, {
        username: formData.username,
        rank: formData.rank,
        sim_ids: updatedSimIds
      });
      
      if (error) throw error;
      
      if (simUser) {
        setSimUser({
          ...simUser,
          username: formData.username,
          rank: formData.rank,
          sim_ids: updatedSimIds
        });
      }
      
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'SIM profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating sim profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update SIM profile',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card className="border-2 border-purple-100 dark:border-purple-900 shadow-lg">
        <CardHeader className="relative pb-0">
          {simUser?.profile_picture ? (
            <div className="flex justify-center">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={simUser.profile_picture} alt={simUser.username || 'User'} />
                <AvatarFallback>{(simUser.username || 'U')[0]}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarFallback>{(simUser?.username || 'U')[0]}</AvatarFallback>
              </Avatar>
            </div>
          )}

          {!isEditing && (
            <Button 
              size="sm" 
              variant="outline" 
              className="absolute right-6 top-6"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={16} className="mr-1" /> Edit Profile
            </Button>
          )}

          <div className="mt-4 text-center">
            <CardTitle className="text-2xl text-purple-800 dark:text-purple-400">
              {simUser?.username || 'Username not set'}
            </CardTitle>
            {simUser?.rank && (
              <Badge variant="secondary" className="mt-2">
                {simUser.rank}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="sim-ids">SIM IDs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              {isEditing ? (
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="profile-picture">Profile Picture</Label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      disabled={uploading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rank">Rank/Title</Label>
                    <Input
                      id="rank"
                      name="rank"
                      value={formData.rank}
                      onChange={handleInputChange}
                      placeholder="E.g. Amateur, Pro, Novice"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preferred-platform">Preferred Platform</Label>
                    <Select value={formData.preferredPlatform} onValueChange={handlePreferredPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preferred platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {platformOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Email</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{simUser?.email || 'Not provided'}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Preferred Platform</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          {simUser?.sim_ids && typeof simUser.sim_ids === 'object' && !Array.isArray(simUser.sim_ids) && (simUser.sim_ids as Record<string, string>).preferredPlatform ? 
                            platformOptions.find(p => p.value === (simUser.sim_ids as Record<string, string>).preferredPlatform)?.label || 
                            (simUser.sim_ids as Record<string, string>).preferredPlatform : 
                            'Not set'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="statistics">
              <div className="space-y-4 py-4">
                {simUser?.stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Trophy size={16} className="mr-2 text-yellow-500" /> Wins
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{((simUser.stats as any)?.wins) || 0}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Car size={16} className="mr-2 text-blue-500" /> Races
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{((simUser.stats as any)?.races) || 0}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Clock size={16} className="mr-2 text-green-500" /> Time Trials
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{((simUser.stats as any)?.timeTrials) || 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No statistics available yet</p>
                    <p className="text-sm text-muted-foreground">Join events and races to build your statistics</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="sim-ids">
              {isEditing ? (
                <div className="space-y-4 py-4">
                  {platformOptions.map(platform => (
                    <div key={platform.value}>
                      <Label htmlFor={`id-${platform.value}`}>{platform.label} ID</Label>
                      <Input
                        id={`id-${platform.value}`}
                        value={simIds[platform.value] || ''}
                        onChange={(e) => handlePlatformIdChange(platform.value, e.target.value)}
                        placeholder={`Enter your ${platform.label} ID`}
                      />
                    </div>
                  ))}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {simUser?.sim_ids && typeof simUser.sim_ids === 'object' && !Array.isArray(simUser.sim_ids) && Object.keys(simUser.sim_ids).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {platformOptions.map(platform => {
                        if (platform.value === 'preferredPlatform') return null;
                        
                        const simIdsObj = simUser.sim_ids && typeof simUser.sim_ids === 'object' && !Array.isArray(simUser.sim_ids) ? simUser.sim_ids as Record<string, string> : null;
                        const id = simIdsObj?.[platform.value];
                        if (!id) return null;
                        
                        return (
                          <Card key={platform.value}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">{platform.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm font-mono">{id}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No SIM IDs added yet</p>
                      <p className="text-sm text-muted-foreground">Add your game IDs to connect with other players</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Last updated: {simUser?.updated_at ? new Date(simUser.updated_at).toLocaleDateString() : 'Never'}
          </p>
          {simUser?.badges && simUser.badges.length > 0 && (
            <div className="flex gap-1">
              {simUser.badges.map((badge, index) => (
                <Badge key={index} variant="outline">{badge}</Badge>
              ))}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SimUserProfile;