import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { AttachmentList } from './AttachmentList';
import { attachmentService } from '../../services/attachmentService';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface AttachmentManagerProps {
  issueId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  issueId,
  canUpload = true,
  canDelete = false
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load attachments on component mount
  useEffect(() => {
    loadAttachments();
  }, [issueId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attachmentService.getAttachments(issueId);
      setAttachments(response.data || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setError('첨부파일을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await attachmentService.uploadAttachments(issueId, files);
      
      if (response.success) {
        setSuccess(`${files.length}개의 파일이 성공적으로 업로드되었습니다.`);
        await loadAttachments(); // Reload attachments
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error?.message || '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId: string, filename: string) => {
    try {
      setError(null);
      await attachmentService.downloadAttachment(attachmentId, filename);
    } catch (err: any) {
      console.error('Download failed:', err);
      setError(err.response?.data?.error?.message || '파일 다운로드에 실패했습니다.');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      setError(null);
      const response = await attachmentService.deleteAttachment(attachmentId);
      
      if (response.success) {
        setSuccess('첨부파일이 삭제되었습니다.');
        await loadAttachments(); // Reload attachments
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.error?.message || '파일 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {canUpload && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            파일 첨부
          </h3>
          
          <FileUpload
            onFilesSelected={handleFilesSelected}
            disabled={uploading}
            maxFiles={5}
            maxFileSize={10}
          />

          {uploading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">파일을 업로드하는 중...</span>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Attachments List */}
      <div>
        <AttachmentList
          attachments={attachments}
          onDownload={handleDownload}
          onDelete={handleDelete}
          canDelete={canDelete}
          loading={loading}
        />
      </div>
    </div>
  );
};