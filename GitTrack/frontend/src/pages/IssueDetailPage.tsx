import React from 'react';
import { IssueDetail } from '../components/issues/IssueDetail';
import { BannerAd, SidebarAd } from '../components/AdSense';

export const IssueDetailPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Banner Ad */}
        <BannerAd 
          adSlot="3691470258" 
          className="mb-6"
        />
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3">
            <IssueDetail />
          </div>
          
          {/* Sidebar with Ad */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <SidebarAd 
                adSlot="7410852963"
                className="mb-6"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};