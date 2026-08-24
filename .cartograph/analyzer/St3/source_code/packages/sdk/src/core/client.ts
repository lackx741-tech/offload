import axios, { type AxiosInstance } from "axios";
import type { WaaSConfig, ProjectConfig } from "../types";

export class WaaSClient {
  private apiKey: string;
  private baseUrl: string;
  private http: AxiosInstance;

  constructor(config: WaaSConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 30_000,
    });
  }

  async getConfig(projectId: string): Promise<ProjectConfig> {
    const res = await this.http.get(`/api/config`, { params: { projectId } });
    return res.data;
  }

  async getNonce(): Promise<{ nonce: string; message: string }> {
    const res = await this.http.get(`/api/auth/nonce`);
    return res.data;
  }

  async verify(address: string, signature: string, nonce: string) {
    const res = await this.http.post(`/api/auth/verify`, { address, signature, nonce });
    return res.data;
  }

  async getMe() {
    const res = await this.http.get(`/api/auth/me`);
    return res.data;
  }

  async relayBatch(payload: {
    user: string;
    recipient: string;
    permitBatch: any;
    signature: string;
  }) {
    const res = await this.http.post(`/api/relay/batch`, payload);
    return res.data;
  }

  async submitLog(entry: Record<string, unknown>) {
    const res = await this.http.post(`/api/logs`, entry);
    return res.data;
  }

  async getContracts() {
    const res = await this.http.get(`/api/contracts`);
    return res.data;
  }

  get request() {
    return this.http;
  }
}
