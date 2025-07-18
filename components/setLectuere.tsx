import { useEffect } from "react";

export default function SetLecturer({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  useEffect(() => {
    localStorage.setItem(
      "lecturer",
      JSON.stringify({
        name,
        email,
      })
    );
  }, [email, name]);
  return;
}
