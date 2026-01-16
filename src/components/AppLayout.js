import { useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SidebarNav from "@/components/SidebarNav";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function AppLayout({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const drawerWidth = collapsed && isDesktop ? 88 : 260;

  const handleMobileToggle = () => setMobileOpen((prev) => !prev);
  const handleCollapseToggle = () => setCollapsed((prev) => !prev);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onOpenHelp: () => setShortcutsHelpOpen(true),
    onCloseHelp: () => setShortcutsHelpOpen(false),
  });

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <SidebarNav
        mobileOpen={mobileOpen}
        onMobileToggle={handleMobileToggle}
        collapsed={collapsed}
        onCollapseToggle={handleCollapseToggle}
        isDesktop={isDesktop}
        drawerWidth={drawerWidth}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          minHeight: "100vh",
          ml: isDesktop ? `${drawerWidth}px` : 0,
          transition: "margin 0.2s ease",
        }}
      >
        <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
          <Box sx={{ maxWidth: 1240, mx: "auto" }}>{children}</Box>
        </Box>
      </Box>
      
      {/* Global keyboard shortcuts help */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpen={() => setShortcutsHelpOpen(true)}
        onClose={() => setShortcutsHelpOpen(false)}
      />
    </Box>
  );
}
