"use client";
import { default as ErrorComponent } from "@/components/Error";

export default function Error({ retry }) {
  return <ErrorComponent onRetry={retry} />;
}
