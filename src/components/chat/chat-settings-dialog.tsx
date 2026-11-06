"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChatSettingsPanel,
  type SettingsFieldError,
} from "@/components/chat/chat-settings-panel";
import type { ChatSettings } from "@/lib/chat-settings";

type ChatSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChatSettings;
  draft: ChatSettings;
  onDraftChange: (draft: ChatSettings) => void;
  onSave: (settings: ChatSettings) => void;
  onClear: () => void;
  storageWarning: string | null;
  externalError: SettingsFieldError;
};

export function ChatSettingsDialog({
  open,
  onOpenChange,
  ...panelProps
}: ChatSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle className="sr-only">模型设置</DialogTitle>
        <DialogDescription className="sr-only">
          配置 API 地址、API Key 和模型名称
        </DialogDescription>
        <ChatSettingsPanel
          {...panelProps}
          open={true}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
