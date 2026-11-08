import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllUsers, createUser, resetUserPassword, toggleUserStatus } from "@/lib/userService";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
  }

  const users = await getAllUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { username, name, password, role } = body;

    if (!username || !name || !password) {
      return NextResponse.json({ error: "Username, full name, and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const res = await createUser({
      username,
      name,
      password,
      role: role === "ADMIN" ? "ADMIN" : "STAFF",
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: res.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, action, newPassword, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    if (action === "resetPassword") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
      }
      const res = await resetUserPassword(userId, newPassword);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Password updated successfully." });
    }

    if (action === "toggleStatus") {
      if (typeof isActive !== "boolean") {
        return NextResponse.json({ error: "Active status boolean is required." }, { status: 400 });
      }
      const res = await toggleUserStatus(userId, isActive);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: `User ${isActive ? "activated" : "disabled"} successfully.` });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}
