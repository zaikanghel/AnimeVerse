import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Genre } from '@shared/schema';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Tag,
  FilePlus,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema for genre form
const genreFormSchema = z.object({
  name: z.string().min(1, "Genre name is required")
});

type GenreFormValues = z.infer<typeof genreFormSchema>;

export default function GenreManagement() {
  const [deleteGenreId, setDeleteGenreId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editGenreId, setEditGenreId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch all genres
  const { data: genres = [], isLoading, refetch } = useQuery<Genre[]>({
    queryKey: ['/api/genres'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: 1,
  });

  // Form for create/edit genre
  const form = useForm<GenreFormValues>({
    resolver: zodResolver(genreFormSchema),
    defaultValues: {
      name: '',
    },
  });

  // Create genre mutation
  const createGenreMutation = useMutation({
    mutationFn: async (data: GenreFormValues) => {
      const response = await apiRequest('POST', '/api/admin/genres', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      toast({
        title: 'Success',
        description: 'Genre created successfully',
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create genre: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update genre mutation
  const updateGenreMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: GenreFormValues }) => {
      const response = await apiRequest('PATCH', `/api/admin/genres/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      toast({
        title: 'Success',
        description: 'Genre updated successfully',
      });
      setEditGenreId(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update genre: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete genre mutation
  const deleteGenreMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/genres/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      toast({
        title: 'Success',
        description: 'Genre deleted successfully',
      });
      setDeleteGenreId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete genre: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (deleteGenreId !== null) {
      deleteGenreMutation.mutate(deleteGenreId);
    }
  };

  // Handle edit genre
  const handleEditGenre = (genre: Genre) => {
    form.reset({
      name: genre.name,
    });
    setEditGenreId(genre.id);
  };

  // Handle form submission
  const onSubmit = (values: GenreFormValues) => {
    if (editGenreId !== null) {
      updateGenreMutation.mutate({ id: editGenreId, data: values });
    } else {
      createGenreMutation.mutate(values);
    }
  };

  // Reset form when closing dialogs
  const handleCloseDialog = () => {
    form.reset();
    setIsCreateDialogOpen(false);
    setEditGenreId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Genre Management</h2>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FilePlus className="h-4 w-4 mr-2" />
                Add Genre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Genre</DialogTitle>
                <DialogDescription>
                  Add a new genre to the anime streaming platform.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Action, Adventure, etc." {...field} />
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
                      disabled={createGenreMutation.isPending}
                    >
                      {createGenreMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Create Genre
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="default"
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
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : genres.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Tag className="h-16 w-16 text-gray-500 mb-4" />
            <p className="text-lg text-gray-400 mb-2">No genres found</p>
            <p className="text-sm text-gray-500 mb-6">
              Add your first genre by clicking the "Add Genre" button.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableCaption>List of all genres</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {genres.map((genre) => (
                <TableRow key={genre.id}>
                  <TableCell className="font-medium">{genre.id}</TableCell>
                  <TableCell>{genre.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGenre(genre)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog
                        open={deleteGenreId === genre.id}
                        onOpenChange={(open) => !open && setDeleteGenreId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteGenreId(genre.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to delete this genre?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the
                              genre "{genre.name}" and remove it from all associated anime.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleConfirmDelete}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteGenreMutation.isPending ? (
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

      {/* Edit Genre Dialog */}
      <Dialog 
        open={editGenreId !== null} 
        onOpenChange={(open) => !open && setEditGenreId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Genre</DialogTitle>
            <DialogDescription>
              Update genre information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Genre name" {...field} />
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
                  disabled={updateGenreMutation.isPending}
                >
                  {updateGenreMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Update Genre
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}