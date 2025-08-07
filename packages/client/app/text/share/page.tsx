import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ShareText() {
  return (
    <div className="p-4 flex flex-col items-end justify-center gap-2">
      <Textarea className="h-32" placeholder="Enter text to share" />
      <Button type="submit" variant="outline">
        Submit
      </Button>
    </div>
  );
}
