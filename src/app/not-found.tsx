import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="text-xs text-muted">404</p>
      <h1 className="mt-4 max-w-2xl font-serif text-4xl tracking-tight text-ink sm:text-5xl">
        这个 Skill 还没被整理进来。
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
        可能是链接写错了，或者内容还没上线。你可以回到全部 Skill 看看。
      </p>
      <Link
        href="/skills/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-orange-strong px-5 text-sm font-medium text-white transition-colors hover:bg-orange"
      >
        <ArrowLeft className="size-4" aria-hidden />
        全部 Skill
      </Link>
    </div>
  );
}
