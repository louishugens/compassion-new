"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface DatePickerProps {
  label: string
  value: string // ISO date string (YYYY-MM-DD) or empty string
  onChange: (value: string) => void
  description?: string
  id?: string
  maxDate?: Date // Maximum selectable date
  minDate?: Date // Minimum selectable date
}

export function DatePicker({
  label,
  value,
  onChange,
  description,
  id,
  maxDate,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse the value into a Date object
  const date = React.useMemo(() => {
    if (!value) return undefined
    const parsed = new Date(value)
    if (isNaN(parsed.getTime())) return undefined
    return parsed
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange("")
      setOpen(false)
      return
    }
    
    // Format as YYYY-MM-DD
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    
    onChange(`${year}-${month}-${day}`)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="px-1">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="w-full justify-between font-normal"
          >
            {date ? format(date, "dd/MM/yyyy", { locale: fr }) : "Sélectionner une date"}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (maxDate) {
                const dateToCheck = new Date(date)
                dateToCheck.setHours(0, 0, 0, 0)
                const maxToCheck = new Date(maxDate)
                maxToCheck.setHours(0, 0, 0, 0)
                if (dateToCheck > maxToCheck) return true
              }
              if (minDate) {
                const dateToCheck = new Date(date)
                dateToCheck.setHours(0, 0, 0, 0)
                const minToCheck = new Date(minDate)
                minToCheck.setHours(0, 0, 0, 0)
                if (dateToCheck < minToCheck) return true
              }
              return false
            }}
          />
        </PopoverContent>
      </Popover>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

