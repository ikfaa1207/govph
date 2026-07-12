import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from '@/components/ui/pagination';

interface PaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    className?: string;
}

export function SimplePagination({ links, className }: PaginationProps) {
    if (!links || links.length <= 3) {
        return null;
    } // Only prev, next, and 1 page means no pagination needed.

    return (
        <Pagination className={className}>
            <PaginationContent>
                {links.map((link, index) => {
                    const isPrevious = link.label.includes('Previous');
                    const isNext = link.label.includes('Next');
                    const isEllipsis = link.label === '...';

                    if (isPrevious) {
                        return (
                            <PaginationItem key={index}>
                                {link.url ? (
                                    <PaginationPrevious href={link.url} />
                                ) : (
                                    <PaginationPrevious
                                        href="#"
                                        className="pointer-events-none opacity-50"
                                    />
                                )}
                            </PaginationItem>
                        );
                    }

                    if (isNext) {
                        return (
                            <PaginationItem key={index}>
                                {link.url ? (
                                    <PaginationNext href={link.url} />
                                ) : (
                                    <PaginationNext
                                        href="#"
                                        className="pointer-events-none opacity-50"
                                    />
                                )}
                            </PaginationItem>
                        );
                    }

                    if (isEllipsis) {
                        return (
                            <PaginationItem key={index}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        );
                    }

                    return (
                        <PaginationItem key={index}>
                            <PaginationLink
                                href={link.url || '#'}
                                isActive={link.active}
                            >
                                {link.label}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}
            </PaginationContent>
        </Pagination>
    );
}
