import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#1a1a1a',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#0a0a0a' : '#fafafa',
        color: props.colorMode === 'dark' ? '#e0e0e0' : '#1a1a1a',
        fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: '6px',
        transition: 'all 0.2s',
      },
      variants: {
        outline: {
          borderWidth: '1px',
          _hover: {
            transform: 'none',
          },
        },
        ghost: {
          _hover: {
            transform: 'none',
          },
        },
      },
    },
  },
});

export default theme;

