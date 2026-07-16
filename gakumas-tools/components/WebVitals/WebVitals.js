"use client";
import { useEffect } from "react";
import { onCLS } from "web-vitals/attribution";
import { logEvent } from "@/utils/logging";

// GA4 only keeps integers on event params, and CLS values are fractions well
// below 1. Scale by 10000 so a 0.11 CLS arrives as 1100 rather than 0.
const GA_PRECISION = 10000;

// GA4 truncates event param values at 100 characters.
const MAX_PARAM_LENGTH = 100;

export default function WebVitals() {
  useEffect(() => {
    onCLS(({ value, rating, attribution }) => {
      logEvent("web_vitals_cls", {
        value: Math.round(value * GA_PRECISION),
        rating,
        // The element the largest shift moved — the actual culprit.
        shift_target: attribution.largestShiftTarget?.slice(0, MAX_PARAM_LENGTH),
        shift_value: Math.round((attribution.largestShiftValue || 0) * GA_PRECISION),
        shift_time: Math.round(attribution.largestShiftTime || 0),
        // Distinguishes a shift during load from one after hydration.
        load_state: attribution.loadState,
        path: window.location.pathname,
      });
    });
  }, []);

  return null;
}
