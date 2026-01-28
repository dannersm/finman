'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
  components: {
    // Improve touch targets for mobile
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Minimum touch target size
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
        },
      },
    },
    // Better mobile spacing
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '8px',
          paddingRight: '8px',
          '@media (min-width: 600px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
  },
});

export default theme;
