import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { login, devBypass } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const result = await login(email);

    if (result.success) {
      setSuccess(true);
      setEmail('');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleDevBypass = () => {
    devBypass();
    const from = (location.state as any)?.from?.pathname || '/admin';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your authorized email to receive a magic link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Magic link sent!</p>
              <p className="text-green-600 text-sm mt-1">
                Check your email and click the link to access the admin panel.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@deportemas.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>
          )}

          {DEV_MODE && (
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center mb-2">Development Mode</p>
              <Button
                onClick={handleDevBypass}
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                🚧 Dev Bypass (Skip Auth)
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Only authorized email addresses can access the admin panel.</p>
            <p>Contact your administrator if you need access.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
