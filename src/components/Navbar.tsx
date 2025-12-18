"use client";

import Link from "next/link";
import { useState } from "react";

import Streamgraph from "./Streamgraph/Streamgraph";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 bg-transparent text-white">
            <div className="w-full px-16">
                <div className="flex justify-between items-center h-32">
                    {/* Brand */}
                    <div className="flex-shrink-0 flex items-center gap-4">
                        <Link href="#" className="fl-text-xl/3xl font-bold tracking-widest hover:text-highlight transition-colors">
                            ELVIS
                        </Link>
                        <div className="w-[100px] h-[40px] -mt-2">
                            <Streamgraph width={100} height={40} showControls={false} id="navbar-streamgraph" enableScrollInteraction={true} />
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="fl-text-base/xl font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            Home
                        </Link>
                        <Link href="/" className="fl-text-base/xl font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            About
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center whitespace-nowrap fl-px-3/4 fl-py-2/3 rounded-full bg-black text-white fl-text-sm/lg font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-black focus:outline-none dark:text-gray-200"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Hamburger Icon */}
                            <svg
                                className={`${isOpen ? "hidden" : "block"} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            {/* Close Icon */}
                            <svg
                                className={`${isOpen ? "block" : "hidden"} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`${isOpen ? "block" : "hidden"} md:hidden absolute w-full bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <Link
                        href="/"
                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        Home
                    </Link>
                    <Link
                        href="/"
                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        About
                    </Link>
                    <Link
                        href="/"
                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        Contact
                    </Link>
                </div>
            </div>
        </nav>
    );
}
