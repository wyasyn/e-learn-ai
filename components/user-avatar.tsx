"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";

export default function UserAvatar() {
  const session = authClient.useSession();
  if (!session) return;
  const user = session.data?.user;
  if (!user) return;
  return (
    <Avatar>
      <AvatarImage src={user.image ? user.image : "/avatar.webp"} />
      <AvatarFallback>{user.name[0]}</AvatarFallback>
    </Avatar>
  );
}
