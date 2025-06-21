"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";

import { Button } from "@/components/button";
import {
  UserPlus,
  Copy,
  Check,
  Trash2,
  Edit,
  Plus,
  Eye,
  Pencil,
  Trash,
  Shield,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { Input } from "@/components/input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/hover-card";
import { Label } from "@/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { Badge } from "@/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";
import {
  createUserWithToken,
  updateUserRole,
  deleteUser,
} from "@/actions/user";
import { ROLE_PERMISSIONS, roles as ROLES } from "@/constants/rbac";

const getRolePermissions = (role) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return [];

  return Object.entries(permissions).filter(
    ([_, actions]) => actions.length > 0,
  );
};
const getAllModules = () => {
  const modules = new Set();
  Object.values(ROLE_PERMISSIONS).forEach((rolePerms) => {
    Object.keys(rolePerms).forEach((module) => modules.add(module));
  });
  return Array.from(modules).sort();
};
const getPermissionIcon = (permission) => {
  switch (permission) {
    case "create":
      return <Plus className="h-3 w-3" />;
    case "read":
      return <Eye className="h-3 w-3" />;
    case "update":
      return <Pencil className="h-3 w-3" />;
    case "delete":
      return <Trash className="h-3 w-3" />;
    default:
      return null;
  }
};

