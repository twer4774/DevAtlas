import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateIssueForm } from '../components/issues/CreateIssueForm';

export const CreateIssuePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (issue: any) => {
    // Navigate to the created issue detail page
    navigate(`/issues/${issue.id}`);
  };

  const handleCancel = () => {
    // Navigate back to issues list
    navigate('/issues');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <CreateIssueForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};