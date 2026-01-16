import '@/styles/globals.css';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '@/theme';
import { ThemeModeProvider, useThemeMode } from '@/context/ThemeModeContext';
import AppLayout from '@/components/AppLayout';

function ThemedApp({ Component, pageProps }) {
  const { mode } = useThemeMode();
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </ThemeProvider>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeModeProvider>
      <ThemedApp Component={Component} pageProps={pageProps} />
    </ThemeModeProvider>
  );
}

