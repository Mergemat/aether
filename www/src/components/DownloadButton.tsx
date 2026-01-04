import { headers } from "next/headers";
import { DownloadClient } from "./DownloadClient";

export interface Asset {
  name: string;
  browser_download_url: string;
}

export interface Release {
  assets: Asset[];
}

export interface DownloadOption {
  url: string;
  label: string;
}

export interface DownloadButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
}

async function getLatestRelease(): Promise<Release> {
  const res = await fetch(
    "https://api.github.com/repos/Mergemat/aether/releases/latest",
    { headers: { "User-Agent": "Aether-App" } },
  );
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function DownloadButton({
  className,
  children,
  variant = "primary",
}: DownloadButtonProps) {
  const data = await getLatestRelease();
  const assets = data.assets || [];

  const head = await headers();
  const ua = (head.get("user-agent") || "").toLowerCase();
  const isMac = ua.includes("mac");
  const isWin = ua.includes("win");

  const options: DownloadOption[] = [];

  if (isMac) {
    const arm = assets.find(
      (a) => a.name.endsWith(".dmg") && a.name.includes("arm64"),
    );
    const intel = assets.find(
      (a) => a.name.endsWith(".dmg") && !a.name.includes("arm64"),
    );

    if (arm)
      options.push({ url: arm.browser_download_url, label: "macOS (Silicon)" });
    if (intel)
      options.push({ url: intel.browser_download_url, label: "macOS (Intel)" });
  } else if (isWin) {
    const win = assets.find(
      (a) => a.name.endsWith(".exe") && !a.name.includes("blockmap"),
    );
    if (win) options.push({ url: win.browser_download_url, label: "Windows" });
  }

  const platformLabel = isMac ? "macOS" : isWin ? "Windows" : undefined;

  return (
    <DownloadClient
      platformLabel={platformLabel}
      options={options}
      className={className}
      variant={variant}
    >
      {children}
    </DownloadClient>
  );
}
