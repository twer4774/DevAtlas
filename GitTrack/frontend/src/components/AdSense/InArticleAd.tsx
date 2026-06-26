import React from 'react';
import AdSenseAd from './AdSenseAd';

interface InArticleAdProps {
  adSlot: string;
  className?: string;
}

const InArticleAd: React.FC<InArticleAdProps> = ({ adSlot, className = '' }) => {
  return (
    <div className={`my-8 ${className}`}>
      <AdSenseAd
        adSlot={adSlot}
        adFormat="rectangle"
        style={{ 
          display: 'block',
          width: '100%',
          height: '280px'
        }}
        className="mx-auto"
      />
    </div>
  );
};

export default InArticleAd;