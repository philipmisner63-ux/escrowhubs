"use client";

import { useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

const TOUR_KEY = "escrowhubs_onboarding_completed";

export function OnboardingTour() {
  const t = useTranslations("tour");

  const startTour = useCallback(async () => {
    const { driver } = await import("driver.js");
    await import("driver.js/dist/driver.css");

    const driverObj = driver({
      animate: true,
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      overlayColor: "rgba(5, 5, 16, 0.85)",
      popoverClass: "eh-tour-popover",
      nextBtnText: t("next"),
      prevBtnText: "←",
      doneBtnText: t("done"),
      onDestroyed: () => {
        localStorage.setItem(TOUR_KEY, "true");
      },
      steps: [
        {
          element: "h1",
          popover: {
            title: t("step1Title"),
            description: t("step1Body"),
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "[data-tour='connect-wallet']",
          popover: {
            title: t("step2Title"),
            description: t("step2Body"),
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "[data-tour='feature-cards']",
          popover: {
            title: t("step3Title"),
            description: t("step3Body"),
            side: "top",
            align: "center",
          },
        },
        {
          element: "[data-tour='cta-create']",
          popover: {
            title: t("step4Title"),
            description: t("step4Body"),
            side: "top",
            align: "center",
          },
        },
        {
          element: "[data-tour='stats']",
          popover: {
            title: t("step5Title"),
            description: t("step5Body"),
            side: "top",
            align: "center",
          },
        },
      ],
    });

    driverObj.drive();
  }, [t]);

  useEffect(() => {
    // Only auto-start if not completed before
    if (typeof window === "undefined") return;
    if (localStorage.getItem(TOUR_KEY)) return;

    const timer = setTimeout(() => {
      startTour();
    }, 2000);

    return () => clearTimeout(timer);
  }, [startTour]);

  return null;
}

// Exported so footer "Take a Tour" link can call it
export function resetAndStartTour() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOUR_KEY);
    window.location.reload();
  }
}
