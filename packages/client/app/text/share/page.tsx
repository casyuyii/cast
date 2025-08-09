"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const SHARE_TEXT_API =
  process.env.NEXT_PUBLIC_BACK_END_API_URL_PREFIX + "?text=";

export default function ShareText() {
  const [text, setText] = useState("");

  const ShareText = () => {
    fetch(SHARE_TEXT_API + text, {
      method: "POST",
      body: JSON.stringify({ text: text }),
    });
  };

  return (
    <div className="p-2 flex flex-col items-end justify-center gap-2">
      <Textarea
        className="h-32"
        placeholder="Enter text to share"
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="submit" variant="outline" onClick={ShareText}>
        Submit
      </Button>
    </div>
  );
}
