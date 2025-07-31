import { AUTH_KEY } from "./constants";

export const isAuthenticated = () => {
  return !!localStorage.getItem(AUTH_KEY);
};

export const getToken = () => {
  return localStorage.getItem(AUTH_KEY);
};
