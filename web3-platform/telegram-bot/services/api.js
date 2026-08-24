import axios from "axios";
import config from "../config.js";

export async function apiRequest(path, method, token, data = {}) {
  const res = await axios({
    url: `${config.apiBase}${path}`,
    method,
    data,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.data;
}
