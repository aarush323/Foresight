import React from 'react';
import { Search, Bell, Home } from 'lucide-react';
import { Input } from "./input";
import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "./dropdown-menu";

export default function TopBar({ title, onHome }) {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Left: Home + Breadcrumb */}
            <div className="flex items-center gap-4">
                {onHome && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onHome}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Home size={18} className="mr-1.5" />
                        Home
                    </Button>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Fleet</span>
                    <span>/</span>
                    <span className="text-foreground font-medium">{title}</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search vehicles..."
                        className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background h-9 rounded-md"
                    />
                </div>

                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Bell size={20} />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-9 w-9 cursor-pointer border border-border">
                            <AvatarFallback className="bg-primary text-primary-foreground">AD</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
