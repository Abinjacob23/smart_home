import axios from "axios";
import Constants from "expo-constants";

const host =
  Constants.expoConfig?.hostUri?.split(":")[0] ??
  Constants.manifest?.debuggerHost?.split(":")[0];

export const api = axios.create({
  baseURL: `http://${host}:5000`,
});