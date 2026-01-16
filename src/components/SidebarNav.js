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
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AssessmentIcon from "@mui/icons-material/Assessment";
import MenuIcon from "@mui/icons-material/Menu";

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
  const sidebarBg = "#141414";
  const sidebarBorder = "rgba(255, 255, 255, 0.08)";
  const activeBg = "rgba(46, 125, 50, 0.18)";

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: sidebarBg,
        color: "#f5f5f5",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 2,
        }}
      >
        {!collapsed && (
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            GreenSupply Co
          </Typography>
        )}
        <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <IconButton
            onClick={isDesktop ? onCollapseToggle : onMobileToggle}
            sx={{ color: "#f5f5f5" }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
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
              sx={{
                mb: 1,
                borderRadius: 2,
                color: isActive ? "#dff1e0" : "#c7c7c7",
                bgcolor: isActive ? activeBg : "transparent",
                "&:hover": {
                  bgcolor: isActive ? activeBg : "rgba(255, 255, 255, 0.08)",
                },
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1.5 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? "auto" : 36,
                  color: isActive ? "#8bd69b" : "#9a9a9a",
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
          sx={{ width: 32, height: 32, bgcolor: "#2e7d32", fontSize: 14 }}
        >
          IM
        </Avatar>
        {!collapsed && (
          <Box>
            <Typography variant="body2" sx={{ color: "#f5f5f5" }}>
              Inventory Admin
            </Typography>
            <Typography variant="caption" sx={{ color: "#a6a6a6" }}>
              Ops Team
            </Typography>
          </Box>
        )}
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
