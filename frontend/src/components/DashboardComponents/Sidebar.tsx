/*
    File: src/components/DashboardComponents/Sidebar.tsx
    Created: 09/19/2025 
    Author: CJ Quintero

    Last Updated: 09/19/2025 by CJ Quintero

    Description: This file has the code for the sidebar component in the dashboard.
*/

export default function Sidebar() {
    /*
        Sidebar()

        This component renders the sidebar for the dashboard layout.

        Returns:
        A JSX element representing the sidebar component.
    */
    return (
        <div>
            {/* <aside> defines a secondary component like sidebars. It's considered secondary content for the page*/}
            <aside className="sticky flex flex-col ml-4 w-64 h-[95vh] my-5 top-5 bg-white p-6 border-2 border-black rounded-3xl shadow-2xl">
                <div className="flex flex-col h-full">
                    {/* The header for the sidebar */}
                    <h1 className="flex justify-center text-4xl font-bold text-gray-900 mb-8">ClutchCall</h1>
                    {/* <nav> groups links together */}
                    <nav className="flex flex-col gap-2">
                        {/* Each <a> tag is a link in the sidebar.
                            The href="#" is used as a placeholder that doesn't link to an actual page, it
                            just takes you back to the top of the page.
                        */}
                        <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-100 text-red-500 font-medium" href="#">
                            {/* <svg> is used to insert an inline SVG icon. This one displays a house for the Home tab on the sidebar*/}
                            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M224,115.55V208a16,16,0,0,1-16,
                                16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,
                                0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,
                                16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,
                                1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
                            </svg>
                            {/* The text label for the tab */}
                            <span>Home</span>
                        </a>
                    </nav>
                </div>
            </aside>
        </div>
    )
}


