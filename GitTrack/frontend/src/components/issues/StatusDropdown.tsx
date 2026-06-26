import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Issue } from '../../types';
import { issueService } from '../../services/issueService';
import toast from 'react-hot-toast';

interface StatusDropdownProps {
  issue: Issue;
  onStatusChange: (updatedIssue: Issue) => void;
  canEdit: boolean;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  issue,
  onStatusChange,
  canEdit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    openUpward: false
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: 'open', label: 'Open', icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'closed', label: 'Closed', icon: XCircle, color: 'bg-gray-100 text-gray-800 border-gray-200' }
  ];

  const currentStatus = statusOptions.find(option => option.value === issue.status);

  // Calculate dropdown position to avoid clipping
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 160; // Approximate height of dropdown (4 items * 40px)
      const dropdownWidth = 160; // Width of dropdown
      
      // Calculate position
      let top = buttonRect.bottom + window.scrollY + 4; // 4px margin
      let left = buttonRect.right + window.scrollX - dropdownWidth; // Align to right edge
      let openUpward = false;
      
      // Check if there's enough space below
      const spaceBelow = viewportHeight - buttonRect.bottom;
      
      if (spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight) {
        top = buttonRect.top + window.scrollY - dropdownHeight - 4; // 4px margin
        openUpward = true;
      }
      
      // Ensure dropdown doesn't go off-screen horizontally
      if (left < 0) {
        left = buttonRect.left + window.scrollX;
      }
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 8; // 8px margin from edge
      }
      
      setDropdownPosition({ top, left, openUpward });
    }
  }, [isOpen]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === issue.status || !canEdit) return;

    setIsUpdating(true);
    setIsOpen(false);

    try {
      const response = await issueService.updateIssue(issue.id, { status: newStatus as Issue['status'] });
      
      if (response.success) {
        onStatusChange(response.data);
        toast.success(`Status updated to ${statusOptions.find(s => s.value === newStatus)?.label}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canEdit) {
    // Read-only display for users without edit permissions
    const StatusIcon = currentStatus?.icon || Clock;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${currentStatus?.color}`}>
        <StatusIcon className="w-4 h-4" />
        {currentStatus?.label || issue.status.replace('_', ' ')}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-colors hover:opacity-80 ${
          currentStatus?.color
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isUpdating ? (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {currentStatus?.icon && <currentStatus.icon className="w-4 h-4" />}
            {currentStatus?.label || issue.status.replace('_', ' ')}
            <ChevronDown className="w-3 h-3 ml-1" />
          </>
        )}
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            ref={dropdownRef}
            className="fixed w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            <div className="py-1">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = option.value === issue.status;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-gray-50 font-medium' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                    {isSelected && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};