import * as React from 'react';
import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TourController from '@/actions/App/Http/Controllers/Settings/TourController';
import { User } from '@/types/auth';

interface CoachMarkProps {
    id: string;
    title: string;
    description: string;
    children: React.ReactNode;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    defaultOpen?: boolean;
}

export function CoachMark({ id, title, description, children, position = 'top-right', defaultOpen = false }: CoachMarkProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isDismissed, setIsDismissed] = useState(true); // Start hidden until client mounts to prevent hydration mismatch

    const { auth } = usePage().props as { auth?: { user?: User } };
    const userCompletedTours = auth?.user?.completed_tours || [];

    useEffect(() => {
        const dismissedInLocal = localStorage.getItem(`gims_coachmark_${id}`);
        const dismissedInDb = userCompletedTours.includes(`coachmark_${id}`);
        if (!dismissedInLocal && !dismissedInDb) {
            setIsDismissed(false);
        }
    }, [id, userCompletedTours]);

    const handleDismiss = () => {
        setIsOpen(false);
        setIsDismissed(true);
        localStorage.setItem(`gims_coachmark_${id}`, 'dismissed');

        if (auth?.user) {
            router.post(
                TourController.store().url,
                { tour_id: `coachmark_${id}` },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['auth'],
                }
            );
        }
    };

    if (isDismissed) {
        return <>{children}</>;
    }

    const positionClasses = {
        'top-right': '-top-1.5 -right-1.5',
        'top-left': '-top-1.5 -left-1.5',
        'bottom-right': '-bottom-1.5 -right-1.5',
        'bottom-left': '-bottom-1.5 -left-1.5',
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div className="relative inline-block">
                {children}
                
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "absolute flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500",
                            positionClasses[position]
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                    >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                        <Lightbulb className="h-2.5 w-2.5 text-white z-10" />
                    </button>
                </PopoverTrigger>
            </div>

            <PopoverContent 
                className="w-72 p-0 overflow-hidden shadow-lg border-indigo-100" 
                side="bottom" 
                align="end"
                onInteractOutside={() => setIsOpen(false)}
            >
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 pb-3 border-b border-indigo-100 dark:border-indigo-900/50 flex justify-between items-start gap-4">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 leading-none">{title}</h4>
                    <button 
                        onClick={handleDismiss}
                        className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-4 bg-background">
                    <p className="text-sm text-muted-foreground mb-4">
                        {description}
                    </p>
                    <div className="flex justify-end">
                        <Button 
                            size="sm" 
                            variant="default"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={handleDismiss}
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
