import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

//this function merges css classes and removes duplicates, use when you don't want long className strings
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
