"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthButton } from "./auth-button"
import { HardDrive, MessageCircle, FolderOpen, Home, Briefcase } from "lucide-react"

export function Navbar() {
  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GSH Smart File System</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/projects"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span>Projects</span>
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            <AuthButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
