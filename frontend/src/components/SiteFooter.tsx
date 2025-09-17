/*
Author: Justin Nguyen
Last updated: 09/09/2025
Purpose: Footer component for the site, includes links to social media and other relevant information
*/

import FooterLink from "./ui/FooterLink"

export default function SiteFooter() {
    return (
        <footer className="bg-white">
            <div className="container mx-auto px-6 py-10">
                <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-10">
                    <FooterLink href="#">Privacy Policy</FooterLink>
                    <FooterLink href="#">Terms of Service</FooterLink>
                    <FooterLink href="#">Contact Us</FooterLink>
                </div>
            </div>
        </footer>
    )
}