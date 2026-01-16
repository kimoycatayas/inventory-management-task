import { Box, Paper, Typography } from '@mui/material';

export default function DashboardCard({ title, subtitle, action, children, sx }) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 10px 24px rgba(18, 18, 18, 0.06)',
        ...sx,
      }}
    >
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            {title && (
              <Typography variant="subtitle1" color="text.primary">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ ml: 2 }}>{action}</Box>}
        </Box>
      )}
      {children}
    </Paper>
  );
}
