import React from 'react';
import { BannerAd, SidebarAd, InArticleAd } from './index';

const AdSenseDemo: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">AdSense 광고 데모</h1>
      
      {/* 상단 배너 광고 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">상단 배너 광고</h2>
        <BannerAd 
          adSlot="1234567890" 
          className="border border-gray-300 rounded-lg p-2"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 메인 콘텐츠 영역 */}
        <div className="lg:col-span-3">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">메인 콘텐츠</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
                여기는 메인 콘텐츠 영역입니다. 실제 애플리케이션에서는 이슈 목록, 
                상세 정보, 대시보드 등의 콘텐츠가 표시됩니다.
              </p>
              <p className="mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </section>

          {/* 콘텐츠 중간 광고 */}
          <InArticleAd 
            adSlot="0987654321"
            className="border border-gray-300 rounded-lg p-2"
          />

          <section>
            <h3 className="text-lg font-medium mb-4">추가 콘텐츠</h3>
            <p className="mb-4">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco 
              laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </section>
        </div>

        {/* 사이드바 광고 */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">사이드바 광고</h2>
          <SidebarAd 
            adSlot="1122334455"
            className="border border-gray-300 rounded-lg p-2"
          />
        </div>
      </div>

      {/* 하단 배너 광고 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">하단 배너 광고</h2>
        <BannerAd 
          adSlot="5544332211"
          className="border border-gray-300 rounded-lg p-2"
        />
      </section>
    </div>
  );
};

export default AdSenseDemo;