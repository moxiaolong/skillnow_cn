export const AI_DISCLAIMER = "内容为 AI 生成，并非真人，结果仅供参考。";

export function ChatDisclaimer() {
  return (
    <p
      role="note"
      className="border-t border-line bg-surface px-4 py-3 text-center text-xs leading-5 text-muted"
    >
      {AI_DISCLAIMER}
    </p>
  );
}
