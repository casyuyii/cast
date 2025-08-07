import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ShareText() {
  return (
    <div className="p-4 flex w-full max-w-sm items-center gap-2">
      <Input type="text" placeholder="Enter code to get text" />
      <Button type="submit" variant="outline">
        Get
      </Button>
    </div>
  );
}
