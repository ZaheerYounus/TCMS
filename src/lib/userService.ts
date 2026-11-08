import { hashPassword, verifyPassword } from "./auth";
import fs from "fs";
import path from "path";

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "STAFF";
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

const USERS_FILE_PATH = path.join(process.cwd(), "src", "data", "users.json");

// In-memory cache
let cachedUsers: UserRecord[] | null = null;

// Initial default seed accounts
const DEFAULT_INITIAL_USERS: Omit<UserRecord, "passwordHash">[] = [
  {
    id: "usr_admin",
    username: "admin",
    name: "System Administrator",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr_staff1",
    username: "staff1",
    name: "Staff Member 1",
    role: "STAFF",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr_staff2",
    username: "staff2",
    name: "Staff Member 2",
    role: "STAFF",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr_staff3",
    username: "staff3",
    name: "Staff Member 3",
    role: "STAFF",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr_staff4",
    username: "staff4",
    name: "Staff Member 4",
    role: "STAFF",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function initializeUsers(): Promise<UserRecord[]> {
  if (cachedUsers && cachedUsers.length > 0) return cachedUsers;

  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      cachedUsers = JSON.parse(data);
      if (cachedUsers && cachedUsers.length > 0) {
        return cachedUsers;
      }
    }
  } catch (e) {
    console.warn("Could not read users file, creating initial seed:", e);
  }

  // Generate seed hashes:
  // admin -> Admin@TCMS2026
  // staff1..4 -> Staff1..4@TCMS
  const adminHash = await hashPassword("Admin@TCMS2026");
  const staff1Hash = await hashPassword("Staff1@TCMS");
  const staff2Hash = await hashPassword("Staff2@TCMS");
  const staff3Hash = await hashPassword("Staff3@TCMS");
  const staff4Hash = await hashPassword("Staff4@TCMS");

  const initialUsers: UserRecord[] = [
    { ...DEFAULT_INITIAL_USERS[0], passwordHash: adminHash },
    { ...DEFAULT_INITIAL_USERS[1], passwordHash: staff1Hash },
    { ...DEFAULT_INITIAL_USERS[2], passwordHash: staff2Hash },
    { ...DEFAULT_INITIAL_USERS[3], passwordHash: staff3Hash },
    { ...DEFAULT_INITIAL_USERS[4], passwordHash: staff4Hash },
  ];

  cachedUsers = initialUsers;
  saveUsersToFile(initialUsers);
  return initialUsers;
}

function saveUsersToFile(users: UserRecord[]) {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist users to file:", e);
  }
}

export async function getAllUsers(): Promise<Omit<UserRecord, "passwordHash">[]> {
  const users = await initializeUsers();
  return users.map(({ passwordHash, ...rest }) => rest);
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const users = await initializeUsers();
  const clean = username.trim().toLowerCase();
  return users.find(u => u.username.toLowerCase() === clean) || null;
}

export async function authenticateUser(username: string, password: string): Promise<UserRecord | null> {
  const user = await getUserByUsername(username);
  if (!user || !user.isActive) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsersToFile(cachedUsers || []);
  return user;
}

export async function createUser(data: {
  username: string;
  name: string;
  password: string;
  role: "ADMIN" | "STAFF";
}): Promise<{ success: boolean; user?: Omit<UserRecord, "passwordHash">; error?: string }> {
  const users = await initializeUsers();
  const cleanUsername = data.username.trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: "Username already exists." };
  }

  const passwordHash = await hashPassword(data.password);
  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    name: data.name.trim(),
    role: data.role,
    passwordHash,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  cachedUsers = users;
  saveUsersToFile(users);

  const { passwordHash: _, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const users = await initializeUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: "User not found." };
  }

  user.passwordHash = await hashPassword(newPassword);
  user.updatedAt = new Date().toISOString();
  saveUsersToFile(users);
  return { success: true };
}

export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const users = await initializeUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: "User not found." };
  }

  if (user.username === "admin" && !isActive) {
    return { success: false, error: "Cannot disable primary system administrator." };
  }

  user.isActive = isActive;
  user.updatedAt = new Date().toISOString();
  saveUsersToFile(users);
  return { success: true };
}
