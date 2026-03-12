export type ResourceType = 'app' | 'url';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  path: string;
  keywords?: string[];
  position?: 'left' | 'right' | 'maximized' | 'background';
}

// Keep MOCK_ARSENAL as an alias for backwards compatibility
export { CORE_ARSENAL as MOCK_ARSENAL };

export const CORE_ARSENAL: Resource[] = [
  { 
    id: 'figma', 
    name: 'Figma', 
    type: 'app', 
    path: `%LOCALAPPDATA%\\Figma\\Figma.exe`,
    keywords: ['design', 'ui', 'ux', 'dashboard', 'figma']
  },
  { 
    id: 'antigravity', 
    name: 'Antigravity IDE', 
    type: 'app', 
    path: `%LOCALAPPDATA%\\Programs\\antigravity\\Antigravity.exe`,
    keywords: ['code', 'ide', 'backend', 'frontend', 'antigravity']
  },
  { 
    id: 'nextjs_docs', 
    name: 'Next.js Docs', 
    type: 'url', 
    path: 'https://nextjs.org/docs',
    keywords: ['react', 'next', 'docs', 'frontend']
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    type: 'url',
    path: 'https://music.youtube.com',
    keywords: ['music', 'focus', 'background']
  },
];
