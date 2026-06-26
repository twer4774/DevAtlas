import React, { useEffect, useRef } from 'react';
import { useAdSense } from '../../hooks/useAdSense';

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({
  adSlot,
  adFormat = 'auto',
  style = { display: 'block' },
  className = '',
  fullWidthResponsive = true,
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const { refreshAds } = useAdSense();

  useEffect(() => {
    // 개발 환경에서는 애드센스를 로드하지 않음
    if (import.meta.env.MODE === 'development') {
      return;
    }

    // 애드센스 클라이언트 ID가 설정되지 않은 경우
    if (!import.meta.env.VITE_ADSENSE_CLIENT_ID) {
      console.warn('AdSense client ID not configured');
      return;
    }

    const timer = setTimeout(() => {
      refreshAds();
    }, 100);

    return () => clearTimeout(timer);
  }, [refreshAds]);

  // 개발 환경에서는 플레이스홀더 표시
  if (import.meta.env.MODE === 'development') {
    return (
      <div 
        className={`bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-600 ${className}`}
        style={{ minHeight: '250px', ...style }}
      >
        <div className="text-center">
          <div className="text-sm font-medium">AdSense 광고 영역</div>
          <div className="text-xs mt-1">개발 환경에서는 표시되지 않습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
};

export default AdSenseAd;