import type { ReactNode } from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type PagePlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
        {children}
      </Paper>
    </Container>
  );
}
