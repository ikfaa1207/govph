import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
    status: number;
}

export default function ErrorPage({ status }: ErrorProps) {
    const title =
        {
            503: '503: Service Unavailable',
            500: '500: Server Error',
            404: '404: Page Not Found',
            403: '403: Forbidden',
        }[status] || 'Error';

    const description =
        {
            503: 'Sorry, we are doing some maintenance. Please check back soon.',
            500: 'Whoops, something went wrong on our servers.',
            404: 'Sorry, the page you are looking for could not be found.',
            403: 'Sorry, you do not have permission to access this resource or perform this action.',
        }[status] || 'An unexpected error occurred.';

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <Head title={title} />
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div className="mb-6 rounded-full bg-destructive/10 p-4 text-destructive">
                    <AlertTriangle className="h-12 w-12" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {title}
                </h1>
                <p className="mb-8 text-sm text-muted-foreground sm:text-base">
                    {description}
                </p>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                    <Button asChild className="gap-2">
                        <Link href="/dashboard">
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
