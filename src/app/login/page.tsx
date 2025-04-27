"use client";

import { useState, type FC } from "react";
import {
  getLoginFn,
  getUData,
  useUser,
  type LoginFN,
  type UData,
} from "../_components/userDataProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import Link from "next/link";
import { Loading } from "../_components/loading";

const LoggedIn = ({ data }: { data: UData }) => {
  const router = useRouter();
  const params = useSearchParams();
  const replaceParam = params.get("q");
  setTimeout(
    () => {
      router.replace(replaceParam ?? "/main");
    },
    replaceParam ? 600 : 30,
  );
  if (!replaceParam) return <Loading />;
  return (
    <>
      Zalogowano jako: {data.nick}
      <br />
      Wracanie do poprzedniej strony
    </>
  );
};

const LoginPage = ({ login }: { login: LoginFN }) => {
  const params = useSearchParams();
  const [mail, setMail] = useState(params.get("l") ?? "");
  const [pass, setPass] = useState("");

  const [err, setErr] = useState("");

  const logIn = api.users.loginUser.useMutation();

  return (
    <>
      <div>
        {err && <div className="text-red-500">{err}</div>}
        <div>
          E-mail:{" "}
          <input
            value={mail}
            onChange={(e) => setMail(e.currentTarget.value)}
            className="border-b-2"
          />
        </div>
        <div className="mb-2">
          Hasło:{" "}
          <input
            value={pass}
            onChange={(e) => setPass(e.currentTarget.value)}
            type="password"
            className="border-b-2"
          />
        </div>
        <button
          className="mr-2 border-2 px-2"
          onClick={async () => {
            setErr("");
            const logQuery = await logIn.mutateAsync({
              email: mail,
              password: pass,
            });

            if ("err" in logQuery) {
              setErr(logQuery.err ?? "");
              return;
            } else {
              login(logQuery.session);
              location.reload();
            }
          }}
        >
          Zaloguj
        </button>
        Nie masz konta?{" "}
        <Link href={"/register"} className="text-slate-800">
          Zarejestruj się
        </Link>
      </div>
    </>
  );
};
const Login = () => {
  const user = useUser();

  if (!user) return <Loading />;
  const uData = getUData(user);
  if (uData) {
    return <LoggedIn data={uData} />;
  } else {
    const loginFn = getLoginFn(user);
    return <LoginPage login={loginFn} />;
  }
};
export default Login;
