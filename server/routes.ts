import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMessageSchema, insertConversationSchema } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Get all users (for sidebar)
  app.get("/api/users", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const users = await storage.getAllUsers();
      const filteredUsers = users.filter(user => user.id !== req.user!.id);
      res.json(filteredUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get online users
  app.get("/api/users/online", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const onlineUsers = await storage.getOnlineUsers();
      const filteredUsers = onlineUsers.filter(user => user.id !== req.user!.id);
      res.json(filteredUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch online users" });
    }
  });

  // Get user conversations
  app.get("/api/conversations", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversations = await storage.getUserConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:userId/messages", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { userId } = req.params;
      let conversation = await storage.getConversation(req.user!.id, userId);
      
      if (!conversation) {
        // Create conversation if it doesn't exist
        conversation = await storage.createConversation({
          participant1Id: req.user!.id,
          participant2Id: userId,
        });
      }
      
      const messages = await storage.getMessages(conversation.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Update user profile
  app.patch("/api/profile", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const updates = req.body;
      delete updates.id; // Prevent ID modification
      delete updates.password; // Prevent password change through this route
      
      const updatedUser = await storage.updateUser(req.user!.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload profile picture
  app.post("/api/upload/profile", upload.single('profilePicture'), async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const profilePhotoUrl = `/uploads/${req.file.filename}`;
      const updatedUser = await storage.updateUser(req.user!.id, { profilePhoto: profilePhotoUrl });
      
      res.json({ profilePhoto: profilePhotoUrl, user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  // Upload message image
  app.post("/api/upload/message", upload.single('messageImage'), async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedUsers = new Map<string, { ws: WebSocket; userId: string }>();
  
  function broadcastToAll(message: any) {
    connectedUsers.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Logout route - placed here to access connectedUsers
  app.post("/api/logout", async (req: AuthenticatedRequest, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id.toString();
    
    // Close WebSocket connection if exists
    const userConnection = connectedUsers.get(userId);
    if (userConnection) {
      userConnection.ws.close();
      connectedUsers.delete(userId);
      await storage.setUserOnlineStatus(userId, false);
      
      // Broadcast user offline status
      broadcastToAll({
        type: 'userOffline',
        userId,
      });
    }
    
    // Logout from session
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  wss.on('connection', (ws) => {
    let userId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            userId = message.userId;
            connectedUsers.set(userId, { ws, userId });
            await storage.setUserOnlineStatus(userId, true);
            
            // Broadcast user online status
            broadcastToAll({
              type: 'userOnline',
              userId,
            });
            break;
            
          case 'sendMessage':
            if (!userId) return;
            
            const { receiverId, content, imageUrl } = message;
            
            // Get or create conversation
            let conversation = await storage.getConversation(userId, receiverId);
            if (!conversation) {
              conversation = await storage.createConversation({
                participant1Id: userId,
                participant2Id: receiverId,
              });
            }
            
            // Create message
            const newMessage = await storage.createMessage({
              conversationId: conversation.id,
              senderId: userId,
              content,
              imageUrl,
            });
            
            // Send to receiver if online
            const receiverConnection = connectedUsers.get(receiverId);
            if (receiverConnection && receiverConnection.ws.readyState === WebSocket.OPEN) {
              receiverConnection.ws.send(JSON.stringify({
                type: 'newMessage',
                message: newMessage,
                sender: await storage.getUser(userId),
              }));
            }
            
            // Confirm to sender
            ws.send(JSON.stringify({
              type: 'messageConfirmed',
              message: newMessage,
            }));
            break;
            
          case 'typing':
            if (!userId) return;
            
            const { receiverId: typingReceiverId, isTyping } = message;
            const typingReceiverConnection = connectedUsers.get(typingReceiverId);
            
            if (typingReceiverConnection && typingReceiverConnection.ws.readyState === WebSocket.OPEN) {
              typingReceiverConnection.ws.send(JSON.stringify({
                type: 'userTyping',
                userId,
                isTyping,
              }));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (userId) {
        connectedUsers.delete(userId);
        await storage.setUserOnlineStatus(userId, false);
        
        // Broadcast user offline status
        broadcastToAll({
          type: 'userOffline',
          userId,
        });
      }
    });
  });

  return httpServer;
}
