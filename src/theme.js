import { createSystem, defaultConfig, getToken } from '@chakra-ui/react';

const customConfig = {
  ...defaultConfig,
  theme: {
    tokens: {
      ...defaultConfig.theme.tokens,
      fonts: {
        ...defaultConfig.theme.tokens.fonts,
        heading: { value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` },
        body: { value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` },
      },
    },
  },
  globalCss: {
    body: {
      bg: { base: '#0a0a0a', _light: '#fafafa' },
      color: { base: '#e0e0e0', _light: '#1a1a1a' },
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    },
  },
};

const system = createSystem(customConfig);

export default system;

