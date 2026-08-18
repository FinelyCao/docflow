"use client"

export function StreamingText({
  text,
  isStreaming,
}: {
  text: string
  isStreaming: boolean
}) {
  return (
    <div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">
      {text}
      {isStreaming ? (
        <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-0.5 animate-pulse bg-primary align-text-bottom" />
      ) : null}
    </div>
  )
}
