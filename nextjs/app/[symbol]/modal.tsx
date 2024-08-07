"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { TimePickerDemo } from "./time-picker-demo"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { InstrumentBox } from "./instrumentBox"

export function ModalButton({
  symbol,
  start,
  setCurrentSocketState,
}: {
  symbol: string
  start: Date
  setCurrentSocketState: (state: boolean) => void
}) {
  const [date, setDate] = useState(start)
  const [month, setMonth] = useState<Date>(start)
  const [instrumentValue, setInstrumentValue] = useState(symbol)

  const router = useRouter()

  const handleSaveChanges = () => {
    const formattedDate = date.toISOString()
    const params = new URLSearchParams({ start: formattedDate })
    const url = `/${instrumentValue}?${params.toString()}`
    router.push(url)
    setCurrentSocketState(false)
    setTimeout(() => {
      setCurrentSocketState(true)
    }, 1000)
  }

  const disabledDays = [{ from: new Date(), to: new Date(2099, 11, 31) }]

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Preserve the time from the current date
      newDate.setHours(date.getHours())
      newDate.setMinutes(date.getMinutes())
      newDate.setSeconds(date.getSeconds())
      setDate(newDate)
      setMonth(newDate)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{symbol + " " + date.toISOString()}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select replay</DialogTitle>
          {/* <DialogDescription> Element removed </DialogDescription> */}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="name" className="">
              Exchange
            </Label>
            CMEGLOBEX
          </div>
          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="username" className="">
              Instrument
            </Label>

            <InstrumentBox
              instrumentValue={instrumentValue}
              setInstrumentValue={setInstrumentValue}
            />
          </div>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 w-4 h-4" />
                  {date ? (
                    format(date, "PPP HH:mm:ss")
                  ) : (
                    <span>Select Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-auto mt-4">
                <Calendar
                  disabled={disabledDays}
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  month={month}
                  onMonthChange={setMonth}
                />
                <div className="p-3 border-t border-border">
                  <TimePickerDemo
                    setDate={(date) => {
                      date && setDate(date)
                    }}
                    date={date}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" onClick={handleSaveChanges}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalButton