import { cn } from "@/lib/utils"

export function TmsBrandLogo({
  className,
  compact = false,
  iconOnly = false,
}: {
  className?: string
  compact?: boolean
  iconOnly?: boolean
}) {
  return (
    <div
      className={cn(
        "select-none",
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "relative overflow-hidden text-slate-950 dark:text-white",
          compact ? "px-0 py-0" : "px-0 py-0"
        )}
      >
        <div className={cn("relative flex items-center", compact ? "gap-2" : "gap-2.5")}>
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-xl bg-transparent",
              compact
                ? "h-9 w-9"
                : "h-10 w-10"
            )}
          >
            <svg viewBox="0 0 48 48" className="h-full w-full">
              <defs>
                <linearGradient id="tms-logo-mark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="55%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <path
                d="M15 31V17h18"
                fill="none"
                stroke="url(#tms-logo-mark)"
                strokeWidth="3.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M25 15V9"
                fill="none"
                stroke="url(#tms-logo-mark)"
                strokeWidth="3.1"
                strokeLinecap="round"
              />
              <g className="origin-center animate-[exo-drive_2.8s_ease-in-out_infinite]">
                <path
                  d="M15 23h14.5c2.8 0 4.8 1 5.8 3.1l2.4 4.9H15V23Z"
                  fill="none"
                  stroke="url(#tms-logo-mark)"
                  strokeWidth="3.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="34.5" r="2.2" fill="#94a3b8" className="dark:fill-slate-200" />
                <circle cx="33" cy="34.5" r="2.2" fill="#94a3b8" className="dark:fill-slate-200" />
              </g>
            </svg>
          </div>
          {!iconOnly ? (
            <div className="leading-none">
              <p className={cn("font-extrabold tracking-[0.22em] text-slate-950 dark:text-white", compact ? "text-[0.98rem]" : "text-[1.1rem]")}>
                EXO
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
