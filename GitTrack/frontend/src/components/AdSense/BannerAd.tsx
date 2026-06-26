import React from 'react';
import AdSenseAd from './AdSenseAd';

interface BannerAdProps {
  adSlot: string;
  className?: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ adSlot, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <AdSenseAd
        adSlot={adSlot}
        adFormat="auto"
        style={{ 
          display: 'block',
          width: '100%',
          height: 'auto'
        }}
        className="w-full"
      />
    </div>
  );
};

export default BannerAd;