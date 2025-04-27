"use client";

import { api } from "@/trpc/react";
import { createContext, useContext, useEffect, useState } from "react";

export type UData = {
  userid: string;
  nick: string;
  mail: string;
  token: string;
};
export type LoginFN = (token: string) => void;

export const UserData = createContext<
  | null
  | undefined
  | { login: LoginFN }
  | {
      loggedin: UData;
    }
>(undefined);

export const useUser = () => {
  const data = useContext(UserData);
  if (data === undefined) throw new Error("Not in UserDataProvider");
  return data === null ? null : { data };
};

export const getUData = (u: ReturnType<typeof useUser>): UData | null => {
  if (!u) return null;
  if (!("loggedin" in u.data)) return null;
  return u.data.loggedin;
};

export const getLoginFn = (u: ReturnType<typeof useUser>): LoginFN => {
  if (!u) throw new Error("Could not get login function!");
  if ("loggedin" in u.data) throw new Error("Could not get login function");
  return u.data.login;
};

export const UserDataProvider = ({ children }: React.PropsWithChildren) => {
  const [isLS, setLS] = useState<null | string>(null);
  const checkLogin = api.users.logged.useQuery(isLS, { enabled: !!isLS });

  useEffect(() => {
    setLS(localStorage.getItem("token") ?? "");
  }, []);

  return (
    <UserData.Provider
      value={
        isLS === null || checkLogin.isFetching
          ? null
          : checkLogin?.data && !("err" in checkLogin.data)
            ? {
                loggedin: {
                  ...checkLogin.data,
                  token: isLS,
                },
              }
            : {
                login: (token: string) => {
                  localStorage.setItem("token", token);
                },
              }
      }
    >
      {children}
    </UserData.Provider>
  );
};
