import axios from "axios";

export const api = axios.create({
  baseURL: "http://10.98.246.245:5000", // 🔁 Replace with YOUR IP
});
