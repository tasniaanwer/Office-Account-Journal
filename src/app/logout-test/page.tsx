"use client";

import { useSession } from 'next-auth/react';
import { useLogout } from '@/hooks/use-logout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function LogoutTestPage() {
  const { data: session, status } = useSession();
  const { logout, isLoggingOut } = useLogout();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Logout Functionality Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the logout functionality and verify proper cleanup
          </p>
        </div>

        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {session ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              Session Status
            </CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Authentication</label>
                <Badge variant={session ? "default" : "secondary"}>
                  {session ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">User Name</label>
                <p className="text-sm">{session?.user?.name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">User Email</label>
                <p className="text-sm">{session?.user?.email || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">User Role</label>
                <p className="text-sm">{session?.user?.role || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Functions */}
        {session && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Logout Functions</CardTitle>
                <CardDescription>Test different logout scenarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    onClick={() => logout({ redirectUrl: '/register', clearAllData: true, showLoading: true, forceSessionClear: true })}
                    disabled={isLoggingOut}
                    className="w-full"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout to Registration
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => logout({ redirectUrl: '/logout-test', clearAllData: false, showLoading: true, forceSessionClear: false })}
                    disabled={isLoggingOut}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Logout (No Data Clear)"
                    )}
                  </Button>

                  <Button
                    onClick={() => logout({ redirectUrl: '/register', clearAllData: true, showLoading: false, forceSessionClear: true })}
                    disabled={isLoggingOut}
                    variant="secondary"
                    className="w-full"
                  >
                    Logout (No Loading)
                  </Button>

                  <Button
                    onClick={() => logout({ redirectUrl: '/register?message=successfully_logged_out', clearAllData: true, showLoading: true, forceSessionClear: true })}
                    disabled={isLoggingOut}
                    variant="outline"
                    className="w-full"
                  >
                    Logout with Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Browser Storage Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Browser Storage Test
                </CardTitle>
                <CardDescription>Check what data is stored in browser</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">LocalStorage Items</label>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(localStorage).length} items stored
                    </p>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono max-h-20 overflow-y-auto">
                      {Object.keys(localStorage).join(', ') || 'No localStorage items'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">SessionStorage Items</label>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(sessionStorage).length} items stored
                    </p>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono max-h-20 overflow-y-auto">
                      {Object.keys(sessionStorage).join(', ') || 'No sessionStorage items'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cookies</label>
                    <p className="text-sm text-muted-foreground">
                      {document.cookie.split(';').filter(c => c.trim()).length} cookies set
                    </p>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono max-h-20 overflow-y-auto">
                      {document.cookie || 'No cookies set'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Verify you are logged in (session status should show "Authenticated")</li>
              <li>Check the browser storage section to see what data is currently stored</li>
              <li>Click on one of the logout buttons above</li>
              <li>Verify you are redirected to the <strong>registration page</strong></li>
              <li>Check that all browser storage and cookies are cleared (for full cleanup options)</li>
              <li>Try navigating back to verify the session is properly terminated</li>
              <li>Test the keyboard shortcut: Shift + Ctrl + Q (with confirmation)</li>
              <li>Confirm the current user account is completely removed from the session</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}