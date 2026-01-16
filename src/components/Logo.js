import { Box } from "@mui/material";

export default function Logo({ collapsed = false }) {
  if (collapsed) {
    // Show only the icon when collapsed
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          py: 1,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="GreenSupply Co. Logo"
          sx={{
            width: 40,
            height: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            borderRadius: "50%",
          }}
        />
      </Box>
    );
  }

  // Full logo with text
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        py: 1,
      }}
    >
      <Box
        component="img"
        src="/logo.png"
        alt="GreenSupply Co. - INVENTORY MANAGEMENT FOR WAREHOUSES"
        sx={{
          width: { xs: 100, sm: 120 },
          height: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          borderRadius: "50%",
        }}
      />
    </Box>
  );
}
