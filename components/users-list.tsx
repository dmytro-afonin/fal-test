"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  credits: number;
  role: string;
  created_at: string;
}

interface UsersListProps {
  users: User[];
}

export function UsersList({ users: initialUsers }: UsersListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setUpdatingId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">No users found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{user.email}</CardTitle>
                <CardDescription className="mt-1">
                  User ID: {user.id}
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Credits: {user.credits}</Badge>
                  <Badge
                    variant={user.role === "admin" ? "default" : "outline"}
                  >
                    {user.role === "admin" ? "Admin" : "User"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant={user.role === "admin" ? "destructive" : "default"}
                onClick={() => handleToggleRole(user.id, user.role)}
                disabled={updatingId === user.id}
              >
                {updatingId === user.id
                  ? "Updating..."
                  : user.role === "admin"
                    ? "Remove Admin"
                    : "Make Admin"}
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
