"use client";
import Error from "next/error";

export default function RestPage() {
  return <Error statusCode={404} />;
}
