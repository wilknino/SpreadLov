# ConnectVerse - Real-Time Chat Application

## Overview

ConnectVerse is a modern, full-stack real-time chat application built with React, Node.js/Express, and WebSocket technology. The application enables users to communicate with each other through instant messaging, with features including user authentication, profile management, online status tracking, image sharing, and persistent message storage. The architecture follows a monorepo structure with separate client and server directories, utilizing modern web technologies for a responsive and secure chat experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and functional components using hooks
- **UI Framework**: shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS for utility-first responsive design with custom CSS variables for theming
- **State Management**: React Context API for authentication and global state, with TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing with protected route implementation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Session Management**: Express sessions with memory store (configurable for production databases)
- **Password Security**: Native crypto module with scrypt hashing and random salt generation
- **File Uploads**: Multer middleware for handling image uploads with file type validation and size limits
- **Real-time Communication**: WebSocket implementation using 'ws' library for instant messaging and online status updates

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema Structure**:
  - Users table: Authentication credentials, profile information, online status
  - Conversations table: One-to-one chat relationships between users
  - Messages table: Chat messages with support for text content and image URLs
- **Database Provider**: Configured for Neon Database (PostgreSQL-compatible serverless database)
- **Migration System**: Drizzle Kit for database schema migrations and management

### Real-time Features
- **WebSocket Server**: Custom WebSocket implementation integrated with HTTP server
- **Message Broadcasting**: Real-time message delivery between authenticated users
- **Online Status Tracking**: Live user presence indicators with automatic status updates
- **Typing Indicators**: Real-time typing status notifications during active conversations

### Security Implementation
- **Authentication Flow**: Session-based authentication with HTTP-only cookies
- **Password Storage**: Cryptographically secure password hashing with individual salts
- **Route Protection**: Server-side authentication middleware protecting all API endpoints
- **File Upload Security**: MIME type validation and file size restrictions for image uploads
- **WebSocket Security**: Authentication required for WebSocket connections with user ID verification

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL-compatible serverless database for production data storage
- **Database Connection**: @neondatabase/serverless driver for optimized serverless database connections

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives including dialogs, dropdowns, forms, and navigation components
- **Lucide React**: Modern icon library providing consistent iconography throughout the application

### Development and Build Tools
- **Vite**: Fast build tool with Hot Module Replacement for development
- **TypeScript**: Static typing for enhanced developer experience and code reliability
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **ESBuild**: Fast JavaScript bundler for production server builds

### Authentication and Session Management
- **Passport.js**: Flexible authentication middleware with local strategy implementation
- **Express Session**: Session middleware with configurable store backends
- **Connect-pg-simple**: PostgreSQL session store adapter for production environments

### File Processing
- **Multer**: Multipart form data handling for file uploads
- **Image Processing**: File type validation and storage management for user profile photos and message images

### Real-time Communication
- **WebSocket (ws)**: Low-level WebSocket implementation for real-time bidirectional communication
- **Custom Socket Management**: Application-specific socket handling for chat features and user presence