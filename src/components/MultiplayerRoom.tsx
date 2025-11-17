import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MultiplayerRoomProps {
  gameType: "brain_rush" | "pattern_master" | "word_sprint";
}

const MultiplayerRoom = ({ gameType }: MultiplayerRoomProps) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadRooms();
    subscribeToRooms();
  }, [gameType]);

  useEffect(() => {
    if (currentRoom) {
      loadPlayers();
      loadChat();
      subscribeToPlayers();
      subscribeToChat();
    }
  }, [currentRoom]);

  const loadRooms = async () => {
    const { data } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("game_type", gameType)
      .eq("status", "waiting")
      .eq("is_private", false);

    if (data) {
      setRooms(data);
    }
  };

  const loadPlayers = async () => {
    if (!currentRoom) return;

    const { data } = await supabase
      .from("room_players")
      .select("*, profiles(*)")
      .eq("room_id", currentRoom.id);

    if (data) {
      setPlayers(data);
    }
  };

  const loadChat = async () => {
    if (!currentRoom) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*, profiles(*)")
      .eq("room_id", currentRoom.id)
      .order("created_at", { ascending: true });

    if (data) {
      setChatMessages(data);
    }
  };

  const subscribeToRooms = () => {
    const channel = supabase
      .channel("game_rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `game_type=eq.${gameType}`,
        },
        () => {
          loadRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToPlayers = () => {
    if (!currentRoom) return;

    const channel = supabase
      .channel(`room_players_${currentRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${currentRoom.id}`,
        },
        () => {
          loadPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToChat = () => {
    if (!currentRoom) return;

    const channel = supabase
      .channel(`chat_${currentRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${currentRoom.id}`,
        },
        () => {
          loadChat();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createRoom = async (isPrivate: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roomData, error: roomError } = await supabase
      .from("game_rooms")
      .insert({
        game_type: gameType,
        host_id: user.id,
        is_private: isPrivate,
        room_code: "",
      })
      .select()
      .single();

    if (roomError) {
      toast({
        title: "Error",
        description: roomError.message,
        variant: "destructive",
      });
      return;
    }

    // Join the room
    await supabase.from("room_players").insert({
      room_id: roomData.id,
      user_id: user.id,
    });

    setCurrentRoom(roomData);
    toast({
      title: "Room created!",
      description: isPrivate ? `Room code: ${roomData.room_code}` : "Room is public",
    });
  };

  const joinRoom = async (room: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("room_players").insert({
      room_id: room.id,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCurrentRoom(room);
  };

  const joinByCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roomData } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .single();

    if (!roomData) {
      toast({
        title: "Error",
        description: "Room not found",
        variant: "destructive",
      });
      return;
    }

    await joinRoom(roomData);
  };

  const leaveRoom = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentRoom) return;

    await supabase
      .from("room_players")
      .delete()
      .eq("room_id", currentRoom.id)
      .eq("user_id", user.id);

    setCurrentRoom(null);
    setPlayers([]);
    setChatMessages([]);
  };

  const sendMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentRoom || !newMessage.trim()) return;

    await supabase.from("chat_messages").insert({
      room_id: currentRoom.id,
      user_id: user.id,
      message: newMessage,
    });

    setNewMessage("");
  };

  if (currentRoom) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Room: {currentRoom.room_code || "Public"}</h3>
            <Badge className="mt-1">
              {players.length}/{currentRoom.max_players} Players
            </Badge>
          </div>
          <Button
            onClick={leaveRoom}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Leave Room
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Players List */}
          <div>
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players
            </h4>
            <div className="space-y-2">
              {players.map((player) => (
                <Card key={player.id} className="bg-white/5 border-white/10 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={player.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {player.profiles?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-bold">{player.profiles?.username}</div>
                      {player.is_ready && (
                        <Badge className="bg-green-500 text-white text-xs">Ready</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div>
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </h4>
            <Card className="bg-white/5 border-white/10 p-3 h-64 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="text-purple-300 font-bold">
                        {msg.profiles?.username}:
                      </span>
                      <span className="text-white ml-2">{msg.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="bg-white/10 border-white/20 text-white"
                />
                <Button
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Send
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Button
          onClick={() => createRoom(false)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Public Room
        </Button>
        <Button
          onClick={() => createRoom(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Private Room
        </Button>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
        <div className="flex gap-2">
          <Input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter room code..."
            className="bg-white/10 border-white/20 text-white"
          />
          <Button onClick={joinByCode} className="bg-gradient-to-r from-green-500 to-emerald-500">
            <Search className="mr-2 h-4 w-4" />
            Join by Code
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-white font-bold">Available Rooms</h3>
        {rooms.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center text-white">
            No rooms available. Create one!
          </Card>
        ) : (
          rooms.map((room) => (
            <Card
              key={room.id}
              className="bg-white/10 backdrop-blur-sm border-white/20 p-4 cursor-pointer hover:bg-white/20 transition-all"
              onClick={() => joinRoom(room)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">Room {room.room_code}</div>
                  <div className="text-white/70 text-sm">
                    Host: {room.host_id}
                  </div>
                </div>
                <Badge>
                  <Users className="w-3 h-3 mr-1" />
                  {room.max_players} max
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MultiplayerRoom;
