"use client";

import { useState, type FC } from "react";
import { getUData, useUser, type UData } from "../_components/userDataProvider";
import { api } from "@/trpc/react";
import Link from "next/link";
import { Loading } from "../_components/loading";

const LoggedIn = ({ data }: { data: UData }) => {
  return <>Logged in as: {data.nick}</>;
};

const RegisterPage = () => {
  const [mail, setMail] = useState("");
  const [mailProvider, setMailProvider] = useState("st.amu.edu.pl");
  const [pass, setPass] = useState("");
  const [nick, setNick] = useState("");
  const register = api.users.registerUser.useMutation();

  const [regErr, setRegError] = useState<string | null>(null);

  const [fieldErrs, setFieldErrs] = useState<null | {
    pass?: string;
    nick?: string;
    mail?: string;
  }>(null);

  const [registered, setRegisteredData] = useState<null | {
    email: string;
    nick: string;
  }>(null);

  if (registered) {
    return (
      <div className="mx-auto w-fit">
        New accoutn registered!
        <br />
        E-mail: {registered.email}
        <br />
        Nick: {registered.nick}
        <Link
          href={`/login?l=${registered.email}`}
          className="ml-3 border-2 px-2"
        >
          Zaloguj się
        </Link>
      </div>
    );
  }

  return (
    <>
      <div>
        {regErr && <div className="text-red-500">{regErr}</div>}
        <div>
          E-mail:{" "}
          <input
            className="border-b-2"
            value={mail}
            onChange={(e) => setMail(e.currentTarget.value)}
          />
          @
          <select
            value={mailProvider}
            onChange={(e) => setMailProvider(e.currentTarget.value)}
          >
            <option value="st.amu.edu.pl">st.amu.edu.pl</option>
            <option value="amu.edu.pl">amu.edu.pl</option>
            <option value="gmail.com">gmail.com</option>
          </select>
          {fieldErrs?.mail && (
            <div className="text-red-500">{fieldErrs?.mail}</div>
          )}
        </div>
        <div>
          Nazwa konta:{" "}
          <input
            value={nick}
            onChange={(e) => setNick(e.currentTarget.value)}
            className="border-b-2"
          />
          {fieldErrs?.nick && (
            <div className="text-red-500">{fieldErrs?.nick}</div>
          )}
        </div>
        <div className="mb-2">
          Hasło:{" "}
          <input
            value={pass}
            onChange={(e) => setPass(e.currentTarget.value)}
            type="password"
            className="border-b-2"
          />
          {fieldErrs?.pass && (
            <div className="text-red-500">{fieldErrs?.pass}</div>
          )}
        </div>
        <button
          className="mr-2 border-2 px-2"
          onClick={async () => {
            setFieldErrs(null);
            setRegError(null);
            let valid = true;
            if (pass.length < 8) {
              setFieldErrs((p) => ({
                ...p,
                pass: "Hasło musi mieć przynajmniej 8 znaków!",
              }));
              valid = false;
            }
            if (!mail) {
              setFieldErrs((p) => ({ ...p, mail: "Wpisz adres e-mail!" }));
              valid = false;
            }
            if (!nick) {
              setFieldErrs((p) => ({ ...p, nick: "Wpisz nazwę użytkownika!" }));
              valid = false;
            }
            if (!valid) return;

            const registered = await register
              .mutateAsync({
                email: mail + "@" + mailProvider,
                name: nick,
                password: pass,
              })
              .catch(
                (err: { data: { zodError: unknown }; message: string }) => {
                  if (err.data.zodError) {
                    setRegError(
                      "Nie można było utworzyć konta z podanymi danymi!",
                    );
                  } else {
                    setRegError(err.message);
                  }
                  return null;
                },
              );
            setRegisteredData(registered);
          }}
        >
          Zarejestruj
        </button>
        Masz konto?{" "}
        <Link href={"/login"} className="text-slate-800">
          Zaloguj
        </Link>
      </div>
    </>
  );
};
const Register = () => {
  const user = useUser();
  if (user === null) return <Loading />;
  const uData = getUData(user);
  if (uData) {
    return <LoggedIn data={uData} />;
  } else {
    return <RegisterPage />;
  }
};
export default Register;
