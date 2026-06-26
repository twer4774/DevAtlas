import React from 'react';
import AdSenseAd from './AdSenseAd';

interface SidebarAdProps {
  adSlot: string;
  className?: string;
}

const SidebarAd: React.FC<SidebarAdProps> = ({ adSlot, className = '' }) => {
  return (
    <div className={`${className}`}>
      <AdSenseAd
        adSlot={adSlot}
        adFormat="vertical"
        style={{ 
          display: 'block',
          width: '300px',
          height: '600px'
        }}
      />
    </div>
  );
};

export default SidebarAd;