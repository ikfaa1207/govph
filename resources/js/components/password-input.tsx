import { Eye, EyeOff, Check, X } from 'lucide-react';
import type { ComponentProps, Ref } from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function PasswordInput({
    className,
    ref,
    onChange,
    onFocus,
    onBlur,
    showRequirements = false,
    ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
    ref?: Ref<HTMLInputElement>;
    showRequirements?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState(
        (props.value as string) || (props.defaultValue as string) || '',
    );
    const [prevValueProp, setPrevValueProp] = useState(props.value);

    const [matchValue, setMatchValue] = useState<string | null>(null);

    const isConfirmationField = !!(
        (props.id &&
            (props.id.includes('confirm') ||
                props.id.includes('confirmation'))) ||
        (props.name &&
            (props.name.includes('confirm') ||
                props.name.includes('confirmation')))
    );

    if (props.value !== prevValueProp) {
        setPrevValueProp(props.value);

        if (props.value !== undefined) {
            setValue(props.value as string);
        }
    }

    useEffect(() => {
        if (!isConfirmationField) {
            return;
        }

        const findPasswordInput = () => {
            const mainInput = document.querySelector(
                'input[name="password"]:not([id*="confirm"]):not([name*="confirm"]):not([placeholder*="Confirm"]), ' +
                    'input[id="password"]:not([id*="confirm"]):not([name*="confirm"]):not([placeholder*="Confirm"]), ' +
                    'input[name="new_password"]:not([id*="confirm"]):not([name*="confirm"]):not([placeholder*="Confirm"]), ' +
                    'input[id="new_password"]:not([id*="confirm"]):not([name*="confirm"]):not([placeholder*="Confirm"])',
            ) as HTMLInputElement;

            if (mainInput) {
                setMatchValue(mainInput.value);
            }
        };

        const handleInput = () => {
            findPasswordInput();
        };

        findPasswordInput();
        document.addEventListener('input', handleInput);

        return () => {
            document.removeEventListener('input', handleInput);
        };
    }, [isConfirmationField]);

    const isMatching = value === matchValue && value !== '';

    const requirements = isConfirmationField
        ? [{ label: 'Passwords must match', checked: isMatching }]
        : [
              { label: 'Minimum 12 characters', checked: value.length >= 12 },
              {
                  label: 'At least one uppercase letter (A-Z)',
                  checked: /[A-Z]/.test(value),
              },
              {
                  label: 'At least one lowercase letter (a-z)',
                  checked: /[a-z]/.test(value),
              },
              {
                  label: 'At least one number (0-9)',
                  checked: /[0-9]/.test(value),
              },
              {
                  label: 'At least one special character (!@#$%^&*, etc.)',
                  checked: /[^A-Za-z0-9]/.test(value),
              },
          ];

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // Use a slight timeout to allow click actions (like the eye toggle button) to complete before blurring
        setTimeout(() => {
            setIsFocused(false);
        }, 150);
        onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onChange?.(e);
    };

    return (
        <div
            className={cn(
                'w-full space-y-2',
                className?.includes('flex-1') && 'flex-1',
            )}
        >
            <div className="relative">
                <Input
                    type={showPassword ? 'text' : 'password'}
                    className={cn('pr-10', className)}
                    ref={ref}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                    }
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="size-4" />
                    ) : (
                        <Eye className="size-4" />
                    )}
                </button>
            </div>

            {showRequirements && isFocused && (
                <div className="animate-in rounded-lg border border-border bg-muted/40 p-3 text-xs shadow-xs duration-200 fade-in">
                    <p className="mb-2 font-medium text-muted-foreground">
                        Password requirements:
                    </p>
                    <ul className="space-y-1.5">
                        {requirements.map((req, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                {req.checked ? (
                                    <Check className="size-3.5 shrink-0 text-green-500" />
                                ) : (
                                    <X className="size-3.5 shrink-0 text-muted-foreground/60" />
                                )}
                                <span
                                    className={cn(
                                        'transition-colors duration-200',
                                        req.checked
                                            ? 'font-medium text-green-600 dark:text-green-400'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {req.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
