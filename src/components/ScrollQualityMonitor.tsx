'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}

export const ScrollQualityMonitor: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState<number>(60);
  const [cls, setCls] = useState<number>(0);
  const [jitterCount, setJitterCount] = useState<number>(0);
  const [spacerHeight, setSpacerHeight] = useState<number>(104);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);

  const frameCount = useRef(0);
  const lastTime = useRef(0);
  const lastScrollY = useRef(0);
  const lastDirection = useRef<'up' | 'down' | 'none'>('none');
  const rapidTurnaroundCount = useRef(0);
  const lastTurnaroundTime = useRef(0);

  useEffect(() => {
    lastTime.current = performance.now();
    // 1. Monitor FPS
    let animId: number;
    const calcFps = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;
      if (delta >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / delta));
        frameCount.current = 0;
        lastTime.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);

    // 2. Monitor Cumulative Layout Shift (CLS) via PerformanceObserver
    let observer: PerformanceObserver | null = null;
    try {
      if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        let cumulativeScore = 0;
        observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as ShiftEntry[]) {
            if (!entry.hadRecentInput && typeof entry.value === 'number') {
              cumulativeScore += entry.value;
              setCls(Number(cumulativeScore.toFixed(4)));
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
      }
    } catch {
      // Ignore if unsupported in environment
    }

    // 3. Monitor Spacer Height & Jitter
    const checkMetrics = () => {
      const y = window.scrollY;
      const rootStyle = getComputedStyle(document.documentElement);
      const headH = rootStyle.getPropertyValue('--td-head-h').trim();
      const numericH = parseInt(headH, 10);
      if (!isNaN(numericH)) {
        setSpacerHeight(numericH);
      }

      // Jitter detection: rapid alternating scroll directions within < 120ms
      const now = performance.now();
      const dir: 'up' | 'down' | 'none' = y > lastScrollY.current ? 'down' : y < lastScrollY.current ? 'up' : 'none';
      if (dir !== 'none' && lastDirection.current !== 'none' && dir !== lastDirection.current) {
        if (now - lastTurnaroundTime.current < 120 && Math.abs(y - lastScrollY.current) < 50) {
          rapidTurnaroundCount.current++;
          if (rapidTurnaroundCount.current > 3) {
            setJitterCount((prev) => prev + 1);
            rapidTurnaroundCount.current = 0;
          }
        }
        lastTurnaroundTime.current = now;
      }
      lastDirection.current = dir;
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', checkMetrics, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', checkMetrics);
    };
  }, []);

  // Run automated benchmark test (rapid scroll simulation across 0-160px threshold)
  const runBenchmark = async () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setBenchmarkResult(null);

    const initialY = window.scrollY;
    const startCls = cls;
    let maxJitter = 0;

    const targets = [80, 20, 120, 40, 150, 0];
    for (const target of targets) {
      window.scrollTo({ top: target, behavior: 'smooth' });
      await new Promise((r) => setTimeout(r, 450));
      if (jitterCount > maxJitter) maxJitter = jitterCount;
    }

    // Return to initial
    window.scrollTo({ top: initialY, behavior: 'smooth' });
    await new Promise((r) => setTimeout(r, 400));

    const clsDelta = cls - startCls;
    const isPassing = clsDelta < 0.05 && maxJitter === 0;

    setBenchmarkResult(
      isPassing
        ? t('sqm.benchPass', { cls: clsDelta.toFixed(3) })
        : t('sqm.benchFail', { cls: clsDelta.toFixed(3), jitter: maxJitter })
    );
    setIsBenchmarking(false);
  };

  const resetMetrics = () => {
    setCls(0);
    setJitterCount(0);
    setBenchmarkResult(null);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 z-[350] font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          title={t('sqm.openTitle')}
          className="flex items-center gap-2 rounded-none bg-slate-900/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:bg-slate-900 transition-transform active:scale-95 border border-slate-700 cursor-pointer"
        >
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Monitor: {fps} FPS</span>
          <span className="h-2 w-2 rounded-none bg-emerald-400" />
        </button>
      ) : (
        <div className="w-80 rounded-none bg-card/95 backdrop-blur-md p-4 shadow-2xl border border-rule text-ink animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-rule pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-none bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-ink">Scroll Quality Monitor</p>
                <p className="text-[10px] text-ink-2">{t('sqm.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetMetrics}
                title={t('sqm.resetTitle')}
                aria-label={t('sqm.resetAria')}
                className="grid h-6 w-6 place-items-center rounded-none hover:bg-paper text-ink-2 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label={t('sqm.closeAria')}
                className="grid h-6 w-6 place-items-center rounded-none hover:bg-paper text-ink-2 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="rounded-none bg-paper p-2.5 border border-rule/60">
              <span className="text-[10px] text-ink-2 font-semibold block">{t('sqm.fpsLabel')}</span>
              <span className={`text-lg font-mono font-extrabold ${fps >= 55 ? 'text-leaf' : fps >= 30 ? 'text-sun-ink' : 'text-berry'}`}>
                {fps} <span className="text-[10px] font-normal text-ink-2">fps</span>
              </span>
            </div>

            <div className="rounded-none bg-paper p-2.5 border border-rule/60">
              <span className="text-[10px] text-ink-2 font-semibold block">Layout Shift (CLS)</span>
              <span className={`text-lg font-mono font-extrabold ${cls === 0 ? 'text-leaf' : cls < 0.05 ? 'text-sun-ink' : 'text-berry'}`}>
                {cls.toFixed(3)}
              </span>
            </div>

            <div className="rounded-none bg-paper p-2.5 border border-rule/60">
              <span className="text-[10px] text-ink-2 font-semibold block">{t('sqm.jitterLabel')}</span>
              <span className={`text-lg font-mono font-extrabold ${jitterCount === 0 ? 'text-leaf' : 'text-berry'}`}>
                {jitterCount} <span className="text-[10px] font-normal text-ink-2">{t('sqm.jitterUnit')}</span>
              </span>
            </div>

            <div className="rounded-none bg-paper p-2.5 border border-rule/60">
              <span className="text-[10px] text-ink-2 font-semibold block">Top Spacer Height</span>
              <span className="text-lg font-mono font-extrabold text-ink">
                {spacerHeight} <span className="text-[10px] font-normal text-ink-2">{t('sqm.pxSuffix')}</span>
              </span>
            </div>
          </div>

          {/* Benchmark Action */}
          <div className="space-y-2">
            <button
              onClick={runBenchmark}
              disabled={isBenchmarking}
              className="w-full flex items-center justify-center gap-2 rounded-none bg-accent px-3 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-accent-deep transition-transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isBenchmarking ? t('sqm.benchRunning') : t('sqm.benchCta')}</span>
            </button>

            {benchmarkResult && (
              <div className="rounded-none bg-leaf-soft p-2.5 text-[11px] text-leaf font-bold flex items-start gap-1.5 border border-leaf/30">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{benchmarkResult}</span>
              </div>
            )}
          </div>

          <p className="mt-3 text-[10px] text-ink-2 text-center leading-relaxed">
            {t('sqm.footnote')}
          </p>
        </div>
      )}
    </div>
  );
};
