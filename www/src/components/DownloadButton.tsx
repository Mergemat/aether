import { headers } from "next/headers";
import { DownloadClient } from "./DownloadClient";

interface Asset {
  name: string;
  browser_download_url: string;
}

interface Release {
  assets: Asset[];
}

interface DownloadButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
}

type Platform = "mac" | "windows" | "unknown";

interface DownloadOption {
  url: string;
  label: string;
}

interface DownloadInfo {
  platform: Platform;
  options: DownloadOption[];
}

async function getDownloadInfo(): Promise<DownloadInfo> {
  const fallback: DownloadInfo = {
    platform: "unknown",
    options: [
      {
        url: "https://github.com/Mergemat/aether/releases/latest",
        label: "Download",
      },
    ],
  };

  try {
    const headersList = await headers();
    const userAgent = (headersList.get("user-agent") || "").toLowerCase();

    const response = await fetch(
      "https://api.github.com/repos/Mergemat/aether/releases/latest",
      { next: { revalidate: 3600 } },
    );
    const data: Release = await response.json();
    const assets = data.assets || [];

    if (userAgent.includes("mac")) {
      const armAsset = assets.find(
        (a) => a.name.endsWith(".dmg") && a.name.includes("arm64"),
      );
      const intelAsset = assets.find(
        (a) =>
          a.name.endsWith(".dmg") &&
          !a.name.includes("arm64") &&
          !a.name.endsWith(".blockmap"),
      );

      const options: DownloadOption[] = [];
      if (armAsset) {
        options.push({
          url: armAsset.browser_download_url,
          label: "Apple Silicon",
        });
      }
      if (intelAsset) {
        options.push({
          url: intelAsset.browser_download_url,
          label: "Intel",
        });
      }

      if (options.length > 0) {
        return { platform: "mac", options };
      }
    } else if (userAgent.includes("win")) {
      const winAsset = assets.find(
        (a) => a.name.endsWith(".exe") && !a.name.endsWith(".blockmap"),
      );

      if (winAsset) {
        return {
          platform: "windows",
          options: [{ url: winAsset.browser_download_url, label: "Windows" }],
        };
      }
    }

    return fallback;
  } catch (error) {
    console.error("Failed to fetch latest release:", error);
    return fallback;
  }
}

export async function DownloadButton({
  className,
  children,
  variant = "primary",
}: DownloadButtonProps) {
  const { platform, options } = await getDownloadInfo();

  return (
    <DownloadClient
      platformLabel={
        platform === "mac"
          ? "macOS"
          : platform === "windows"
            ? "Windows"
            : undefined
      }
      options={options}
      className={className}
      variant={variant}
    >
      {children}
    </DownloadClient>
  );
}
