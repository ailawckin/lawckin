import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Building2, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  role: string;
}

interface Firm {
  id: string;
  firm_name: string;
  contact_email: string;
  plan: string | null;
  status: string | null;
  created_at: string;
}

export function UsersAndFirms() {
  const [users, setUsers] = useState<User[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchFirms();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, created_at");

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const rolesMap = new Map(rolesData?.map((r) => [r.user_id, r.role]) || []);

      const enrichedUsers = (profilesData || []).map((profile) => ({
        ...profile,
        id: profile.user_id,
        role: rolesMap.get(profile.user_id) || "client",
      }));

      setUsers(enrichedUsers);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFirms = async () => {
    try {
      const { data, error } = await supabase
        .from("firms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFirms(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading firms",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFirms = firms.filter(
    (firm) =>
      firm.firm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      firm.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Users & Firms</h2>
        <p className="text-muted-foreground">Manage users and law firms on the platform</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="firms">
            <Building2 className="h-4 w-4 mr-2" />
            Firms ({firms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No users found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || "Unknown"}
                        </TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : user.role === "lawyer"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Law Firms</CardTitle>
              <CardDescription>Manage registered law firms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search firms by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {filteredFirms.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No firms found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firm Name</TableHead>
                      <TableHead>Contact Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFirms.map((firm) => (
                      <TableRow key={firm.id}>
                        <TableCell className="font-medium">{firm.firm_name}</TableCell>
                        <TableCell>{firm.contact_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{firm.plan || "Standard"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={firm.status === "active" ? "default" : "secondary"}
                          >
                            {firm.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(firm.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

