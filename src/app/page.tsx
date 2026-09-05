import { DarkModeToggle } from "@/components/common/darkmode-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";

export default function Home() {
  return (
    <div>
      <form action={logout}>
        <Button type="submit">Logout</Button>
      </form>
      <DarkModeToggle />
    </div>
  );
}
