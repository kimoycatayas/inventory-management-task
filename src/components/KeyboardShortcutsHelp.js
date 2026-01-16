import { useState, useEffect } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardIcon from '@mui/icons-material/Keyboard';

const SHORTCUTS = [
  { keys: ['/'], description: 'Focus search' },
  { keys: ['g', 'h'], description: 'Go to Home' },
  { keys: ['g', 'p'], description: 'Go to Products' },
  { keys: ['g', 'w'], description: 'Go to Warehouses' },
  { keys: ['g', 't'], description: 'Go to Transfers' },
  { keys: ['Esc'], description: 'Close / blur' },
  { keys: ['?'], description: 'Show shortcuts' },
];

/**
 * Keycap component for displaying keyboard shortcuts
 */
function Keycap({ children, ...props }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Chip
      label={children}
      size="small"
      sx={{
        height: 24,
        minWidth: 24,
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: 'monospace',
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
        color: isDark ? '#f5f5f5' : '#1b1b1b',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)'}`,
        borderRadius: 1,
        '& .MuiChip-label': {
          px: 1,
        },
      }}
      {...props}
    />
  );
}

/**
 * Floating keyboard shortcuts help component
 * Shows a floating button that opens a modal with available shortcuts
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controlled open state
 * @param {Function} props.onOpen - Callback when opening
 * @param {Function} props.onClose - Callback when closing
 */
export default function KeyboardShortcutsHelp({ open: controlledOpen, onOpen, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const theme = useTheme();
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  // Load preference from localStorage (only for uncontrolled mode)
  useEffect(() => {
    if (!isControlled) {
      const saved = localStorage.getItem('keyboard-shortcuts-help-open');
      if (saved === 'true') {
        setInternalOpen(true);
      }
    }
  }, [isControlled]);

  // Save preference to localStorage (only for uncontrolled mode)
  useEffect(() => {
    if (!isControlled) {
      localStorage.setItem('keyboard-shortcuts-help-open', internalOpen.toString());
    }
  }, [internalOpen, isControlled]);

  const handleOpen = () => {
    if (isControlled) {
      onOpen?.();
    } else {
      setInternalOpen(true);
    }
  };

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="Show keyboard shortcuts help"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
            : '0 8px 24px rgba(18, 18, 18, 0.12)',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 32px rgba(0, 0, 0, 0.5)'
              : '0 12px 32px rgba(18, 18, 18, 0.16)',
          },
        }}
        size="small"
      >
        <KeyboardIcon />
      </Fab>

      {/* Shortcuts Modal */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="keyboard-shortcuts-title"
        aria-describedby="keyboard-shortcuts-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Typography variant="h6" component="h2" id="keyboard-shortcuts-title" sx={{ fontWeight: 600 }}>
            Keyboard shortcuts
          </Typography>
          <IconButton
            aria-label="Close keyboard shortcuts dialog"
            onClick={handleClose}
            size="small"
            sx={{
              color: 'text.secondary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3, pb: 3 }} id="keyboard-shortcuts-description">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SHORTCUTS.map((shortcut, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  {shortcut.keys.map((key, keyIndex) => (
                    <Box key={keyIndex} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Keycap>{key}</Keycap>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mx: 0.5, fontFamily: 'monospace' }}
                        >
                          +
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
                  {shortcut.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

