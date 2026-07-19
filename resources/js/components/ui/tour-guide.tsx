import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronRight, ChevronLeft, X } from 'lucide-react';

export interface TourStep {
    target: string;
    title: string;
    description: string;
}

interface TourGuideProps {
    tourId: string;
    steps: TourStep[];
}

export function TourGuide({ tourId, steps }: TourGuideProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
    const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
    const cardRef = useRef<HTMLDivElement>(null);

    // Initialize tour: check if already completed
    useEffect(() => {
        const completed = localStorage.getItem(`gims_tour_completed_${tourId}`);
        if (!completed && steps.length > 0) {
            // Delay slightly to allow layout calculations
            const timer = setTimeout(() => {
                setIsActive(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [tourId, steps]);

    // Scroll the highlighted element into view only when the step changes
    useEffect(() => {
        if (!isActive || steps.length === 0) return;
        const step = steps[currentStep];
        const element = document.querySelector(step.target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep, isActive, steps]);

    // Recalculate target positions when step or active state changes
    useEffect(() => {
        if (!isActive || steps.length === 0) return;

        let animationFrameId: number;

        const handlePositionUpdate = () => {
            animationFrameId = requestAnimationFrame(() => {
                const step = steps[currentStep];
                const element = document.querySelector(step.target);

                if (element) {
                    const rect = element.getBoundingClientRect();
                    const scrollY = window.scrollY;
                    const scrollX = window.scrollX;
                    const padding = 8;

                    const top = rect.top + scrollY - padding;
                    const left = rect.left + scrollX - padding;
                    const width = rect.width + padding * 2;
                    const height = rect.height + padding * 2;

                    setHighlightStyle({
                        position: 'absolute',
                        top: `${top}px`,
                        left: `${left}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        borderRadius: '8px',
                        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease-in-out',
                    });

                    // Calculate popover positioning
                    let cardTop = top + height + 12;
                    let cardLeft = left + width / 2 - 160; // Center popover (w-80 = 320px)

                    // Ensure popover stays within horizontal viewport
                    if (cardLeft < 16) {
                        cardLeft = 16;
                    } else if (cardLeft + 320 > window.innerWidth - 16) {
                        cardLeft = window.innerWidth - 336;
                    }

                    // If element is near bottom, position popover above it instead
                    if (rect.bottom + 250 > window.innerHeight) {
                        cardTop = top - 180;
                        if (cardTop < 16) cardTop = 16;
                    }

                    setCardStyle({
                        position: 'absolute',
                        top: `${cardTop}px`,
                        left: `${cardLeft}px`,
                        width: '320px',
                        zIndex: 10000,
                        transition: 'all 0.3s ease-in-out',
                    });
                } else {
                    // Element not found - render fallback modal in the center of the screen
                    setHighlightStyle({
                        position: 'fixed',
                        top: '0px',
                        left: '0px',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        zIndex: 9999,
                    });

                    setCardStyle({
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '320px',
                        zIndex: 10000,
                    });
                }
            });
        };

        handlePositionUpdate();
        window.addEventListener('resize', handlePositionUpdate);
        window.addEventListener('scroll', handlePositionUpdate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handlePositionUpdate);
            window.removeEventListener('scroll', handlePositionUpdate);
        };
    }, [currentStep, isActive, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        setIsActive(false);
        localStorage.setItem(`gims_tour_completed_${tourId}`, 'completed');
    };

    if (!isActive) return null;

    return createPortal(
        <>
            {/* Spotlight cut-out */}
            <div style={highlightStyle} className="pointer-events-none border border-indigo-400/40 ring-4 ring-indigo-500/20" />

            {/* Popover Card */}
            <div ref={cardRef} style={cardStyle} className="shadow-2xl">
                <Card className="border border-indigo-100 dark:border-indigo-900/50 bg-card overflow-hidden">
                    <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3 flex flex-row items-center justify-between border-b border-indigo-100/50 dark:border-indigo-900/20">
                        <div className="flex items-center gap-2">
                            <div className="rounded-md bg-indigo-500/10 p-1 text-indigo-500">
                                <Lightbulb className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                                GIMS Walkthrough
                            </CardTitle>
                        </div>
                        <button
                            onClick={handleComplete}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <h4 className="font-bold text-sm text-foreground mb-1">
                                {steps[currentStep].title}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {steps[currentStep].description}
                            </p>
                        </div>

                        {/* Footer details & controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {currentStep > 0 && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs px-2"
                                        onClick={handleBack}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                        Back
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={handleNext}
                                >
                                    {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
                                    {currentStep < steps.length - 1 && (
                                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>,
        document.body
    );
}
