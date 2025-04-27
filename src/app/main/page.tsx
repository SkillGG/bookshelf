"use client";
import { Loading } from "../_components/loading";
import { getUData, useUser } from "../_components/userDataProvider";
import { useRouter } from "next/navigation";
import { Bookshelf } from "../_components/bookshelf";
import { api } from "@/trpc/react";
import { Searchbar } from "../_components/searchbar";

export default function Main() {
  const user = useUser();
  const router = useRouter();
  const logout = api.users.logout.useMutation();

  console.log(user);

  if (user === null) return <Loading />;
  const userdata = getUData(user);
  if (!userdata) {
    setTimeout(() => router.replace("/"), 0);
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-2">
      <div>
        Zalogowano jako: {userdata.nick}{" "}
        <button
          className="cursor-pointer text-slate-400 hover:text-slate-800"
          onClick={async () => {
            localStorage.removeItem("token");
            await logout.mutateAsync(userdata.token);
            window.location.reload();
          }}
        >
          Wyloguj
        </button>
      </div>
      <Searchbar />
      <Bookshelf
        userid={userdata.userid}
        title={"Twoje książki"}
        editable
        token={userdata.token}
      />
    </div>
  );
}
