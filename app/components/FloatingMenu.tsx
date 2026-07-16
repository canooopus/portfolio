"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useMenu } from "@/context/MenuContext";

const inter = Inter({ subsets: ["latin"], weight: "400" });

export default function FloatingMenu() {
  const { isReady } = useMenu();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideAction = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideAction);
      document.addEventListener("touchstart", handleOutsideAction);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideAction);
      document.removeEventListener("touchstart", handleOutsideAction);
    };
  }, [isMenuOpen]);

  return (
    <motion.div
      ref={menuRef}
      layout
      style={{
        borderRadius: isMenuOpen ? "20px" : "9999px",
        pointerEvents: isReady ? "auto" : "none",
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{
        width: isMenuOpen ? 160 : 48,
        height: isMenuOpen ? 180 : 48,
        opacity: isReady ? 1 : 0,
        y: isReady ? 0 : 15,
      }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className={`fixed bottom-12 right-4 z-50 bg-black/50 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden flex items-center justify-center ${inter.className}`}
    >
      <AnimatePresence mode="wait">
        {isMenuOpen ? (
          <motion.div
            key="menu-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-2 flex flex-col gap-2.5 w-full h-full text-neutral-200"
          >
            <div className="flex justify-between items-center px-1.5 pt-1 shrink-0">
              <span className="pl-1.5 text-[10px] uppercase tracking-widest font-bold">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-1 cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 text-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                  <path d="M6.133 21C4.955 21 4 20.02 4 18.81v-8.802c0-.665.295-1.295.8-1.71l5.867-4.818a2.09 2.09 0 0 1 2.666 0l5.866 4.818c.506.415.801 1.045.801 1.71v8.802c0 1.21-.955 2.19-2.133 2.19z" />
                  <path d="M9.5 21v-5.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2V21" />
                </svg>
                <span>Home</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="menu-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full text-neutral-200 hover:bg-white/10 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.1" width="21" height="21">
              <path fill="currentColor" d="M7 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}