"use client"
import { Button } from "@/components/ui/button"
import Combobox from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

export function ModalButton({
  symbol,
  start,
}: {
  symbol: string
  start: Date
}) {
  const [date, setDate] = useState(start)
  const router = useRouter()

  const handleSaveChanges = () => {
    const formattedDate = date.toISOString()
    router.push("/" + symbol + "?start=" + formattedDate)
  }

  const disabledDays = [{ from: new Date(), to: new Date(2099, 11, 31) }]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{symbol + " " + date.toISOString()}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select replay</DialogTitle>
          {/* <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription> */}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="name" className="text-right">
              Exchange
            </Label>
            CMEGLOBEX
            {/* <ComboboxDemo value={start} /> */}
          </div>
          <div className="grid grid-cols-4 gap-4 items-center">
            <Label htmlFor="username" className="text-right">
              Instrument
            </Label>
            CL.C.0
            <Combobox value={"combobox sht"} />
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
              <PopoverContent className="p-0 w-auto">
                <Calendar
                  disabled={disabledDays}
                  mode="single"
                  selected={date}
                  onSelect={(date) => {
                    date && setDate(date), console.log("selected")
                  }}
                  initialFocus
                />
                <div className="p-3 border-t border-border">
                  <TimePickerDemo
                    setDate={(date) => {
                      date && setDate(date), console.log(date)
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
