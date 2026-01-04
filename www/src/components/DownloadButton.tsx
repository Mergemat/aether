import { cacheLife } from "next/cache";
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
  "use cache";
  cacheLife("hours");
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

  const win = assets.find(
    (a) => a.name.endsWith(".exe") && !a.name.includes("blockmap"),
  );
  const macArm = assets.find(
    (a) => a.name.endsWith(".dmg") && a.name.includes("arm64"),
  );
  const macIntel = assets.find(
    (a) => a.name.endsWith(".dmg") && !a.name.includes("arm64"),
  );

  const options: DownloadOption[] = [];
  if (macArm)
    options.push({
      url: macArm.browser_download_url,
      label: "macOS (Silicon)",
    });
  if (macIntel)
    options.push({
      url: macIntel.browser_download_url,
      label: "macOS (Intel)",
    });
  if (win) options.push({ url: win.browser_download_url, label: "Windows" });

  const head = await headers();
  const ua = (head.get("user-agent") || "").toLowerCase();
  const platformLabel = ua.includes("mac")
    ? "macOS"
    : ua.includes("win")
      ? "Windows"
      : undefined;

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
