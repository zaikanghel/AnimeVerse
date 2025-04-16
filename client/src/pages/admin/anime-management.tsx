import { useState, useEffect } from 'react';
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Anime, insertAnimeSchema } from '@shared/schema';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
  Pencil, 
  Plus, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  ImageOff,
  FilmIcon,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Form schema based on the insert anime schema
const animeFormSchema = insertAnimeSchema
  .extend({
    releaseYear: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
    episodes: z.coerce.number().min(0).optional().nullable(),
  });

type AnimeFormValues = z.infer<typeof animeFormSchema>;

export default function AnimeManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [deleteAnimeId, setDeleteAnimeId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch all animes with enhanced error handling
  const { 
    data, 
    isLoading, 
    error: fetchError,
    refetch 
  } = useQuery<Anime[]>({
    queryKey: ['/api/animes'],
    queryFn: getQueryFn({ 
      on401: 'returnNull',
      maxRetries: 2 // Use enhanced retry logic from our updated queryClient
    })
  });
  
  // Safely process the query result
  const animes = Array.isArray(data) ? data : [];
  
  // Handle error display outside the query definition
  useEffect(() => {
    if (fetchError) {
      console.error('Failed to fetch anime list:', fetchError);
      toast({
        title: 'Data Loading Error',
        description: `Could not load anime list: ${fetchError.message}`,
        variant: 'destructive',
      });
    }
  }, [fetchError, toast]);

  // Create anime mutation with enhanced error handling
  const createAnimeMutation = useMutation({
    mutationFn: async (newAnime: AnimeFormValues) => {
      try {
        // Use our enhanced apiRequest with built-in retry
        const response = await apiRequest('POST', '/api/admin/animes', newAnime);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Create anime error details:', error);
        throw error; // Re-throw to let the mutation handler deal with it
      }
    },
    onSuccess: (data) => {
      // Clear the form
      createForm.reset();
      
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['/api/animes'] });
      
      // Notify the user
      toast({
        title: 'Success',
        description: 'Anime was successfully created',
      });
      
      // Close the dialog
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      // Extract the meaningful part of the error message if possible
      const errorMessage = error.message.includes(':') 
        ? error.message.split(':').slice(1).join(':').trim()
        : error.message;
        
      toast({
        title: 'Creation Failed',
        description: `Failed to create anime: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  // Update anime mutation with enhanced error handling
  const updateAnimeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AnimeFormValues }) => {
      try {
        // Use our enhanced apiRequest with built-in retry
        const response = await apiRequest('PATCH', `/api/admin/animes/${id}`, data);
        const responseData = await response.json();
        return responseData;
      } catch (error) {
        console.error(`Update anime ${id} error details:`, error);
        throw error; // Re-throw to let the mutation handler deal with it
      }
    },
    onSuccess: (data, variables) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['/api/animes'] });
      
      // Also update specific anime detail cache if that exists
      queryClient.invalidateQueries({ 
        queryKey: ['/api/animes', variables.id.toString()] 
      });
      
      // Notify the user
      toast({
        title: 'Success',
        description: 'Anime was successfully updated',
      });
      
      // Close the edit dialog
      setEditingAnime(null);
    },
    onError: (error: Error) => {
      // Extract the meaningful part of the error message if possible
      const errorMessage = error.message.includes(':') 
        ? error.message.split(':').slice(1).join(':').trim()
        : error.message;
        
      toast({
        title: 'Update Failed',
        description: `Failed to update anime: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  // Delete anime mutation with enhanced error handling
  const deleteAnimeMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        // Use our enhanced apiRequest with built-in retry
        await apiRequest('DELETE', `/api/admin/animes/${id}`);
        return id; // Return the ID for use in onSuccess
      } catch (error) {
        console.error(`Delete anime ${id} error details:`, error);
        throw error; // Re-throw to let the mutation handler deal with it
      }
    },
    onSuccess: (deletedId) => {
      // Update the cache by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['/api/animes'] });
      
      // Also remove any specific anime detail from cache
      queryClient.invalidateQueries({ 
        queryKey: ['/api/animes', deletedId.toString()] 
      });
      
      // Also invalidate episodes list for this anime
      queryClient.invalidateQueries({ 
        queryKey: ['/api/animes', deletedId.toString(), 'episodes'] 
      });
      
      // Notify the user
      toast({
        title: 'Success',
        description: 'Anime was successfully deleted',
      });
      
      // Close the delete confirmation dialog
      setDeleteAnimeId(null);
    },
    onError: (error: Error) => {
      // Extract the meaningful part of the error message if possible
      const errorMessage = error.message.includes(':') 
        ? error.message.split(':').slice(1).join(':').trim()
        : error.message;
        
      toast({
        title: 'Deletion Failed',
        description: `Failed to delete anime: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  // Create form
  const createForm = useForm<AnimeFormValues>({
    resolver: zodResolver(animeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      coverImage: '',
      bannerImage: '',
      releaseYear: new Date().getFullYear(),
      status: 'Ongoing',
      type: 'TV',
      episodes: null,
      rating: null,
      studio: null,
    },
  });

  // Edit form
  const editForm = useForm<AnimeFormValues>({
    resolver: zodResolver(animeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      coverImage: '',
      bannerImage: '',
      releaseYear: new Date().getFullYear(),
      status: 'Ongoing',
      type: 'TV',
      episodes: null,
      rating: null,
      studio: null,
    },
  });

  // When selecting an anime to edit, reset the form with its values
  const handleEditAnime = (anime: Anime) => {
    setEditingAnime(anime);
    editForm.reset({
      ...anime,
      releaseYear: anime.releaseYear,
      episodes: anime.episodes,
    });
  };

  // Handle create form submission
  const onCreateSubmit = (values: AnimeFormValues) => {
    createAnimeMutation.mutate(values);
  };

  // Handle edit form submission
  const onEditSubmit = (values: AnimeFormValues) => {
    if (editingAnime) {
      updateAnimeMutation.mutate({ id: editingAnime.id, data: values });
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (deleteAnimeId !== null) {
      deleteAnimeMutation.mutate(deleteAnimeId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Anime Management</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Anime
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Anime</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new anime to the database.
                </DialogDescription>
              </DialogHeader>
              <AnimeForm
                form={createForm}
                onSubmit={onCreateSubmit}
                isPending={createAnimeMutation.isPending}
                submitLabel="Create Anime"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : animes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FilmIcon className="h-16 w-16 text-gray-500 mb-4" />
            <p className="text-lg text-gray-400 mb-2">No anime found</p>
            <p className="text-sm text-gray-500 mb-6">
              Start by adding your first anime to the database.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Anime
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableCaption>List of all anime in the database.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Episodes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animes.map((anime) => (
                <TableRow key={anime.id}>
                  <TableCell>
                    {anime.coverImage ? (
                      <img
                        src={anime.coverImage}
                        alt={anime.title}
                        className="h-12 w-9 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-9 flex items-center justify-center bg-gray-700 rounded">
                        <ImageOff className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{anime.title}</TableCell>
                  <TableCell>{anime.releaseYear}</TableCell>
                  <TableCell>{anime.status}</TableCell>
                  <TableCell>{anime.type}</TableCell>
                  <TableCell>{anime.episodes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog
                        open={editingAnime?.id === anime.id}
                        onOpenChange={(open) => !open && setEditingAnime(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAnime(anime)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Anime</DialogTitle>
                            <DialogDescription>
                              Modify the details of {anime.title}.
                            </DialogDescription>
                          </DialogHeader>
                          {editingAnime && (
                            <AnimeForm
                              form={editForm}
                              onSubmit={onEditSubmit}
                              isPending={updateAnimeMutation.isPending}
                              submitLabel="Update Anime"
                              editMode={true}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog
                        open={deleteAnimeId === anime.id}
                        onOpenChange={(open) => !open && setDeleteAnimeId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteAnimeId(anime.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to delete this anime?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete{' '}
                              <strong>{anime.title}</strong> and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleConfirmDelete}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteAnimeMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
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

// Form component shared between create and edit
// Genre management component for anime
function AnimeGenreManager({ 
  animeId,
}: { 
  animeId: number | string | null;
}) {
  const { toast } = useToast();
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  // Fetch all genres
  const { data: genresData } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/genres'],
    enabled: true,
  });
  
  // Fetch anime-specific genres
  const { 
    data: animeGenres, 
    isLoading: isLoadingAnimeGenres,
    refetch: refetchAnimeGenres
  } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/animes', animeId, 'genres'],
    queryFn: async () => {
      if (!animeId) return [];
      const response = await fetch(`/api/animes/${animeId}/genres`);
      if (!response.ok) throw new Error('Failed to fetch anime genres');
      return response.json();
    },
    enabled: !!animeId,
  });
  
  // Add genre to anime mutation
  const addGenreMutation = useMutation({
    mutationFn: async ({ animeId, genreId }: { animeId: number | string, genreId: string }) => {
      try {
        console.log(`Adding genre ${genreId} to anime ${animeId}`);
        
        // Debug the request before sending
        console.log(`API Request URL: /api/admin/animes/${animeId}/genres/${genreId}`);
        console.log(`API Request Method: POST`);
        console.log(`API Request Body: {}`);
        
        const response = await fetch(
          `/api/admin/animes/${animeId}/genres/${genreId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for sending cookies with the request
            body: JSON.stringify({}) // Empty object as body
          }
        );
        
        // Log the response status and headers
        console.log(`API Response Status: ${response.status}`);
        
        // Try to get the response text for logging, regardless of success
        const responseText = await response.text();
        console.log(`API Response Body: ${responseText}`);
        
        if (!response.ok) {
          // Try to parse the response text as JSON
          let errorMessage = 'Failed to add genre';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If it's not valid JSON, use the response text as the error message
            errorMessage = responseText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        // Parse the response text as JSON if possible, or return an empty object
        try {
          return JSON.parse(responseText);
        } catch (e) {
          return {};
        }
      } catch (error) {
        console.error('Error adding genre:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Genre added successfully' });
      refetchAnimeGenres();
      setSelectedGenre('');
      
      // Also invalidate the anime detail to update genres there
      queryClient.invalidateQueries({ queryKey: ['/api/animes', animeId] });
    },
    onError: (error: Error) => {
      console.error('Genre add error:', error);
      toast({ 
        title: 'Failed to add genre', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Remove genre from anime mutation
  const removeGenreMutation = useMutation({
    mutationFn: async ({ animeId, genreId }: { animeId: number | string, genreId: string }) => {
      try {
        console.log(`Removing genre ${genreId} from anime ${animeId}`);
        
        // Debug the request before sending
        console.log(`API Request URL: /api/admin/animes/${animeId}/genres/${genreId}`);
        console.log(`API Request Method: DELETE`);
        
        const response = await fetch(
          `/api/admin/animes/${animeId}/genres/${genreId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for sending cookies with the request
          }
        );
        
        // Log the response status
        console.log(`API Response Status: ${response.status}`);
        
        // Try to get the response text for logging, regardless of success
        const responseText = await response.text();
        console.log(`API Response Body: ${responseText}`);
        
        if (!response.ok) {
          // Try to parse the response text as JSON
          let errorMessage = 'Failed to remove genre';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If it's not valid JSON, use the response text as the error message
            errorMessage = responseText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        // Parse the response text as JSON if possible, or return an empty object
        try {
          return JSON.parse(responseText);
        } catch (e) {
          return {};
        }
      } catch (error) {
        console.error('Error removing genre:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Genre removed successfully' });
      refetchAnimeGenres();
      
      // Also invalidate the anime detail to update genres there
      queryClient.invalidateQueries({ queryKey: ['/api/animes', animeId] });
    },
    onError: (error: Error) => {
      console.error('Genre remove error:', error);
      toast({ 
        title: 'Failed to remove genre', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Filter out genres that are already added to the anime
  const availableGenres = genresData?.filter(genre => 
    !animeGenres?.some(ag => ag.id === genre.id)
  ) || [];
  
  const handleAddGenre = () => {
    if (!animeId || !selectedGenre) return;
    addGenreMutation.mutate({ animeId, genreId: selectedGenre });
  };
  
  const handleRemoveGenre = (genreId: string) => {
    if (!animeId) return;
    removeGenreMutation.mutate({ animeId, genreId });
  };
  
  if (!animeId) {
    return (
      <div className="bg-muted/50 p-4 rounded-md text-center text-muted-foreground">
        Save the anime first to manage genres
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium">Current Genres</h3>
        {isLoadingAnimeGenres ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : animeGenres?.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No genres added yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {animeGenres?.map(genre => (
              <div 
                key={genre.id} 
                className="flex items-center gap-1 bg-primary/10 text-primary rounded-md px-2 py-1 text-sm"
              >
                {genre.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full"
                  onClick={() => handleRemoveGenre(genre.id)}
                  disabled={removeGenreMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Add Genre</label>
          <Select
            value={selectedGenre}
            onValueChange={setSelectedGenre}
            disabled={availableGenres.length === 0 || addGenreMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a genre" />
            </SelectTrigger>
            <SelectContent>
              {availableGenres.map(genre => (
                <SelectItem key={genre.id} value={genre.id}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleAddGenre} 
          disabled={!selectedGenre || addGenreMutation.isPending}
          size="sm"
        >
          {addGenreMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

function AnimeForm({
  form,
  onSubmit,
  isPending,
  submitLabel,
  editMode = false,
}: {
  form: any;
  onSubmit: (values: AnimeFormValues) => void;
  isPending: boolean;
  submitLabel: string;
  editMode?: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Anime title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="releaseYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Year"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="episodes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Episodes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Number of episodes"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Anime description"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bannerImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner Image URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/banner.jpg"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TV">TV</SelectItem>
                    <SelectItem value="Movie">Movie</SelectItem>
                    <SelectItem value="OVA">OVA</SelectItem>
                    <SelectItem value="Special">Special</SelectItem>
                    <SelectItem value="ONA">ONA</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="8.5"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Studio (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Studio name"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Genre Management (only available in edit mode) */}
        {editMode && (
          <div className="border rounded-md p-4 mt-4">
            <h3 className="text-sm font-medium mb-3">Genre Management</h3>
            <AnimeGenreManager animeId={form.getValues().id} />
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}