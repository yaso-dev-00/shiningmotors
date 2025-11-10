
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { vendorApi } from '@/integrations/supabase/modules/vendors';
import { Clock, CheckCircle, XCircle, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorRegistrationHistoryProps {
  vendorRegistrationId: string;
}

interface HistoryEntry {
  id: string;
  action_type: string;
  action_date: string;
  rejection_reason?: string;
  details?: any;
  action_by_profile?: {
    full_name?: string;
    username?: string;
  };
}

const VendorRegistrationHistory: React.FC<VendorRegistrationHistoryProps> = ({ vendorRegistrationId }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, [vendorRegistrationId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await vendorApi.getHistory(vendorRegistrationId);
      if (error) throw error;
      // Convert null to undefined for rejection_reason to match interface
      const historyData: HistoryEntry[] = (data || []).map((entry: any) => ({
        ...entry,
        rejection_reason: entry.rejection_reason ?? undefined,
      }));
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching vendor history:', error);
      toast({
        title: "Error",
        description: "Failed to load registration history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (actionType: string) => {
    switch (actionType) {
      case 'submitted':
      case 'resubmitted':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (actionType: string) => {
    switch (actionType) {
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'resubmitted':
        return <Badge variant="secondary">Resubmitted</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Registration History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No history available</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(entry.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusBadge(entry.action_type)}
                    <span className="text-sm text-gray-500">
                      {new Date(entry.action_date).toLocaleString()}
                    </span>
                  </div>
                  {entry.action_by_profile && (
                    <p className="text-sm text-gray-600">
                      By: {entry.action_by_profile.full_name || entry.action_by_profile.username}
                    </p>
                  )}
                  {entry.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Reason:</strong> {entry.rejection_reason}
                    </div>
                  )}
                  {entry.details?.updated_fields && Array.isArray(entry.details.updated_fields) && entry.details.updated_fields.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                      <strong>Updated fields:</strong> {entry.details.updated_fields.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorRegistrationHistory;
