"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface DateTimePickerProps {
  label: string
  value: string // ISO datetime string or empty string
  onChange: (value: string) => void
  description?: string
  id?: string
  disablePastDates?: boolean
}

export function DateTimePicker({
  label,
  value,
  onChange,
  description,
  id,
  disablePastDates = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Get today's date at midnight for comparison
  const today = React.useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  
  // Parse the value into date and time components
  // Value format: "YYYY-MM-DDTHH:mm" (datetime-local format)
  const date = React.useMemo(() => {
    if (!value) return undefined
    // Parse datetime-local format (YYYY-MM-DDTHH:mm) as local time
    const [datePart, timePart] = value.split('T')
    if (!datePart || !timePart) return undefined
    
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      return undefined
    }
    
    return new Date(year, month - 1, day, hours, minutes)
  }, [value])
  
  const timeValue = date 
    ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : ""

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange("")
      setOpen(false)
      return
    }

    // If we have an existing time, preserve it; otherwise use current time
    const hours = date ? date.getHours() : new Date().getHours()
    const minutes = date ? date.getMinutes() : new Date().getMinutes()
    
    const newDate = new Date(selectedDate)
    newDate.setHours(hours, minutes, 0, 0)
    
    // Format as ISO string for datetime-local input compatibility
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    const hoursStr = String(newDate.getHours()).padStart(2, '0')
    const minutesStr = String(newDate.getMinutes()).padStart(2, '0')
    
    onChange(`${year}-${month}-${day}T${hoursStr}:${minutesStr}`)
    setOpen(false)
  }

  const handleTimeChange = (time: string) => {
    const [hours, minutes] = time ? time.split(':').map(Number) : [0, 0]
    
    if (!date) {
      // If no date selected, use today's date
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    } else {
      // Update time on existing date
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="px-1">
        {label}
      </Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={id}
              className="flex-1 justify-between font-normal"
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
              disabled={disablePastDates ? (date) => {
                const dateToCheck = new Date(date)
                dateToCheck.setHours(0, 0, 0, 0)
                return dateToCheck < today
              } : undefined}
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          step="60"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          placeholder="HH:mm"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

