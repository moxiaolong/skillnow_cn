"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function DownloadButton({
  url,
  fileName,
  slug,
}: {
  url: string;
  fileName: string;
  slug: string;
}) {
  return (
    <Button asChild variant="ghost" size="default">
      <a
        href={url}
        download={fileName}
        onClick={() => track("skill_download", { slug })}
      >
        <Download aria-hidden />
        下载 .md
      </a>
    </Button>
  );
}
