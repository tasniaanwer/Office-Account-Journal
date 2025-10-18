"use client"

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, CreditCard, Loader2 } from 'lucide-react';
import { useLogout } from '@/hooks/use-logout';

export function NavUserAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { logout, isLoggingOut } = useLogout();

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="p-3">
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-3 space-y-2">
        <Button asChild className="w-full" variant="outline">
          <a href="/login">Sign In</a>
        </Button>
        <Button asChild className="w-full">
          <a href="/register">Sign Up</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-2">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src="/avatars/user.jpg" alt={session.user?.name || 'User'} />
              <AvatarFallback>
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{session.user?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {session.user?.role}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" side="top">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isLoggingOut}
            onClick={() => logout({ redirectUrl: '/login', clearAllData: true, showLoading: true, forceSessionClear: true })}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}