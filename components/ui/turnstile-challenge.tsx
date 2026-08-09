"use client";

import Script from "next/script";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TurnstileOptions = {
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  language: string;
  sitekey: string;
  theme: "auto";
};

type TurnstileApi = {
  remove?: (widgetId: string) => void;
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileChallengeHandle = {
  reset: () => void;
};

type TurnstileChallengeProps = {
  onError?: () => void;
  onTokenChange: (token: string | null) => void;
};

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const TurnstileChallenge = forwardRef<
  TurnstileChallengeHandle,
  TurnstileChallengeProps
>(function TurnstileChallenge({ onError, onTokenChange }, ref) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);
  const onTokenChangeRef = useRef(onTokenChange);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    onErrorRef.current = onError;
    onTokenChangeRef.current = onTokenChange;
  }, [onError, onTokenChange]);

  const reset = useCallback(() => {
    const widgetId = widgetIdRef.current;

    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }

    setHasError(false);
    onTokenChangeRef.current(null);
  }, []);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;

    if (!container || !siteKey || !turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = turnstile.render(container, {
      callback: (token) => onTokenChangeRef.current(token),
      "error-callback": () => {
        setHasError(true);
        onTokenChangeRef.current(null);
        onErrorRef.current?.();
      },
      "expired-callback": () => {
        onTokenChangeRef.current(null);
        reset();
      },
      language: "pt-br",
      sitekey: siteKey,
      theme: "auto",
    });
  }, [reset]);

  useEffect(() => {
    if (!siteKey || (!isScriptReady && !window.turnstile)) {
      return;
    }

    renderWidget();

    return () => {
      const widgetId = widgetIdRef.current;

      if (widgetId) {
        window.turnstile?.remove?.(widgetId);
        widgetIdRef.current = null;
      }
    };
  }, [isScriptReady, renderWidget]);

  if (!siteKey) {
    return (
      <p className="text-sm text-red-700 dark:text-red-300" role="status">
        A proteção de segurança não está configurada. Tente novamente mais tarde.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-center" ref={containerRef}>
        <Script
          async
          defer
          id="cloudflare-turnstile"
          onError={() => {
            setHasError(true);
            onErrorRef.current?.();
          }}
          onReady={() => setIsScriptReady(true)}
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      </div>
      {hasError ? (
        <button
          className="mx-auto flex cursor-pointer text-sm font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
          onClick={reset}
          type="button"
        >
          Atualizar validação de segurança
        </button>
      ) : null}
    </div>
  );
});
