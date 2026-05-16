"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousHtmlOverflow = "";
let previousOverflow = "";

export function useLockBodyScroll(isLocked = true) {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    if (lockCount === 0) {
      previousHtmlOverflow = document.documentElement.style.overflow;
      previousOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.documentElement.style.overflow = previousHtmlOverflow;
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [isLocked]);
}
