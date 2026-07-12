import type { ReactNode } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type SectionHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      {action}
    </Stack>
  );
}
