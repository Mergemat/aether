"use client";

import { useEffect, useState } from "react";

interface Asset {
  name: string;
  browser_download_url: string;
}

interface Release {
  assets: Asset[];
  tag_name: string;
}

interface DownloadButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function DownloadButton({
  className,
  children,
  variant = "primary",
}: DownloadButtonProps) {
  const [downloadUrl, setDownloadUrl] = useState(
    "https://github.com/Mergemat/aether/releases/latest",
  );
  const [platformLabel, setPlatformLabel] = useState("");

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        const response = await fetch(
          "https://api.github.com/repos/Mergemat/aether/releases/latest",
        );
        const data: Release = await response.json();

        const userAgent = window.navigator.userAgent.toLowerCase();
        let platform = "";
        let extension = "";

        if (userAgent.includes("mac")) {
          platform = "mac";
          extension = ".dmg";
        } else if (userAgent.includes("win")) {
          platform = "win";
          extension = ".exe";
        }

        if (platform && extension) {
          const asset = data.assets.find(
            (a) =>
              a.name.endsWith(extension) &&
              !a.name.endsWith(".blockmap") &&
              // Prefer arm64 for mac if on Apple Silicon, else just get the first dmg
              (platform === "mac"
                ? userAgent.includes("arm64") || userAgent.includes("apple")
                  ? a.name.includes("arm64")
                  : !a.name.includes("arm64")
                : true),
          );

          if (asset) {
            setDownloadUrl(asset.browser_download_url);
            setPlatformLabel(platform === "mac" ? "macOS" : "Windows");
          } else {
            // Fallback to first matching extension if specific arch not found
            const fallbackAsset = data.assets.find(
              (a) =>
                a.name.endsWith(extension) && !a.name.endsWith(".blockmap"),
            );
            if (fallbackAsset) {
              setDownloadUrl(fallbackAsset.browser_download_url);
              setPlatformLabel(platform === "mac" ? "macOS" : "Windows");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch latest release:", error);
      }
    }

    fetchLatestRelease();
  }, []);

  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const variants = {
    primary:
      "h-12 bg-foreground px-8 text-sm text-background hover:bg-foreground/90 rounded-lg",
    secondary:
      "h-9 bg-primary px-4 py-2 text-sm text-primary-foreground shadow hover:bg-primary/90",
  };

  return (
    <a
      href={downloadUrl}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children ||
        (platformLabel ? `Download for ${platformLabel}` : "Download")}
    </a>
  );
}
