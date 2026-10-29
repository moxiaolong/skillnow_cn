import { cn } from "@/lib/utils";
import type { Skill } from "@/lib/skills";

function joinItems(items: string[], limit = 2): string {
  return items.slice(0, limit).join("；");
}

export function UseNotes({ note }: { note: Skill["note"] }) {
  const rows = [
    {
      label: "适合",
      value: joinItems(note.scenarios),
    },
    {
      label: "不适合",
      value: joinItems([...note.notFor, ...note.cautions]),
    },
    {
      label: "用法",
      value: joinItems(note.tips),
    },
  ].filter((row) => row.value.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="not-prose" aria-labelledby="use-notes-title">
      <h2
        id="use-notes-title"
        className="font-serif text-2xl tracking-tight text-ink"
      >
        使用笔记
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "rounded-xl border border-line bg-surface p-4",
              row.label === "不适合" && "border-orange/20 bg-orange-soft/30",
            )}
          >
            <p className="text-xs font-medium text-orange-strong">
              {row.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
