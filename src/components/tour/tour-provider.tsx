"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour-styles.css";
import { TOURS, pathMatches, type TourId, type TourStep } from "./tours";
import { completeOnboardingAction } from "@/lib/onboarding/actions";

type TourContextValue = {
  startTour: (tourId: TourId) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

const STORAGE_KEY = "profesori_active_tour";

type StoredState = {
  tourId: TourId;
  step: number;
  /** Cilj putanje gde tour treba da nastavi. */
  targetPath: string;
  /** Da li tour čeka navigaciju (sledeći mount će ga pokrenuti). */
  waitingForNavigation: boolean;
};

function readState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function writeState(s: StoredState | null) {
  if (typeof window === "undefined") return;
  if (s === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}

type Props = {
  onboardingCompleted: boolean;
  /** ID prvog učenika ako postoji — koristi se za reports tour da ne mora user da bira. */
  firstStudentId?: string | null;
  children: React.ReactNode;
};

export function TourProvider({
  onboardingCompleted,
  firstStudentId,
  children,
}: Props) {
  const driverRef = useRef<Driver | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const completedRef = useRef(onboardingCompleted);
  completedRef.current = onboardingCompleted;
  const firstStudentIdRef = useRef(firstStudentId);
  firstStudentIdRef.current = firstStudentId;
  /** True kad destroy-ujemo driver zbog router navigacije (NE čistiti storage). */
  const isNavigatingRef = useRef(false);

  /**
   * Materijalizuje šablon putanje — npr. `/students/[id]` → `/students/abc-123`
   * koristeći firstStudentId.
   */
  const resolvePath = useCallback((template: string): string => {
    if (template.includes("[id]") && firstStudentIdRef.current) {
      return template.replace("[id]", firstStudentIdRef.current);
    }
    return template;
  }, []);

  /** Pokreni driver od datog koraka, u datom tour-u. */
  const driveFromStep = useCallback(
    (tourId: TourId, startStep: number) => {
      const tour = TOURS[tourId];
      if (!tour) return;

      driverRef.current?.destroy();

      const steps = tour.steps;

      const d = driver({
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "Dalje →",
        prevBtnText: "← Nazad",
        doneBtnText: "Završi",
        animate: true,
        smoothScroll: true,
        stagePadding: 4,
        allowClose: true,
        steps: steps as TourStep[],
        onNextClick: (_element, step, opts) => {
          const currentIndex = opts.state.activeIndex ?? 0;
          const nextIndex = currentIndex + 1;
          const nextStep = steps[nextIndex];

          if (nextStep && nextStep.path) {
            const targetPath = resolvePath(nextStep.path);
            const onTarget = pathMatches(nextStep.path, pathname);

            if (!onTarget) {
              // Save state, destroy driver, navigate. Mount će pokrenuti driver
              // od nextIndex čim novi page bude renderovan.
              writeState({
                tourId,
                step: nextIndex,
                targetPath: nextStep.path,
                waitingForNavigation: true,
              });
              isNavigatingRef.current = true;
              driverRef.current?.destroy();
              driverRef.current = null;
              router.push(targetPath);
              return;
            }
          }
          d.moveNext();
        },
        onPrevClick: (_element, step, opts) => {
          const currentIndex = opts.state.activeIndex ?? 0;
          const prevIndex = currentIndex - 1;
          const prevStep = steps[prevIndex];
          if (prevStep && prevStep.path && !pathMatches(prevStep.path, pathname)) {
            writeState({
              tourId,
              step: prevIndex,
              targetPath: prevStep.path,
              waitingForNavigation: true,
            });
            isNavigatingRef.current = true;
            driverRef.current?.destroy();
            driverRef.current = null;
            router.push(resolvePath(prevStep.path));
            return;
          }
          d.movePrevious();
        },
        onDestroyed: () => {
          // Ako destroy-ujemo zbog navigacije, NE čistimo storage state.
          if (isNavigatingRef.current) {
            isNavigatingRef.current = false;
            return;
          }
          // User je stvarno zatvorio tour — clear state.
          writeState(null);
          if (tourId === "welcome" && !completedRef.current) {
            completeOnboardingAction().catch(() => {});
          }
        },
      });

      driverRef.current = d;
      d.drive(startStep);
    },
    [pathname, router, resolvePath],
  );

  const startTour = useCallback(
    (tourId: TourId) => {
      const tour = TOURS[tourId];
      if (!tour) return;

      // Ako profesor nije na entry path-u, navigiraj prvo
      if (!pathMatches(tour.entryPath, pathname)) {
        writeState({
          tourId,
          step: 0,
          targetPath: tour.entryPath,
          waitingForNavigation: true,
        });
        router.push(resolvePath(tour.entryPath));
        return;
      }

      driveFromStep(tourId, 0);
    },
    [pathname, router, resolvePath, driveFromStep],
  );

  // ============================================================
  // Auto-resume: na svakom mount-u proveri storage state
  // ============================================================
  useEffect(() => {
    const state = readState();
    if (!state) return;

    // Da li smo na pravoj putanji?
    if (!pathMatches(state.targetPath, pathname)) {
      return; // ne radi ništa, čeka da user navigira ili tour completion
    }

    // Sačekaj DOM da se stabilizuje pa pokreni driver od saved step-a
    const t = setTimeout(() => {
      driveFromStep(state.tourId, state.step);
    }, 500);
    return () => clearTimeout(t);
  }, [pathname, driveFromStep]);

  // Auto-start welcome tour ako profesor nije završio onboarding
  useEffect(() => {
    if (onboardingCompleted) return;
    // Ako već postoji storage state, useEffect iznad će ga pokupiti
    if (readState()) return;
    if (!pathname.startsWith("/dashboard")) return;

    const t = setTimeout(() => {
      driveFromStep("welcome", 0);
    }, 700);
    return () => clearTimeout(t);
  }, [onboardingCompleted, pathname, driveFromStep]);

  // Cleanup
  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  const value = useMemo(() => ({ startTour }), [startTour]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
