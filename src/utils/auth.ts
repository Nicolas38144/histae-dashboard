import { AUTH_KEY, USER_KEY } from "./constants";

export const isAuthenticated = () => {
  return !!localStorage.getItem(AUTH_KEY) && !!localStorage.getItem(USER_KEY);
};

export const getToken = () => {
  return localStorage.getItem(AUTH_KEY);
};

export const getID = (): string => {
  return localStorage.getItem(USER_KEY) ?? "";
};

