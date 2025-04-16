import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requireAdmin = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();

  // Debug output for troubleshooting
  console.log("Protected Route Debug:", { 
    path, 
    requireAdmin, 
    user: user ? { 
      ...user, 
      isAdmin: user.isAdmin,
      isAdminType: typeof user.isAdmin
    } : null,
    isLoading 
  });

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Force isAdmin to be a boolean
  const isUserAdmin = user.isAdmin === true;
  console.log("Admin check:", { 
    isUserAdmin, 
    requireAdmin, 
    originalValue: user.isAdmin,
    type: typeof user.isAdmin,
    strictEquality: user.isAdmin === true,
    looseEquality: user.isAdmin == true
  });

  // If the route requires admin access and user is not an admin
  if (requireAdmin && !isUserAdmin) {
    return (
      <Route path={path}>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-300 mb-6">
              You don't have permission to access the admin area. 
              This area is restricted to administrators only.
            </p>
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition duration-200"
            >
              Return to Home
            </a>
          </div>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}