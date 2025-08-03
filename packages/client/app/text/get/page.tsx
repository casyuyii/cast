"use client";

import { useSearchParams } from "next/navigation";

export default function GetText() {
  const searchParams = useSearchParams();
  const text = searchParams.get("text");

  return (
    <div style={{ padding: "20px" }}>
      <h1>Get Text</h1>
      <p>This is the get text page where users can retrieve text content.</p>
      <p>{text}</p>
      <p>{process.env.NEXT_PUBLIC_BACK_END_URL}</p>
    </div>
  );
}
