"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileStack, MessageSquareText, RotateCcw } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AppHeaderProps = {
  onReset?: () => void
}

export function AppHeader({ onReset }: AppHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-[color-mix(in_oklch,var(--background),white_40%)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <FileStack className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              DocFlow
            </span>
            <span className="block text-[11px] text-muted-foreground">
              团队文档智能问答
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: pathname === "/" ? "secondary" : "ghost",
                size: "sm",
              })
            )}
          >
            <MessageSquareText data-icon="inline-start" />
            问答
          </Link>
          <Link
            href="/admin"
            className={cn(
              buttonVariants({
                variant: pathname.startsWith("/admin") ? "secondary" : "ghost",
                size: "sm",
              })
            )}
          >
            <FileStack data-icon="inline-start" />
            文档库
          </Link>
          {onReset ? (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw data-icon="inline-start" />
              新对话
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
