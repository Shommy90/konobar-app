"use client";

import Link from "next/link";
import Button, { type ButtonProps } from "@mui/material/Button";

type LinkButtonProps = ButtonProps<typeof Link> & { href: string };

/**
 * MUI's `<Button component={Link}>` passes the Link function itself as a
 * prop, which can't cross a Server -> Client Component boundary. Wrapping it
 * here keeps that composition entirely inside one Client Component so pages
 * that are Server Components can safely render a link-styled-as-button.
 */
export function LinkButton({ href, ...props }: LinkButtonProps) {
  return <Button component={Link} href={href} {...props} />;
}
