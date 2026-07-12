import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/favicon.png"
            alt="GIMS Logo"
            className={`${className || ''} rounded-md object-contain`}
            {...props}
        />
    );
}
