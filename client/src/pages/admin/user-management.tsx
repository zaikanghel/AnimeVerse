import { useState, useEffect } from 'react';
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/dialog';
import { 
  Trash2, 
  Loader2, 
  RefreshCw, 
  Shield,
  ShieldAlert,
  Users,
  UserCog
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

export default function UserManagement() {
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [adminDialogUserId, setAdminDialogUserId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch all users with enhanced error handling
  const { 
    data, 
    isLoading, 
    error: fetchError,
    refetch 
  } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ 
      on401: 'returnNull',
      maxRetries: 2 // Use enhanced retry logic from our updated queryClient
    })
  });
  
  // Safely process the query result
  const users = Array.isArray(data) ? data : [];
  
  // Handle error display outside the query definition
  useEffect(() => {
    if (fetchError) {
      console.error('Failed to fetch user list:', fetchError);
      toast({
        title: 'Data Loading Error',
        description: `Could not load user list: ${fetchError.message}`,
        variant: 'destructive',
      });
    }
  }, [fetchError, toast]);

  // Toggle admin status mutation with enhanced error handling
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number, isAdmin: boolean }) => {
      try {
        // Use our enhanced apiRequest with built-in retry
        const response = await apiRequest('PATCH', `/api/admin/users/${id}/admin`, { isAdmin });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Toggle admin status for user ${id} error details:`, error);
        throw error; // Re-throw to let the mutation handler deal with it
      }
    },
    onSuccess: (data, variables) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      // Also update any other cached user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Notify the user
      toast({
        title: 'Success',
        description: `User admin status ${variables.isAdmin ? 'granted' : 'revoked'} successfully`,
      });
      
      // Close the confirm dialog
      setAdminDialogUserId(null);
    },
    onError: (error: Error) => {
      // Extract the meaningful part of the error message if possible
      const errorMessage = error.message.includes(':') 
        ? error.message.split(':').slice(1).join(':').trim()
        : error.message;
        
      toast({
        title: 'Admin Status Change Failed',
        description: `Failed to update user permissions: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation with enhanced error handling
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        // Use our enhanced apiRequest with built-in retry
        await apiRequest('DELETE', `/api/admin/users/${id}`);
        return id; // Return the ID for use in onSuccess
      } catch (error) {
        console.error(`Delete user ${id} error details:`, error);
        throw error; // Re-throw to let the mutation handler deal with it
      }
    },
    onSuccess: (deletedId) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      // Notify the user
      toast({
        title: 'Success',
        description: 'User was successfully deleted',
      });
      
      // Close the delete confirmation dialog
      setDeleteUserId(null);
    },
    onError: (error: Error) => {
      // Extract the meaningful part of the error message if possible
      const errorMessage = error.message.includes(':') 
        ? error.message.split(':').slice(1).join(':').trim()
        : error.message;
        
      toast({
        title: 'Deletion Failed',
        description: `Failed to delete user: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (deleteUserId !== null) {
      deleteUserMutation.mutate(deleteUserId);
    }
  };

  // Handle admin toggle
  const handleAdminToggle = (userId: number, currentStatus: boolean) => {
    toggleAdminMutation.mutate({ id: userId, isAdmin: !currentStatus });
  };

  const selectedUser = adminDialogUserId !== null 
    ? users.find(user => user.id === adminDialogUserId) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <div className="bg-orange-900/20 p-2 rounded-lg mr-3">
            <Users className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">User Management</h2>
            <p className="text-sm text-gray-400 mt-1">Manage registered users and permissions</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-gray-700 hover:bg-gray-800"
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
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-gray-700 rounded-lg bg-gray-800/50">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
          <p className="text-gray-400">Loading user data...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="bg-gray-700/50 p-5 rounded-full mb-4">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg text-gray-300 mb-2">No users found</p>
            <p className="text-sm text-gray-500 max-w-md text-center mb-6">
              Users will appear here once they register on the site. You can manage their permissions and account status.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-gray-700 rounded-md overflow-hidden bg-gray-800/50">
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <p className="text-sm font-medium">Total Users: <span className="text-orange-400">{users.length}</span></p>
            <p className="text-xs text-gray-400">Showing all registered accounts</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Admin Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-gray-700 hover:bg-gray-800/30">
                    <TableCell className="font-medium text-gray-400">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="text-gray-400">N/A</TableCell>
                    <TableCell className="text-gray-400">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.isAdmin || false}
                            onCheckedChange={() => setAdminDialogUserId(user.id)}
                            className="data-[state=checked]:bg-accent"
                          />
                          <span className={`text-xs font-semibold ${user.isAdmin ? 'text-accent' : 'text-gray-400'}`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog
                        open={deleteUserId === user.id}
                        onOpenChange={(open) => !open && setDeleteUserId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteUserId(user.id)}
                            className="bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-gray-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-400">
                              Delete User Account
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user{' '}
                              <strong className="text-white">{user.username}</strong> and remove all their data from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex justify-center my-4">
                            <div className="bg-red-900/20 p-4 rounded-full">
                              <Trash2 className="h-10 w-10 text-red-500" />
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-700 bg-gray-800 hover:bg-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleConfirmDelete}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteUserMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete User'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Admin users have full access to all platform management features.
            </p>
          </div>
        </div>
      )}

      {/* Admin Status Confirmation Dialog */}
      <Dialog
        open={adminDialogUserId !== null}
        onOpenChange={(open) => !open && setAdminDialogUserId(null)}
      >
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className={selectedUser?.isAdmin ? "text-red-400" : "text-accent"}>
              {selectedUser?.isAdmin
                ? 'Remove Admin Privileges'
                : 'Grant Admin Privileges'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.isAdmin
                ? `Are you sure you want to remove admin privileges from ${selectedUser?.username}?`
                : `Are you sure you want to grant admin privileges to ${selectedUser?.username}?`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className={`p-4 rounded-full ${selectedUser?.isAdmin ? 'bg-red-900/20' : 'bg-accent/10'}`}>
              {selectedUser?.isAdmin ? (
                <ShieldAlert className="h-12 w-12 text-red-500" />
              ) : (
                <UserCog className="h-12 w-12 text-accent" />
              )}
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                {selectedUser?.isAdmin 
                  ? "Admin users have full access to manage all content on the platform." 
                  : "Granting admin status will give this user full control over the platform."}
              </p>
              <p className="font-medium mt-2">
                <span className="text-white">Username: </span>
                <span className={selectedUser?.isAdmin ? "text-red-400" : "text-accent"}>
                  {selectedUser?.username}
                </span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAdminDialogUserId(null)}
              className="border-gray-700 bg-gray-800 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant={selectedUser?.isAdmin ? 'destructive' : 'default'}
              onClick={() => {
                if (selectedUser) {
                  handleAdminToggle(selectedUser.id, selectedUser.isAdmin || false);
                }
              }}
              disabled={toggleAdminMutation.isPending}
              className={selectedUser?.isAdmin 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-accent hover:bg-accent/90"}
            >
              {toggleAdminMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {selectedUser?.isAdmin ? 'Remove Admin Privileges' : 'Grant Admin Privileges'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}