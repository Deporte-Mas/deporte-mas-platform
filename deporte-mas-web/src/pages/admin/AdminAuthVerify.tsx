import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AdminAuthVerify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const { verifyToken } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    handleVerification(token);
  }, [searchParams]);

  const handleVerification = async (token: string) => {
    const result = await verifyToken(token);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);

      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        const returnUrl = (location.state as any)?.returnUrl || '/admin';
        navigate(returnUrl, { replace: true });
      }, 2000);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {status === 'verifying' && (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            {status === 'verifying' && 'Verifying...'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'verifying' && 'Please wait while we verify your magic link'}
            {status === 'success' && 'Redirecting to admin panel...'}
            {status === 'error' && 'Unable to verify your magic link'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="text-center">
              <p className="text-gray-600">Authenticating your session...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800">{message}</p>
              <p className="text-green-600 text-sm mt-2">
                You will be redirected shortly.
              </p>
            </div>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-800">{message}</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Magic links expire after 10 minutes.
                </p>
                <Button
                  onClick={() => navigate('/admin/auth/login')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthVerify;
