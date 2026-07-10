import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type DicebearStyle = 
  | 'adventurer'
  | 'adventurer-neutral'
  | 'avataaars'
  | 'avataaars-neutral'
  | 'bottts'
  | 'bottts-neutral'
  | 'fun-emoji'
  | 'identicon'
  | 'initials'
  | 'micah'
  | 'notionists'
  | 'notionists-neutral'
  | 'open-peeps'
  | 'personas'
  | 'rings'
  | 'shapes'
  | 'thumbs';

interface DicebearAvatarProps {
    seed: string;
    style?: DicebearStyle;
    className?: string;
    alt?: string;
    fallback?: React.ReactNode;
}

export function DicebearAvatar({ 
    seed, 
    style = 'notionists-neutral', 
    className, 
    alt,
    fallback
}: DicebearAvatarProps) {
    const encodedSeed = encodeURIComponent(seed);
    const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodedSeed}`;

    // For initials, we can extract the first two letters as a fallback while the image loads
    const defaultFallback = seed
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <Avatar className={cn(className)}>
            <AvatarImage src={avatarUrl} alt={alt || `${seed} avatar`} />
            <AvatarFallback>{fallback || defaultFallback}</AvatarFallback>
        </Avatar>
    );
}
