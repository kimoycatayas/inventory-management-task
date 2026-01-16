import { createTheme } from '@mui/material/styles';

// Eco-friendly theme with warm neutrals and charcoal surfaces
export const theme = createTheme({
  palette: {
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
      default: '#f6f5ef',
      paper: '#ffffff',
    },
    text: {
      primary: '#1b1b1b',
      secondary: '#5b5b5b',
    },
    divider: 'rgba(27, 27, 27, 0.08)',
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
          boxShadow: '0 8px 24px rgba(18, 18, 18, 0.06)',
          border: '1px solid rgba(18, 18, 18, 0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 24px rgba(18, 18, 18, 0.06)',
          border: '1px solid rgba(18, 18, 18, 0.06)',
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
          backgroundColor: '#ffffff',
          border: '1px solid rgba(18, 18, 18, 0.08)',
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
          '&.Mui-selected': {
            backgroundColor: 'rgba(46, 125, 50, 0.14)',
            color: '#1b5e20',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#1b1b1b',
        },
      },
    },
  },
});
