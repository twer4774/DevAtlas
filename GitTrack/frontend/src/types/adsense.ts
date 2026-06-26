export interface AdSenseConfig {
  clientId: string;
  enabled: boolean;
}

export interface AdSlotConfig {
  id: string;
  format: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  size?: {
    width: number;
    height: number;
  };
}

export interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
}

export type AdPosition = 'header' | 'sidebar' | 'footer' | 'in-article' | 'between-content';