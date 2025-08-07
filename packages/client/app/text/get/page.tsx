"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const GET_TEXT_URL = process.env.NEXT_PUBLIC_BACK_END_API_URL_PREFIX;

export default function ShareText() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [text, setText] = useState("");

  const OnClickGet = () => {
    if (code === "") return;

    fetch(GET_TEXT_URL + `?code=${code}`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        setText(data.text);
      });
  };

  return (
    <div>
      <div className="p-2 flex w-full max-w-sm items-center gap-2">
        <Input
          type="text"
          placeholder="Enter code to get text"
          defaultValue={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" variant="outline" onClick={OnClickGet}>
          Get
        </Button>
      </div>
      <div className="p-2 flex w-full items-center gap-2">
        <Textarea
          placeholder="Enter code to get text in the box above, then click get to load the text..."
          className="h-32"
          value={text}
          readOnly
        />
      </div>
    </div>
  );
}
