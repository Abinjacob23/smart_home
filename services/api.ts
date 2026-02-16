import axios from "axios";

export const api = axios.create({
  baseURL: "http://192.168.245.245:5000",
});
