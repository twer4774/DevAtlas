import React, { useState, useEffect } from 'react';
import { statusHistoryService, StatusHistoryItem } from '../../services/statusHistoryService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface StatusHistoryProps {
  issueId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StatusHistory: React.FC<StatusHistoryProps> = ({
  issueId,
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && issueId) {
      loadStatusHistory();
    }
  }, [isOpen, issueId]);

  const loadStatusHistory = async () => {
    setLoading(true);
    try {
      const response = await statusHistoryService.getIssueStatusHistory(issueId);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load status history:', error);
      toast.error('Failed to load status history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Status Change History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No status changes recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Timeline line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {statusHistoryService.getChangeTypeIcon(item.changeType)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {item.changer.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {statusHistoryService.getChangeTypeDescription(item.changeType)}
                        </span>
                        {item.githubSync && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                            </svg>
                            GitHub
                          </span>
                        )}
                      </div>

                      {/* Status change */}
                      <div className="flex items-center space-x-2 mb-2">
                        {item.fromStatus ? (
                          <>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusHistoryService.getStatusColor(item.fromStatus)}`}>
                              {statusHistoryService.getStatusDisplayName(item.fromStatus)}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Created as</span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusHistoryService.getStatusColor(item.toStatus)}`}>
                          {statusHistoryService.getStatusDisplayName(item.toStatus)}
                        </span>
                      </div>

                      {/* Reason */}
                      {item.reason && (
                        <p className="text-sm text-gray-600 mb-2">
                          {item.reason}
                        </p>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};