# Backend Setup Guide

This guide provides step-by-step instructions for setting up the backend API service for the "Am I an AI?" application.

## Prerequisites

- Node.js (v16+) and npm/yarn installed
- MongoDB account (Atlas or local installation)
- Git for version control
- Basic knowledge of Express.js and RESTful APIs

## Step 1: Project Setup

1. Create a new directory for the backend:

```bash
mkdir amianai-backend
cd amianai-backend
```

2. Initialize the project:

```bash
npm init -y
```

3. Install core dependencies:

```bash
npm install express mongoose dotenv cors jsonwebtoken bcrypt nodemailer zod express-rate-limit helmet
npm install --save-dev typescript ts-node @types/express @types/node @types/mongoose @types/cors @types/jsonwebtoken @types/bcrypt @types/nodemailer nodemon
```

4. Create a TypeScript configuration file (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

5. Create an environment file (`.env`) for configuration:

```
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/amianai?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Email (example with Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=AmIanAI <your-email@gmail.com>

# Frontend URL (for email links and CORS)
FRONTEND_URL=http://localhost:3000
```

6. Add scripts to `package.json`:

```json
"scripts": {
  "start": "node dist/index.js",
  "dev": "nodemon src/index.ts",
  "build": "tsc",
  "lint": "eslint . --ext .ts"
}
```

## Step 2: Project Structure

Create the following directory structure:

```
amianai-backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── validation/      # Request validation schemas
│   ├── config.ts        # Configuration
│   └── index.ts         # Entry point
├── .env                 # Environment variables
├── .gitignore           # Git ignore file
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Step 3: Setup Entry Point

Create `src/index.ts`:

```typescript
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import analysisRoutes from "./routes/analysisRoutes";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analysis", analysisRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
```

## Step 4: User Model

Create `src/models/User.ts`:

```typescript
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  apiKey?: string;
  usageCount: number;
  usageLimit: number;
  subscription: {
    type: "free" | "premium" | "enterprise";
    expiresAt?: Date;
  };
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    lastLogin: Date,
    apiKey: String,
    usageCount: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: 50,
    },
    subscription: {
      type: {
        type: String,
        enum: ["free", "premium", "enterprise"],
        default: "free",
      },
      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
```

## Step 5: Authentication Controller

Create `src/controllers/authController.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService";

// Register new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user
    const user = new User({
      name,
      email,
      password,
      verificationToken,
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res
        .status(403)
        .json({
          message:
            "Email not verified. Please verify your email before logging in.",
        });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user and token
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription.type,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Implement other auth functions like verify email, forgot password, etc.
```

## Step 6: Authentication Routes

Create `src/routes/authRoutes.ts`:

```typescript
import express from "express";
import { register, login } from "../controllers/authController";
import {
  validateRegistration,
  validateLogin,
} from "../validation/authValidation";

const router = express.Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);

// Add more routes for email verification, password reset, etc.

export default router;
```

## Step 7: Authentication Middleware

Create `src/middleware/authMiddleware.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
};
```

## Step 8: Running the Server

1. Start the development server:

```bash
npm run dev
```

2. Build for production:

```bash
npm run build
npm start
```

## Next Steps

After completing this basic setup, you should:

1. Implement the remaining authentication features (email verification, password reset)
2. Set up the user management endpoints
3. Create the analysis endpoints
4. Add proper error handling and validation
5. Implement rate limiting and security features
6. Set up logging and monitoring
7. Write tests for your API endpoints

## Connecting Frontend to Backend

Update the frontend API service (`src/services/api.ts`) to connect to your new backend instead of using the simulated API responses.
