import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';

import 'react-day-picker/dist/style.css';

export type DateRangeValue = DateRange | undefined;

interface DateRangePickerProps {
    value?: DateRangeValue;
    onChange: (range: DateRangeValue) => void;
    onClear?: () => void;
}

const formatRangeLabel = (range?: DateRangeValue) => {
    if (!range?.from || !range?.to) {
        return 'Select dates';
    }

    const from = format(range.from, 'MMM d, yyyy');
    const to = format(range.to, 'MMM d, yyyy');

    return `${from} → ${to}`;
};

const normaliseRange = (range?: DateRangeValue): DateRangeValue => {
    if (!range?.from || !range?.to) {
        return range;
    }

    const from = range.from;
    const to = range.to;

    if (from.getTime() <= to.getTime()) {
        return range;
    }

    return { from: to, to: from };
};

export function DateRangePicker({ value, onChange, onClear }: DateRangePickerProps) {
    const [localRange, setLocalRange] = useState<DateRangeValue>(normaliseRange(value));
    const [open, setOpen] = useState(false);

    const label = useMemo(() => formatRangeLabel(localRange), [localRange]);

    useEffect(() => {
        setLocalRange(normaliseRange(value));
    }, [value?.from?.getTime?.(), value?.to?.getTime?.()]);

    const handleApply = () => {
        const normalised = normaliseRange(localRange);
        setLocalRange(normalised);
        onChange(normalised);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2">
                    {label}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <DayPicker
                    mode="range"
                    selected={localRange}
                    onSelect={(range) => setLocalRange(normaliseRange(range))}
                    numberOfMonths={2}
                    showOutsideDays
                    weekStartsOn={1}
                />
                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setLocalRange(undefined);
                            onClear?.();
                            onChange(undefined);
                            setOpen(false);
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        type="button"
                        onClick={handleApply}
                        disabled={!localRange?.from || !localRange?.to}
                    >
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
