"use client";

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

      <NavigationMenu viewport={false}>
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
    </div>
  );
}
