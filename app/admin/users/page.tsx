"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cde" | "investor" | "sponsor";
  status: "active" | "pending" | "suspended";
  organization: string;
  lastActive: string;
  dealsCount: number;
}

const roleColors = {
  admin: "bg-purple-500/20 text-purple-400",
  cde: "bg-blue-500/20 text-blue-400",
  investor: "bg-green-500/20 text-green-400",
  sponsor: "bg-orange-500/20 text-orange-400",
};

const statusColors = {
  active: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  suspended: "bg-red-500/20 text-red-400",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async (role?: string, search?: string) => {
    try {
      const params = new URLSearchParams();
      if (role && role !== "all") params.set("role", role);
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Refetch when filters change (with debounce for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(roleFilter, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [roleFilter, searchQuery, fetchUsers]);

  // Client-side filtering as backup (API also filters)
  const filteredUsers = users;

  const handleEditUser = (user: User, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
    if (selectedUser?.id === editingUser.id) {
      setSelectedUser(editingUser);
    }
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleSuspendUser = (user: User, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    setUsers(
      users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
    );
    if (selectedUser?.id === user.id) {
      setSelectedUser({ ...user, status: newStatus });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">
                User Management
              </h1>
              <p className="text-sm text-gray-400">
                Manage platform users and permissions
              </p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
              + Invite User
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-800">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-gray-100">{users.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {users.filter((u) => u.status === "active").length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">
            {users.filter((u) => u.status === "pending").length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">CDEs</p>
          <p className="text-2xl font-bold text-blue-400">
            {users.filter((u) => u.role === "cde").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2">
          {["all", "admin", "cde", "investor", "sponsor"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${roleFilter === role ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Table */}
        <div
          className={`flex-1 overflow-x-auto transition-all ${selectedUser ? "pr-0" : ""}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-400">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-lg">No users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Deals
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-900/50 cursor-pointer ${selectedUser?.id === user.id ? "bg-gray-900" : ""}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-100">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.organization}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[user.status]}`}
                      >
                        {user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.dealsCount}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleEditUser(user, e)}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleSuspendUser(user, e)}
                          className="text-xs text-gray-400 hover:text-gray-300"
                        >
                          {user.status === "suspended" ? "Activate" : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Preview Panel */}
        {selectedUser && (
          <div className="w-80 border-l border-gray-800 bg-gray-900 p-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-100">
                User Details
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-200 text-lg"
              >
                ×
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
                {selectedUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <h3 className="text-base font-semibold text-gray-100">
                {selectedUser.name}
              </h3>
              <p className="text-xs text-gray-400">{selectedUser.email}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Organization
                </p>
                <p className="text-sm text-gray-200">
                  {selectedUser.organization}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">Role</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[selectedUser.role]}`}
                >
                  {selectedUser.role.toUpperCase()}
                </span>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Total Deals
                </p>
                <p className="text-xl font-bold text-indigo-400">
                  {selectedUser.dealsCount}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Last Active
                </p>
                <p className="text-sm text-gray-200">
                  {selectedUser.lastActive}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => handleEditUser(selectedUser)}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
              >
                Edit User
              </button>
              <Link
                href={`/admin/deals?user=${selectedUser.id}`}
                className="block w-full px-4 py-2 bg-gray-800 text-gray-200 text-sm rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                View Activity
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-100">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-200 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={editingUser.organization}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      organization: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as User["role"],
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin">Admin</option>
                  <option value="cde">CDE</option>
                  <option value="investor">Investor</option>
                  <option value="sponsor">Sponsor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={editingUser.status}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      status: e.target.value as User["status"],
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
