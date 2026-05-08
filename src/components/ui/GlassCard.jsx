import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function GlassCard({ children, className, delay = 0, hoverGrow = true }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
                duration: 0.8, 
                delay: delay, 
                ease: [0, 0.71, 0.2, 1.01] 
            }}
            whileHover={hoverGrow ? { scale: 1.02, y: -5 } : {}}
            className={twMerge(
                "glass-card group relative p-8 md:p-12",
                "hover:border-white/40 dark:hover:border-white/10",
                className
            )}
        >
            {/* Corner Decorative Dots - Micro Details */}
            <div className="absolute top-4 right-4 flex gap-1 opaque-dots group-hover:scale-110 transition-transform">
                <div className="size-1 rounded-full bg-espresso/10 dark:bg-white/10"></div>
                <div className="size-1 rounded-full bg-espresso/5 dark:bg-white/5"></div>
            </div>

            {/* Glowing Border effect on hover */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}

export function GlassTag({ children, className }) {
    return (
        <div className={twMerge(
            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest glass-morphism",
            className
        )}>
            {children}
        </div>
    );
}
