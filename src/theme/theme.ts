import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#1f6f54",
    },
    secondary: {
      main: "#c96f2c",
    },
  },
  shape: {
    borderRadius: 10,
  },
});
