import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Menu, User, LogOut, Film, Flame, Layout, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToggle } from '@/hooks/use-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type NavbarProps = {
  onSearchClick: () => void;
};

export default function Navbar({ onSearchClick }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen] = useToggle(false);
  const { user, logoutMutation } = useAuth();
  
  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation('/');
      }
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950 bg-opacity-90 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold font-sans text-white">Anime<span className="text-accent">Verse</span></span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <NavLink href="/" label="Home" icon={<Layout className="h-4 w-4 mr-1" />} />
              <NavLink href="/explore" label="Explore" icon={<Film className="h-4 w-4 mr-1" />} />
              <NavLink href="/genres" label="Genres" icon={<Layout className="h-4 w-4 mr-1" />} />
              <NavLink href="/recently" label="Recently Added" icon={<Flame className="h-4 w-4 mr-1" />} />
              {user && <NavLink href="/favorites" label="My Favorites" icon={<Heart className="h-4 w-4 mr-1" />} />}
              {user?.isAdmin && <NavLink href="/admin" label="Admin Panel" icon={<Shield className="h-4 w-4 mr-1" />} />}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full"
              onClick={onSearchClick}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-700 bg-gray-900 hover:bg-gray-800">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex w-full items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="flex w-full items-center gap-2 cursor-pointer">
                      <Heart className="h-4 w-4" />
                      <span>My Favorites</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="flex items-center gap-2 bg-accent hover:bg-accent/90"
                asChild
                size="sm"
              >
                <Link href="/auth">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </Button>
            )}
            
            <Button 
              variant="ghost"
              size="icon"
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={cn("md:hidden bg-gray-900 py-4 px-4 border-t border-gray-800", {
        'hidden': !isMobileMenuOpen
      })}>
        <div className="flex flex-col space-y-3">
          <MobileNavLink href="/" label="Home" icon={<Layout className="h-4 w-4 mr-2" />} onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/explore" label="Explore" icon={<Film className="h-4 w-4 mr-2" />} onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/genres" label="Genres" icon={<Layout className="h-4 w-4 mr-2" />} onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/recently" label="Recently Added" icon={<Flame className="h-4 w-4 mr-2" />} onClick={() => setMobileMenuOpen(false)} />
          {user && <MobileNavLink href="/favorites" label="My Favorites" icon={<Heart className="h-4 w-4 mr-2" />} onClick={() => setMobileMenuOpen(false)} />}
          {user?.isAdmin && <MobileNavLink href="/admin" label="Admin Panel" icon={<Shield className="h-4 w-4 mr-2" />} onClick={() => setMobileMenuOpen(false)} />}
          
          {!user && (
            <div className="pt-2 mt-2 border-t border-gray-800">
              <Button 
                className="w-full flex items-center justify-center bg-accent hover:bg-accent/90"
                asChild
              >
                <Link href="/auth">
                  <User className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

type NavLinkProps = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

function NavLink({ href, label, icon }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link 
      href={href} 
      className={cn(
        "relative flex items-center text-gray-300 hover:text-white transition duration-200 after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-[-2px] after:left-0 after:bg-accent hover:after:w-full after:transition-[width] after:duration-300", 
        {
          "text-white after:w-full": isActive
        }
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

type MobileNavLinkProps = NavLinkProps & {
  onClick?: () => void;
};

function MobileNavLink({ href, label, icon, onClick }: MobileNavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center text-gray-300 hover:text-white transition duration-200 py-2", 
        {
          "text-white": isActive
        }
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
