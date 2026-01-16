import Link from "next/link";
import { useRouter } from "next/router";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Divider,
  Tooltip,
  useTheme,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import WarningIcon from "@mui/icons-material/Warning";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "@/context/ThemeModeContext";
import Logo from "@/components/Logo";

const navItems = [
  { label: "Home", href: "/", icon: <HomeIcon fontSize="small" /> },
  {
    label: "Products",
    href: "/products",
    icon: <InventoryIcon fontSize="small" />,
  },
  {
    label: "Warehouses",
    href: "/warehouses",
    icon: <WarehouseIcon fontSize="small" />,
  },
  {
    label: "Stock Levels",
    href: "/stock",
    icon: <AssessmentIcon fontSize="small" />,
  },
  {
    label: "Transfers",
    href: "/transfers",
    icon: <SwapHorizIcon fontSize="small" />,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: <WarningIcon fontSize="small" />,
  },
];

export default function SidebarNav({
  mobileOpen,
  onMobileToggle,
  collapsed,
  onCollapseToggle,
  isDesktop,
  drawerWidth,
}) {
  const router = useRouter();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";

  // Use theme-aware colors
  const sidebarBg = isDark ? "#1a1a1a" : "#141414";
  const sidebarBorder = theme.palette.divider;
  const activeBg = isDark
    ? "rgba(46, 125, 50, 0.24)"
    : "rgba(46, 125, 50, 0.18)";
  const sidebarText = isDark ? "#e0e0e0" : "#f5f5f5";
  const sidebarTextSecondary = isDark ? "#b0b0b0" : "#c7c7c7";
  const activeText = isDark ? "#8bd69b" : "#dff1e0";
  const iconColor = isDark ? "#9a9a9a" : "#9a9a9a";
  const activeIconColor = isDark ? "#8bd69b" : "#8bd69b";

  const drawerContent = (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: sidebarBg,
        color: sidebarText,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          px: 2,
          py: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: collapsed ? 1 : 0,
          }}
        >
          {collapsed ? (
            <Box
              sx={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
              <Logo collapsed={true} />
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <Logo collapsed={false} />
            </Box>
          )}
        </Box>
      </Box>
      <Divider sx={{ borderColor: sidebarBorder }} />
      <List sx={{ px: 1.5, py: 2 }}>
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive}
              aria-current={isActive ? "page" : undefined}
              onClick={!isDesktop ? onMobileToggle : undefined}
              sx={{
                mb: 1,
                borderRadius: 2,
                color: isActive ? activeText : sidebarTextSecondary,
                bgcolor: isActive ? activeBg : "transparent",
                "&:hover": {
                  bgcolor: isActive ? activeBg : theme.palette.action.hover,
                },
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1.5 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? "auto" : 36,
                  color: isActive ? activeIconColor : iconColor,
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ borderColor: sidebarBorder }} />
      <Box
        sx={{ px: 2, py: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: theme.palette.primary.main,
            fontSize: 14,
          }}
        >
          IM
        </Avatar>
        {!collapsed && (
          <Box>
            <Typography variant="body2" sx={{ color: sidebarText }}>
              Inventory Admin
            </Typography>
            <Typography variant="caption" sx={{ color: sidebarTextSecondary }}>
              Ops Team
            </Typography>
          </Box>
        )}
      </Box>
      <Divider sx={{ borderColor: sidebarBorder }} />
      <Box
        sx={{
          px: 2,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 0.5,
        }}
      >
        <Tooltip
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <IconButton
            onClick={toggleMode}
            sx={{ color: sidebarText }}
            size="small"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <IconButton
            onClick={isDesktop ? onCollapseToggle : onMobileToggle}
            sx={{ color: sidebarText }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop ? true : mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            borderRight: `1px solid ${sidebarBorder}`,
            bgcolor: sidebarBg,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
