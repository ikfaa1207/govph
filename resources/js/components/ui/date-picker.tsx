import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
}

export function DatePicker({ value, onChange, className, placeholder = "Pick a date", required }: DatePickerProps) {
    // If value is a standard yyyy-MM-dd, parse it safely
    let date: Date | undefined = undefined;
    if (value) {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            date = parsed;
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        if (d) {
                            onChange(format(d, 'yyyy-MM-dd'))
                        } else {
                            onChange('')
                        }
                    }}
                    initialFocus
                />
            </PopoverContent>
            {required && !date && (
                <input
                    type="text"
                    required
                    className="opacity-0 w-0 h-0 absolute pointer-events-none"
                    value=""
                    onChange={() => {}}
                    tabIndex={-1}
                />
            )}
        </Popover>
    )
}
