import { createTheme } from '@mui/material/styles';

/**
 * Get MUI theme based on mode ('light' | 'dark')
 * @param {string} mode - Theme mode: 'light' or 'dark'
 * @returns {object} MUI theme object
 */
export const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2e7d32',
        light: '#60ad5e',
        dark: '#1b5e20',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#558b2f',
        light: '#85bb5c',
        dark: '#255d00',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#121212' : '#f6f5ef',
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f5f5f5' : '#1b1b1b',
        secondary: isDark ? '#b0b0b0' : '#5b5b5b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(27, 27, 27, 0.08)',
      action: {
        hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      },
      success: {
        main: '#4caf50',
        light: '#81c784',
        dark: '#388e3c',
      },
      warning: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00',
      },
      error: {
        main: '#f44336',
        light: '#e57373',
        dark: '#d32f2f',
      },
      info: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(18, 18, 18, 0.06)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.12)'
              : '1px solid rgba(18, 18, 18, 0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(18, 18, 18, 0.06)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.12)'
              : '1px solid rgba(18, 18, 18, 0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 16px',
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.12)'
              : '1px solid rgba(18, 18, 18, 0.08)',
            borderRadius: 10,
            overflow: 'hidden',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            border: 'none',
            borderRadius: 0,
            padding: '6px 14px',
            color: isDark ? '#b0b0b0' : '#1b1b1b',
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(46, 125, 50, 0.24)' : 'rgba(46, 125, 50, 0.14)',
              color: isDark ? '#8bd69b' : '#1b5e20',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(46, 125, 50, 0.32)' : 'rgba(46, 125, 50, 0.18)',
              },
            },
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            color: isDark ? '#f5f5f5' : '#1b1b1b',
          },
        },
      },
    },
  });
};

// Export default light theme for backward compatibility
export const theme = getTheme('light');
