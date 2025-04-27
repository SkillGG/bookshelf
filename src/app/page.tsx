"use client";
import Link from "next/link";
import { getUData, useUser } from "./_components/userDataProvider";
import { useRouter } from "next/navigation";
import { Loading } from "./_components/loading";

export default function Home() {
  const user = useUser();
  const router = useRouter();

  if (user === null) return <Loading />;

  const uData = getUData(user);

  if (uData) {
    setTimeout(() => router.replace("/main"), 0);
    return <></>;
  } else {
    return (
      <div className="mx-auto mt-2 w-fit">
        <Link href={"/login"} className="mt-2 mr-2 border-[1px] px-2">
          Zaloguj
        </Link>
        <Link href={"/register"} className="mt-2 mr-2 border-[1px] px-2">
          Zarejestruj
        </Link>
      </div>
    );
  }

  return <></>;
}
