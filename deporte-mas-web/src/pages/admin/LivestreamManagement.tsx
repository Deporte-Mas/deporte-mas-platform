import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchStreams, type Stream } from '@/lib/admin-api';
import { Radio, Plus, Circle, CheckCircle, Clock, Archive } from 'lucide-react';

const LivestreamManagement: React.FC = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      const data = await fetchStreams();
      setStreams(data);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-red-100 text-red-800">
            <Circle className="w-3 h-3 mr-1 fill-current animate-pulse" />
            Live
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'ended':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ended
          </Badge>
        );
      case 'archived':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Livestream Management</h2>
          <p className="text-gray-500 mt-1">
            Schedule and manage livestreams ({streams.length} total)
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Stream
        </Button>
      </div>

      {/* Streams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {streams.map((stream) => (
          <Card key={stream.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">{stream.title}</CardTitle>
                {getStatusBadge(stream.status)}
              </div>
              {stream.description && (
                <CardDescription className="line-clamp-2">
                  {stream.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {stream.thumbnail_url ? (
                <img
                  src={stream.thumbnail_url}
                  alt={stream.title}
                  className="w-full h-32 object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <Radio className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {stream.scheduled_start && (
                <div className="text-sm text-gray-600">
                  <strong>Scheduled:</strong>{' '}
                  {new Date(stream.scheduled_start).toLocaleString('en-US')}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Peak: {stream.peak_viewers} viewers</span>
                <span>Total: {stream.total_viewers}</span>
              </div>

              {stream.category && (
                <Badge variant="outline" className="w-full justify-center">
                  {stream.category}
                </Badge>
              )}

              {stream.vod_available && (
                <Badge className="w-full justify-center bg-green-100 text-green-800">
                  VOD Available
                </Badge>
              )}

              {stream.stream_key && (
                <div className="text-xs text-gray-500 font-mono">
                  Key: {stream.stream_key.slice(0, 12)}...
                </div>
              )}

              <div className="text-xs text-gray-500">
                Created: {new Date(stream.created_at).toLocaleDateString('en-US')}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  {stream.status === 'live' ? 'View' : 'Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {streams.length === 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Radio className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">No streams yet. Schedule your first livestream!</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Stream
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LivestreamManagement;