const formatModuleName = (module) => {
  const moduleNames = {
    products: "Products",
    boms: "BOMs",
    inventories: "Inventories",
    purchaseorders: "Purchase Orders",
    salesorders: "Sales Orders",
    rawmaterials: "Raw Materials",
    finances: "Finances",
    users: "Users",
    notifications: "Notifications",
  };
  return moduleNames[module] || module;
};
export default function AdminUserManagement({ allUsers }) {
  const router = useRouter();
  const [users, setUsers] = useState(allUsers);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activationToken, setActivationToken] = useState(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    setUsers(allUsers);
  }, [allUsers]);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!email || !selectedRole) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("role", selectedRole);

      const result = await createUserWithToken(formData);

      if (result.success) {
        if (result.activationToken) {
          setActivationToken(
            `${document.location.origin}/activate?token=${result.activationToken}`,
          );
          setShowTokenDialog(true);
        }
        setEmail("");
        setSelectedRole("");
        router.refresh();
      } else {
        toast({
          title: result.error || "Failed to invite user",
          variant: "destructive",
        });
      }
    });
  };

  const handleRoleUpdate = async (userId, newRole) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("role", newRole);

      const result = await updateUserRole(formData);

      if (result.success) {
        toast({
          title: "User role updated successfully",
        });

        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, role: newRole } : user,
          ),
        );
      } else {
        toast({
          title: result.error || "Failed to update user role",
          variant: "destructive",
        });
      }

      setEditingUser(null);
    });
  };

  const handleDeleteUser = async (userId) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);

      const result = await deleteUser(formData);

      if (result.success) {
        toast({
          title: "User deleted successfully",
        });

        // Remove user from local state
        setUsers((prev) => prev.filter((user) => user._id !== userId));
      } else {
        toast({
          title: result.error || "Failed to delete user",
          variant: "destructive",
        });
      }

      setDeleteUserId(null);
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setTokenCopied(true);
      toast({
        title: "Activation link copied to clipboard",
      });
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="users" className="space-y-8">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <TabsList className="border-black border-3">
            <TabsTrigger value="users">
              <UserPlus className="h-4 w-4 mr-1" />
              MEMBERS
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-1" />
              PERMISSIONS
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-12">
          {/* Invite User Form */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite New User
              </h2>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-6 max-w-2xl">
              <div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user email to invite"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Select Role</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLES.map((role) => {
                    const rolePermissions = getRolePermissions(role);

                    if (rolePermissions.length === 0) return null;

                    return (
                      <HoverCard key={role} openDelay={1000} closeDelay={0}>
                        <HoverCardTrigger asChild>
                          <Badge
                            variant={
                              selectedRole === role ? "default" : "outline"
                            }
                            className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                              selectedRole === role
                                ? "bg-orange-400 hover:bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]"
                                : ""
                            }`}
                            onClick={() => setSelectedRole(role)}
                          >
                            {role}
                          </Badge>
                        </HoverCardTrigger>
                        <HoverCardContent
                          className="w-[600px] p-0 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white"
                          side="bottom"
                          sideOffset={10}
                        >
                          <div className="p-6">
                            <div className="mb-4">
                              <h3 className="text-lg font-bold text-black uppercase tracking-wide border-b-4 border-black pb-2">
                                {role} Role
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {rolePermissions.map(([module, actions]) => (
                                <div key={module} className="space-y-2">
                                  <div className="text-xs font-bold text-black uppercase tracking-wide">
                                    {formatModuleName(module)}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {actions.map((action) => (
                                      <div
                                        key={action}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-300 border-2 border-black text-black text-xs font-bold uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                      >
                                        {getPermissionIcon(action)}
                                        {action}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending || !selectedRole}
                className="w-full md:w-auto"
              >
                {isPending ? "Inviting..." : "Send Invite"}
              </Button>
            </form>
          </div>

          {/* Members Table */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Members</h2>
              <p className="text-sm text-muted-foreground">
                Manage existing users & their roles
              </p>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className="cursor-pointer">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditingUser(user)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteUserId(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions Matrix
            </h2>
          </div>

          {/* Permission Summary Table */}
          <div className="rounded-md border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-black">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                      <th className="text-left p-4 font-bold text-black uppercase tracking-wide border-r-2 border-black">
                        Module
                      </th>
                      {ROLES.map((role) => (
                        <th
                          key={role}
                          className="text-center p-4 font-bold text-black uppercase tracking-wide border-r-2 border-black last:border-r-0"
                        >
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getAllModules().map((module) => (
                      <tr
                        key={module}
                        className="border-b-2 border-black last:border-b-0"
                      >
                        <td className="p-4 font-bold text-black uppercase tracking-wide border-r-2 border-black bg-gray-50">
                          {formatModuleName(module)}
                        </td>
                        {ROLES.map((role) => {
                          const rolePerms = ROLE_PERMISSIONS[role];
                          const modulePerms = rolePerms?.[module];

                          return (
                            <td
                              key={role}
                              className="p-4 text-center border-r-2 border-black last:border-r-0"
                            >
                              {modulePerms && modulePerms.length > 0 ? (
                                <div className="flex flex-wrap justify-center gap-1">
                                  {modulePerms.map((action) => (
                                    <div
                                      key={action}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-300 border border-black text-black text-xs font-bold uppercase"
                                    >
                                      {getPermissionIcon(action)}
                                      {action.charAt(0)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 font-bold">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Activation Token Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <DialogHeader className="border-b-4 border-black">
            <DialogTitle className="text-xl font-bold text-black uppercase tracking-wide">
              User Invitation Sent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={activationToken}
                readOnly
                className="mt-1 shrink-0 max-w-[85%] font-mono text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <Button onClick={() => copyToClipboard(activationToken)}>
                {tokenCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-black font-medium bg-gray-100 p-3 border-2 border-black">
              The user will need this link to set up their account. It'll be
              shared via email. <br />
              <strong>TODO:</strong> Use Gmail provider to send the email.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <DialogHeader className="border-b-4 border-black mb-4">
            <DialogTitle className="text-xl font-bold text-black uppercase tracking-wide">
              Edit User Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-bold text-black tracking-wide">
                Select New Role
              </Label>
              <Label className="text-sm font-bold text-black tracking-wide normal-case">
                EMAIL: {editingUser?.email}
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ROLES.map((role) => (
                  <Badge
                    key={role}
                    className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                      editingUser?.role === role
                        ? "bg-orange-400 hover:bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]"
                        : ""
                    }`}
                    onClick={() =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, role: role } : null,
                      )
                    }
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editingUser &&
                  handleRoleUpdate(editingUser.id, editingUser.role)
                }
                disabled={isPending}
                className="bg-green-400 hover:bg-green-500 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
              >
                {isPending ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={() => setDeleteUserId(null)}
      >
        <AlertDialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black uppercase tracking-wide">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black font-medium">
              This action cannot be undone. This will permanently delete the
              user account and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
              className="bg-red-400 hover:bg-red-500 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
            >
              {isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
