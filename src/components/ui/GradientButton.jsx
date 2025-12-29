import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function GradientButton({ to, onClick, children, className, ...props }) {
    const baseClasses = "group relative inline-flex overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-red-600 p-[2px] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30";
    const innerClasses = "relative flex h-14 w-full items-center justify-center rounded-xl bg-transparent px-8 transition-all duration-300 group-hover:bg-white/10";
    const textClasses = "text-lg font-bold tracking-wide text-white group-hover:text-white";

    if (to) {
        return (
            <Link to={to} className={cn(baseClasses, className)} {...props}>
                <div className={innerClasses}>
                    <span className={textClasses}>
                        {children}
                    </span>
                </div>
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={cn(baseClasses, className)} {...props}>
            <div className={innerClasses}>
                <span className={textClasses}>
                    {children}
                </span>
            </div>
        </button>
    );
}
