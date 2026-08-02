"use client";

import { motion } from "motion/react";
import { Bot, LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  initialText?: string;
  Icon?: LucideIcon;
  className?: string;
}

export function RobotTypingAnimation({ 
  initialText = "const optimize = (resume) => { ... };", 
  Icon = Bot,
  className = "" 
}: Props) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < initialText.length) {
        setDisplayedText(initialText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [initialText]);

  return (
    <div className={`flex items-center gap-3 bg-zinc-900/80 border border-emerald-900/30 p-4 rounded-2xl shadow-2xl backdrop-blur-sm ${className}`}>
      <motion.div
        animate={{ 
            y: [0, -8, 0],
            rotate: [0, -5, 5, 0] 
        }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <Icon className="w-10 h-10 text-emerald-400" />
      </motion.div>
      <div className="font-mono text-sm text-emerald-300">
        <span>{displayedText}</span>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-5 bg-emerald-500 ml-1 align-middle"
        />
      </div>
    </div>
  );
}
