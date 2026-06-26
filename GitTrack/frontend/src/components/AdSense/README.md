# Google AdSense 통합 가이드

이 문서는 React 애플리케이션에 Google AdSense를 통합하는 방법을 설명합니다.

## 설정

### 1. 환경 변수 설정

`.env` 파일에 AdSense 클라이언트 ID를 추가하세요:

```env
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXXX
```

### 2. AdSense 계정 설정

1. [Google AdSense](https://www.google.com/adsense/)에 가입
2. 웹사이트를 추가하고 승인 받기
3. 광고 단위 생성하여 광고 슬롯 ID 획득

## 컴포넌트 사용법

### BannerAd - 배너 광고

```tsx
import { BannerAd } from '../components/AdSense';

<BannerAd 
  adSlot="1234567890" 
  className="mb-6"
/>
```

### SidebarAd - 사이드바 광고

```tsx
import { SidebarAd } from '../components/AdSense';

<SidebarAd 
  adSlot="0987654321"
  className="mb-6"
/>
```

### InArticleAd - 콘텐츠 중간 광고

```tsx
import { InArticleAd } from '../components/AdSense';

<InArticleAd 
  adSlot="1122334455"
  className="my-8"
/>
```

### AdSenseAd - 기본 광고 컴포넌트

```tsx
import { AdSenseAd } from '../components/AdSense';

<AdSenseAd
  adSlot="5544332211"
  adFormat="auto"
  style={{ 
    display: 'block',
    width: '100%',
    height: '280px'
  }}
  fullWidthResponsive={true}
/>
```

## 광고 형식

- `auto`: 자동 크기 조정
- `rectangle`: 직사각형 (300x250)
- `vertical`: 세로형 (160x600)
- `horizontal`: 가로형 (728x90)

## 개발 환경

개발 환경에서는 실제 광고 대신 플레이스홀더가 표시됩니다. 이는 개발 중 불필요한 광고 노출을 방지하기 위함입니다.

## 프로덕션 배포

1. 환경 변수에 실제 AdSense 클라이언트 ID 설정
2. `NODE_ENV=production`으로 설정
3. AdSense 정책 준수 확인

## 주의사항

- AdSense 정책을 준수해야 합니다
- 광고 클릭을 유도하는 행위는 금지됩니다
- 페이지 로드 성능에 영향을 줄 수 있으므로 적절한 위치에 배치하세요
- 모바일 반응형을 고려하여 광고를 배치하세요

## 성능 최적화

- 광고는 페이지 로드 후 비동기적으로 로드됩니다
- `useAdSense` 훅을 사용하여 광고 새로고침 제어
- Sticky 포지셔닝을 사용하여 사이드바 광고 고정

## 문제 해결

### 광고가 표시되지 않는 경우

1. 환경 변수 설정 확인
2. AdSense 계정 승인 상태 확인
3. 광고 슬롯 ID 정확성 확인
4. 브라우저 광고 차단기 비활성화

### 개발자 도구 오류

개발 환경에서는 AdSense 관련 오류가 정상적으로 발생할 수 있습니다. 프로덕션 환경에서 테스트하세요.