import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function NavigationMenuDemo() {
  return (
    <div className="flex items-center justify-between p-4">
      <Link href="/">
        <Button variant="ghost">Home</Button>
      </Link>

      <div className="flex items-center gap-4">
        <NavigationMenu viewport={false} className="z-50">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Text</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="/text/share">Share</Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/text/get">Get</Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <Link href="https://www.notion.so/Blogs-266ca97f62d0804894b6c8c1e3bfbbc4?source=copy_link">
          <Button variant="link">About Me</Button>
        </Link>
      </div>
    </div>
  );
}
