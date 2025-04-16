import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Film, 
  LayoutList, 
  Tag, 
  Users,
  Activity,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import AnimeManagement from './anime-management';
import EpisodeManagement from './episode-management';
import GenreManagement from './genre-management';
import UserManagement from './user-management';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>('anime');
  const { user } = useAuth();
  
  // Fetch stats for the dashboard
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await response.json();
      console.log('Stats data received:', data);
      return data;
    },
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Log when stats data changes
  console.log('Current stats in component:', stats);
  
  // We don't need this check anymore since ProtectedRoute handles it
  // The admin check is now done in the ProtectedRoute component

  return (
    <div className="container mx-auto px-4 py-28 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <div className="bg-accent/10 p-3 rounded-lg mr-4">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your anime streaming platform content</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-purple-900/20 border-purple-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Anime</p>
                {isLoadingStats ? (
                  <div className="flex items-center mt-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-purple-400" />
                    <p className="text-sm">Loading...</p>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold">{stats?.animeCount || 0}</p>
                )}
              </div>
              <Film className="h-8 w-8 text-purple-400 opacity-80" />
            </CardContent>
          </Card>
          
          <Card className="bg-blue-900/20 border-blue-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Episodes</p>
                {isLoadingStats ? (
                  <div className="flex items-center mt-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-400" />
                    <p className="text-sm">Loading...</p>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold">{stats?.episodeCount || 0}</p>
                )}
              </div>
              <LayoutList className="h-8 w-8 text-blue-400 opacity-80" />
            </CardContent>
          </Card>
          
          <Card className="bg-green-900/20 border-green-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Genres</p>
                {isLoadingStats ? (
                  <div className="flex items-center mt-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-green-400" />
                    <p className="text-sm">Loading...</p>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold">{stats?.genreCount || 0}</p>
                )}
              </div>
              <Tag className="h-8 w-8 text-green-400 opacity-80" />
            </CardContent>
          </Card>
          
          <Card className="bg-orange-900/20 border-orange-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Users</p>
                {isLoadingStats ? (
                  <div className="flex items-center mt-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-orange-400" />
                    <p className="text-sm">Loading...</p>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold">{stats?.userCount || 0}</p>
                )}
              </div>
              <Users className="h-8 w-8 text-orange-400 opacity-80" />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="bg-gray-800/60 rounded-lg shadow-lg border border-gray-700">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-700">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger 
                value="anime" 
                className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:shadow-none rounded-none py-4 px-6"
              >
                <Film className="h-4 w-4" />
                <span>Anime</span>
              </TabsTrigger>
              <TabsTrigger 
                value="episodes" 
                className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:shadow-none rounded-none py-4 px-6"
              >
                <LayoutList className="h-4 w-4" />
                <span>Episodes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="genres" 
                className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:shadow-none rounded-none py-4 px-6"
              >
                <Tag className="h-4 w-4" />
                <span>Genres</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:shadow-none rounded-none py-4 px-6"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6">
            <TabsContent value="anime" className="mt-0">
              <AnimeManagement />
            </TabsContent>
            
            <TabsContent value="episodes" className="mt-0">
              <EpisodeManagement />
            </TabsContent>
            
            <TabsContent value="genres" className="mt-0">
              <GenreManagement />
            </TabsContent>
            
            <TabsContent value="users" className="mt-0">
              <UserManagement />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

