"use client";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { getUData, useUser } from "@/app/_components/userDataProvider";
import { Loading } from "@/app/_components/loading";
import { Bookshelf } from "@/app/_components/bookshelf";

export default function BookshelfPage({
  params,
}: {
  params: { nick: string };
}) {
  const user = useUser();
  const router = useRouter();
  const logout = api.users.logout.useMutation();
  const userid = api.users.findUser.useQuery({
    nick: decodeURIComponent(params.nick),
  });

  if (user === null) return <Loading />;
  const userdata = getUData(user);
  if (!userdata) {
    setTimeout(() => router.replace("/"), 0);
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-1">
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
      {userid.data ? (
        <Bookshelf userid={userid.data.id} token={userdata.token} />
      ) : (
        `Użytkownik o nazwie ${params.nick} nie istnieje!`
      )}
    </div>
  );
}
