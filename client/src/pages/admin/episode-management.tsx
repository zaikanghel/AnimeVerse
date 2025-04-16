import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Episode, Anime } from '@shared/schema';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Trash2, 
  Loader2, 
  RefreshCw, 
  PlayCircle,
  FilePlus,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema for episode form
const episodeFormSchema = z.object({
  animeId: z.string().min(1, "Anime is required"),
  title: z.string().min(1, "Title is required"),
  number: z.coerce.number().min(1, "Episode number is required"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  videoUrl: z.string().min(1, "Video URL is required"),
  duration: z.string().min(1, "Duration is required"),
  releaseDate: z.string().optional().transform(val => val ? new Date(val).toISOString() : undefined)
});

type EpisodeFormValues = z.infer<typeof episodeFormSchema>;

export default function EpisodeManagement() {
  const [deleteEpisodeId, setDeleteEpisodeId] = useState<number | string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editEpisodeId, setEditEpisodeId] = useState<number | string | null>(null);
  const { toast } = useToast();
  const [allEpisodes, setAllEpisodes] = useState<any[]>([]);

  // Fetch all animes (for dropdown)
  const { data: animes = [], isLoading: isLoadingAnimes } = useQuery<Anime[]>({
    queryKey: ['/api/animes'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // We'll fetch episodes for each anime and combine them
  const {
    data: episodesByAnime,
    isLoading: isLoadingEpisodes,
    refetch: refetchEpisodes
  } = useQuery({
    queryKey: ['allEpisodes'],
    queryFn: async () => {
      if (animes.length === 0) return [];

      // Create a map to store episodes by anime
      const results: { anime: any, episodes: any[] }[] = [];

      // Fetch episodes for each anime in parallel
      const promises = animes.map(async (anime) => {
        try {
          // Use the proper query function to ensure consistent handling of response and errors
          console.log(`Fetching episodes for anime ID: ${anime.id} (${typeof anime.id})`);
          const episodes = await queryClient.fetchQuery({
            queryKey: [`/api/animes/${anime.id}/episodes`],
            queryFn: getQueryFn({ on401: 'throw' })
          });
          
          return { anime, episodes: episodes || [] };
        } catch (error) {
          console.error(`Error fetching episodes for anime ${anime.id}:`, error);
          return { anime, episodes: [] };
        }
      });

      // Wait for all requests to complete
      return await Promise.all(promises);
    },
    enabled: animes.length > 0,
  });

  // Combine episodes from all animes into a flat array
  useEffect(() => {
    if (episodesByAnime) {
      const episodes: any[] = [];
      episodesByAnime.forEach(item => {
        if (item.episodes && Array.isArray(item.episodes)) {
          item.episodes.forEach((episode: any) => {
            episodes.push({
              ...episode,
              animeId: item.anime.id
            });
          });
        }
      });
      setAllEpisodes(episodes);
    }
  }, [episodesByAnime]);

  // Form for create/edit episode
  const form = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeFormSchema),
    defaultValues: {
      title: '',
      number: 1,
      description: '',
      thumbnail: '',
      videoUrl: '',
      duration: '',
      releaseDate: new Date().toISOString().split('T')[0],
    },
  });

  // Create episode mutation
  const createEpisodeMutation = useMutation({
    mutationFn: async (data: EpisodeFormValues) => {
      const response = await apiRequest('POST', '/api/admin/episodes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEpisodes'] });
      
      // Also invalidate anime-specific episodes
      queryClient.invalidateQueries({ 
        queryKey: ['/api/animes', form.getValues().animeId.toString(), 'episodes'] 
      });
      
      toast({
        title: 'Success',
        description: 'Episode created successfully',
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create episode: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update episode mutation
  const updateEpisodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | string, data: EpisodeFormValues }) => {
      const response = await apiRequest('PATCH', `/api/admin/episodes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEpisodes'] });
      
      // Also invalidate anime-specific episodes
      queryClient.invalidateQueries({ 
        queryKey: ['/api/animes', form.getValues().animeId.toString(), 'episodes'] 
      });
      
      toast({
        title: 'Success',
        description: 'Episode updated successfully',
      });
      setEditEpisodeId(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update episode: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete episode mutation
  const deleteEpisodeMutation = useMutation({
    mutationFn: async (id: number | string) => {
      await apiRequest('DELETE', `/api/admin/episodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEpisodes'] });
      
      // Find the deleted episode to get its animeId
      const deletedEpisode = allEpisodes.find(e => e.id === deleteEpisodeId);
      if (deletedEpisode) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/animes', deletedEpisode.animeId.toString(), 'episodes'] 
        });
      }
      
      toast({
        title: 'Success',
        description: 'Episode deleted successfully',
      });
      setDeleteEpisodeId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete episode: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (deleteEpisodeId !== null) {
      deleteEpisodeMutation.mutate(deleteEpisodeId);
    }
  };

  // Handle edit episode
  const handleEditEpisode = (episode: any) => {
    console.log('Editing episode with ID:', episode.id, 'Type:', typeof episode.id);
    console.log('Anime ID:', episode.animeId, 'Type:', typeof episode.animeId);
    
    form.reset({
      animeId: episode.animeId.toString(), // Convert to string to ensure consistency with schema
      title: episode.title,
      number: episode.number,
      description: episode.description || '',
      thumbnail: episode.thumbnail || '',
      videoUrl: episode.videoUrl,
      duration: episode.duration || '',
      releaseDate: episode.releaseDate ? new Date(episode.releaseDate).toISOString().split('T')[0] : '',
    });
    setEditEpisodeId(episode.id);
    setIsCreateDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (values: EpisodeFormValues) => {
    if (editEpisodeId !== null) {
      updateEpisodeMutation.mutate({ id: editEpisodeId, data: values });
    } else {
      createEpisodeMutation.mutate(values);
    }
  };

  // Get anime title by ID
  const getAnimeTitle = (animeId: number | string) => {
    const anime = animes.find(a => a.id.toString() === animeId.toString());
    return anime ? anime.title : 'Unknown';
  };

  // Reset form when closing dialogs
  const handleCloseDialog = () => {
    form.reset();
    setIsCreateDialogOpen(false);
    setEditEpisodeId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Episode Management</h2>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FilePlus className="h-4 w-4 mr-2" />
                Add Episode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editEpisodeId ? 'Edit Episode' : 'Create New Episode'}</DialogTitle>
                <DialogDescription>
                  {editEpisodeId 
                    ? 'Update the details of an existing episode.' 
                    : 'Add a new episode to the anime streaming platform.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="animeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anime</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value?.toString()}
                          disabled={isLoadingAnimes}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an anime" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {animes.map((anime) => (
                              <SelectItem key={anime.id} value={anime.id.toString()}>
                                {anime.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Episode Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="24:30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Episode title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Episode description" 
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/video.mp4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="releaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createEpisodeMutation.isPending || updateEpisodeMutation.isPending}
                    >
                      {(createEpisodeMutation.isPending || updateEpisodeMutation.isPending) && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      {editEpisodeId ? 'Update Episode' : 'Create Episode'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="default"
            onClick={() => refetchEpisodes()}
            disabled={isLoadingEpisodes}
          >
            {isLoadingEpisodes ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {isLoadingEpisodes || isLoadingAnimes ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : allEpisodes && allEpisodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <PlayCircle className="h-16 w-16 text-gray-500 mb-4" />
            <p className="text-lg text-gray-400 mb-2">No episodes found</p>
            <p className="text-sm text-gray-500 mb-6">
              Add your first episode by clicking the "Add Episode" button.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableCaption>List of all episodes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Anime</TableHead>
                <TableHead>Episode</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Release Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allEpisodes.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell>{getAnimeTitle(episode.animeId)}</TableCell>
                  <TableCell>#{episode.number}</TableCell>
                  <TableCell className="font-medium">{episode.title}</TableCell>
                  <TableCell>{episode.duration || 'N/A'}</TableCell>
                  <TableCell>
                    {episode.releaseDate ? formatDate(episode.releaseDate) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEpisode(episode)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog
                        open={deleteEpisodeId === episode.id}
                        onOpenChange={(open) => !open && setDeleteEpisodeId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteEpisodeId(episode.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete episode "{episode.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete}>
                              {deleteEpisodeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}