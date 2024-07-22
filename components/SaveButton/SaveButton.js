import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";

export default function SaveButton() {
  const { data: session, status } = useSession();

  if (status == "authenticated") {
    return <Button>Save</Button>;
  }

  if (status == "unauthenticated") {
    return (
      <Button onClick={() => signIn("discord")}>
        Sign in with Discord to save
      </Button>
    );
  }

  return null;
}
