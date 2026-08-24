/**
 * Kafka producer/consumer — event bus for the WaaS platform.
 * Falls back to in-memory EventEmitter when KAFKA_BROKERS is not set.
 */

import { EventEmitter } from "events";
import type { Consumer, EachMessagePayload } from "kafkajs";

export interface WaaSEvent {
  topic: string;
  key?: string;
  value: Record<string, unknown>;
  timestamp?: string;
}

interface EventBus {
  publish(event: WaaSEvent): Promise<void>;
  subscribe(topic: string, handler: (msg: WaaSEvent) => void): Promise<void>;
  disconnect(): Promise<void>;
}

// In-memory fallback
class MemoryBus implements EventBus {
  private emitter = new EventEmitter();

  async publish(event: WaaSEvent) {
    this.emitter.emit(event.topic, { ...event, timestamp: event.timestamp ?? new Date().toISOString() });
  }

  async subscribe(topic: string, handler: (msg: WaaSEvent) => void) {
    this.emitter.on(topic, handler);
  }

  async disconnect() {
    this.emitter.removeAllListeners();
  }
}

let _bus: EventBus | null = null;

export async function getEventBus(): Promise<EventBus> {
  if (_bus) return _bus;

  const brokers = process.env.KAFKA_BROKERS;
  if (brokers) {
    try {
      // Dynamic require to avoid Next.js bundler resolving kafkajs at build time
      const kafkajs = await (Function('return import("kafkajs")')() as Promise<typeof import("kafkajs")>);
      const { Kafka } = kafkajs;
      const kafka = new Kafka({
        clientId: "waas-platform",
        brokers: brokers.split(","),
      });

      const producer = kafka.producer();
      await producer.connect();

      const consumers = new Map<string, Consumer>();

      _bus = {
        async publish(event) {
          await producer.send({
            topic: event.topic,
            messages: [{
              key: event.key ?? undefined,
              value: JSON.stringify({ ...event.value, timestamp: event.timestamp ?? new Date().toISOString() }),
            }],
          });
        },
        async subscribe(topic, handler) {
          if (!consumers.has(topic)) {
            const consumer = kafka.consumer({ groupId: `waas-${topic}` });
            await consumer.connect();
            await consumer.subscribe({ topic, fromBeginning: false });
            await consumer.run({
              eachMessage: async ({ message }: EachMessagePayload) => {
                try {
                  const rawValue = message.value?.toString();
                  if (!rawValue) return;
                  const value = JSON.parse(rawValue) as Record<string, unknown>;
                  handler({ topic, key: message.key?.toString(), value });
                } catch { /* skip bad messages */ }
              },
            });
            consumers.set(topic, consumer);
          }
        },
        async disconnect() {
          await producer.disconnect();
          for (const c of consumers.values()) await c.disconnect();
        },
      };
      return _bus;
    } catch {
      console.warn("[kafka] kafkajs not available, using in-memory event bus");
    }
  }

  _bus = new MemoryBus();
  return _bus;
}

// Standard topics
export const TOPICS = {
  WALLET_CONNECTED: "wallet.connected",
  WALLET_DISCONNECTED: "wallet.disconnected",
  TRANSACTION_SUBMITTED: "tx.submitted",
  TRANSACTION_CONFIRMED: "tx.confirmed",
  TRANSACTION_FAILED: "tx.failed",
  CHAIN_SWITCHED: "chain.switched",
  CONTRACT_DEPLOYED: "contract.deployed",
  CONTRACT_CALLED: "contract.called",
  APPROVAL_GRANTED: "approval.granted",
  RELAY_EXECUTED: "relay.executed",
} as const;
