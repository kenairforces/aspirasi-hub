import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Users, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Friends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/login");
      return;
    }
    setCurrentUser(user);
    loadFriends(user.id);
    loadFriendRequests(user.id);
  };

  const loadFriends = async (userId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select(`
        *,
        friend:friend_id (id, username, full_name)
      `)
      .eq("user_id", userId)
      .eq("status", "accepted");

    setFriends(data || []);
  };

  const loadFriendRequests = async (userId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select(`
        *,
        requester:user_id (id, username, full_name)
      `)
      .eq("friend_id", userId)
      .eq("status", "pending");

    setFriendRequests(data || []);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${searchQuery}%`)
      .limit(10);

    setSearchResults(data || []);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.from("friendships").insert({
        user_id: currentUser.id,
        friend_id: friendId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Friend Request Sent! 👥",
        description: "Menunggu konfirmasi",
      });
      setSearchResults([]);
      setSearchQuery("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (requestId: string, requesterId: string) => {
    try {
      // Update the request status
      await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", requestId);

      // Create reciprocal friendship
      await supabase.from("friendships").insert({
        user_id: currentUser.id,
        friend_id: requesterId,
        status: "accepted",
      });

      toast({
        title: "Friend Added! 🎉",
        description: "Sekarang kalian berteman",
      });

      loadFriends(currentUser.id);
      loadFriendRequests(currentUser.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "rejected" })
      .eq("id", requestId);

    loadFriendRequests(currentUser.id);
    toast({
      title: "Request Rejected",
      description: "Friend request ditolak",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button
          variant="outline"
          onClick={() => navigate("/games")}
          className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Games
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Users className="w-24 h-24 mx-auto text-blue-400 mb-4" />
            <h1 className="text-6xl font-bold text-white mb-4">👥 Friends</h1>
            <p className="text-xl text-white/80">Kelola teman dan main bareng!</p>
          </div>

          {/* Search Users */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">🔍 Cari Teman Baru</h2>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchUsers()}
                placeholder="Cari username..."
                className="bg-white/20 border-white/30 text-white placeholder-white/50"
              />
              <Button onClick={searchUsers} className="bg-blue-500">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-white/10 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-bold text-white">{user.full_name || user.username}</p>
                      <p className="text-white/60 text-sm">@{user.username}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(user.id)}
                      className="bg-green-500"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">📬 Friend Requests</h2>
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between bg-white/10 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {request.requester?.full_name || request.requester?.username}
                      </p>
                      <p className="text-white/60 text-sm">@{request.requester?.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id, request.user_id)}
                        className="bg-green-500"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => rejectFriendRequest(request.id)}
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Friends List */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              👥 My Friends ({friends.length})
            </h2>
            {friends.length === 0 ? (
              <p className="text-white/60 text-center py-8">
                Belum punya teman. Cari teman baru di atas!
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friendship) => (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between bg-white/10 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {friendship.friend?.full_name || friendship.friend?.username}
                      </p>
                      <p className="text-white/60 text-sm">@{friendship.friend?.username}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-white border-white/30">
                      Invite to Game
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Friends;
