"use client";

import { ChevronDown, Cpu, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DownloadOption } from "./DownloadButton";

interface DownloadClientProps {
  platformLabel?: string;
  options: DownloadOption[];
  className?: string;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
}

export function DownloadClient({
  platformLabel,
  options,
  className,
  variant = "primary",
  children,
}: DownloadClientProps) {
  const content =
    children || (platformLabel ? `Download for ${platformLabel}` : "Download");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-all gap-2 group",
          variant === "primary"
            ? "h-12 bg-foreground px-8 text-sm text-background hover:bg-foreground/90"
            : "h-9 bg-primary px-4 text-sm text-primary-foreground",
          className,
        )}
      >
        {content}
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Available Downloads</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem key={option.url} asChild>
            <a href={option.url} className="flex items-center gap-2 py-2">
              {option.label.includes("Silicon") ? (
                <AppleLogo className="h-4 w-4" />
              ) : option.label.includes("Intel") ? (
                <Cpu className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              <span className="flex-1">{option.label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 814 1000"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}
