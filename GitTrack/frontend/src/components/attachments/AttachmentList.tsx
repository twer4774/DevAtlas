import React, { useState } from 'react';
import { Download, Trash2, File, Image, FileText } from 'lucide-react';

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDownload: (attachmentId: string, filename: string) => void;
  onDelete: (attachmentId: string) => void;
  canDelete?: boolean;
  loading?: boolean;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onDownload,
  onDelete,
  canDelete = false,
  loading = false
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFileIcon = (mimeType: string, filename: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (mimeType.startsWith('text/') || filename.endsWith('.log')) {
      return <FileText className="w-5 h-5 text-green-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('이 첨부파일을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(attachmentId);
    try {
      await onDelete(attachmentId);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>첨부파일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        첨부파일 ({attachments.length})
      </h4>
      
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(attachment.mimeType, attachment.filename)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.filename}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatFileSize(attachment.fileSize)}</span>
                <span>•</span>
                <span>{formatDate(attachment.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-3">
            {/* Download Button */}
            <button
              onClick={() => onDownload(attachment.id, attachment.filename)}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-white"
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Delete Button */}
            {canDelete && (
              <button
                onClick={() => handleDelete(attachment.id)}
                disabled={deletingId === attachment.id}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-white disabled:opacity-50"
                title="삭제"
              >
                {deletingId === attachment.id ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};