/*
Author: Justin Nguyen
Last updated: 09/09/2025
Purpose: A link component used in the footer for consistent styling of footer links
*/

export default function FooterLink({ href, children }: {href: string; children: React.ReactNode}) {
    return (
        <a className="text-sm text-text-secondary hover:text-zinc-900 transition-colors" href={href}>
            {children}
        </a>
    )
}