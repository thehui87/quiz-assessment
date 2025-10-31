"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ListTree, Menu, X, LogIn } from "lucide-react";

// --- Header Component ---
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Base classes for navigation items
  const linkBaseClasses = "flex gap-2 p-2 rounded-md transition-colors font-medium";
  const desktopLinkClasses =
    "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400";
  const mobileLinkClasses =
    "text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-800 w-full";

  const links = (
    <>
      <Link href="/" className={`${linkBaseClasses} ${desktopLinkClasses}`} onClick={closeMenu}>
        <Home className="w-5 h-5" />
        Home
      </Link>
      <Link
        href="/quiz/browse"
        className={`${linkBaseClasses} ${desktopLinkClasses}`}
        onClick={closeMenu}
      >
        <ListTree className="w-5 h-5" /> Browse
      </Link>
    </>
  );

  const adminLink = (
    <Link
      href="/auth/login"
      className="px-4 py-2 text-sm font-semibold rounded-full 
                 bg-indigo-600 text-white shadow-lg 
                 hover:bg-indigo-700 transition-all duration-200 
                 flex items-center gap-2"
      onClick={closeMenu}
    >
      <LogIn className="w-4 h-4" />
      Admin
    </Link>
  );

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900/95 backdrop-blur-sm shadow-xl dark:shadow-indigo-900/20">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight"
        >
          QuizStack
        </Link>

        {/* Desktop Navigation (md:flex) */}
        <nav className="hidden md:flex space-x-6 items-center">
          {links}
          {adminLink}
        </nav>

        {/* Mobile Toggle Button (md:hidden) */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-full text-indigo-600 dark:text-indigo-400 
                     hover:bg-indigo-50 dark:hover:bg-gray-800 
                     transition-colors ring-2 ring-indigo-500/50 dark:ring-indigo-700/50"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu Content (Conditional) */}
      <div
        // Conditional height for smooth slide animation
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMenuOpen ? "max-h-screen opacity-100 border-t" : "max-h-0 opacity-0"
        } dark:border-gray-700 bg-gray-50 dark:bg-gray-900`}
      >
        <nav className="flex flex-col space-y-1 p-4">
          {/* Mobile Links */}
          <Link href="/" className={`${linkBaseClasses} ${mobileLinkClasses}`} onClick={closeMenu}>
            <Home className="w-5 h-5" /> Home
          </Link>
          <Link
            href="/quiz/browse"
            className={`${linkBaseClasses} ${mobileLinkClasses}`}
            onClick={closeMenu}
          >
            <ListTree className="w-5 h-5" /> Browse
          </Link>

          {/* Mobile Admin Button (Styled as a full-width link) */}
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="w-full justify-center text-center py-2 px-4 text-base font-semibold rounded-lg 
                         bg-indigo-600 text-white shadow-md 
                         hover:bg-indigo-700 transition-colors flex items-center gap-2"
              onClick={closeMenu}
            >
              <LogIn className="w-5 h-5" />
              Admin Access
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export { Header };
