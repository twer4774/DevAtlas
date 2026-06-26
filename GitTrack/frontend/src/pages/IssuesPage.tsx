import React from 'react';
import { IssueList } from '../components/issues/IssueList';
import { BannerAd } from '../components/AdSense';

export const IssuesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Banner Ad */}
        <BannerAd 
          adSlot="2468135790" 
          className="mb-6"
        />
        
        <IssueList />
      </div>
    </div>
  );
};