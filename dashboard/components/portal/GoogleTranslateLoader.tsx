"use client";

import { useEffect, useRef } from "react";
import {
  activateHindiTranslation,
  clearTranslatingFlag,
  getPortalLanguage,
  wasTranslatingBeforeReload,
} from "@/lib/googleTranslate";

interface Props {
  onReady?: () => void;
  onLoadStart?: () => void;
}

export default function GoogleTranslateLoader({ onReady, onLoadStart }: Props) {
  const onReadyRef = useRef(onReady);
  const onLoadStartRef = useRef(onLoadStart);
  onReadyRef.current = onReady;
  onLoadStartRef.current = onLoadStart;

  useEffect(() => {
    const boot = async () => {
      const lang = getPortalLanguage();
      const showOverlay = lang === "hi" || wasTranslatingBeforeReload();

      if (!showOverlay) {
        clearTranslatingFlag();
        onReadyRef.current?.();
        return;
      }

      onLoadStartRef.current?.();
      try {
        if (lang === "hi") {
          await activateHindiTranslation();
        }
      } finally {
        clearTranslatingFlag();
        onReadyRef.current?.();
      }
    };

    boot();
  }, []);

  return <div id="google_translate_host" className="hidden" aria-hidden="true" />;
}
