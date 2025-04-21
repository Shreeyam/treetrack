import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Input } from "./input"

interface PromptDialogProps {
  open: boolean
  title: string
  defaultValue?: string
  placeholder?: string
  onSubmit: (value?: string) => void
  onCancel: () => void
  mode?: 'prompt' | 'confirm'
  description?: string
}

export function PromptDialog({
  open,
  title,
  defaultValue = "",
  placeholder,
  onSubmit,
  onCancel,
  mode = 'prompt',
  description
}: PromptDialogProps) {
  const [value, setValue] = React.useState(defaultValue)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Reset value when dialog opens
  React.useEffect(() => {
    if (open) {
      setValue(defaultValue)
      // Focus input on next tick after dialog opens
      if (mode === 'prompt') {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
  }, [open, defaultValue, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(mode === 'prompt' ? value : undefined)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {mode === 'prompt' && (
            <div className="grid gap-4 py-4">
              <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant={mode === 'confirm' ? 'destructive' : 'default'}>
              {mode === 'confirm' ? 'Confirm' : 'OK'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}