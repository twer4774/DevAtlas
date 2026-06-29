import { ApiResponse } from '../types/api';
import { getPortalToken } from './apiClient';

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

class AttachmentService {
  private baseUrl = '/api';

  async uploadAttachments(issueId: string, files: File[]): Promise<ApiResponse<Attachment[]>> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/issues/${issueId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getPortalToken() || localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    return response.json();
  }

  async getAttachments(issueId: string): Promise<ApiResponse<Attachment[]>> {
    const response = await fetch(`${this.baseUrl}/issues/${issueId}/attachments`, {
      headers: {
        'Authorization': `Bearer ${getPortalToken() || localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch attachments');
    }

    return response.json();
  }

  async downloadAttachment(attachmentId: string, filename: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}/download`, {
      headers: {
        'Authorization': `Bearer ${getPortalToken() || localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Download failed');
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async deleteAttachment(attachmentId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getPortalToken() || localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Delete failed');
    }

    return response.json();
  }

  async getAttachmentById(attachmentId: string): Promise<ApiResponse<Attachment>> {
    const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}`, {
      headers: {
        'Authorization': `Bearer ${getPortalToken() || localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch attachment');
    }

    return response.json();
  }
}

export const attachmentService = new AttachmentService();