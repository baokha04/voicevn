import { Agent, routeAgentRequest } from "agents";
import {
  withVoice,
  WorkersAIFluxSTT,
  WorkersAITTS,
  type VoiceTurnContext,
} from "@cloudflare/voice";

// ─── Environment Bindings ────────────────────────────────────────────────────
export interface Env {
  /** Workers AI binding — provides STT and TTS model access. */
  AI: Ai;
  /** Durable Object namespace for VoiceVnAgent instances. */
  VoiceVnAgent: DurableObjectNamespace;
}

// ─── Voice Agent Durable Object ──────────────────────────────────────────────
const VoiceAgentBase = withVoice(Agent);

export class VoiceVnAgent extends VoiceAgentBase<Env> {
  /**
   * Continuous real-time speech-to-text.
   * WorkersAIFluxSTT uses @cf/deepgram/flux via the AI binding.
   */
  transcriber = new WorkersAIFluxSTT(this.env.AI);

  /**
   * Streaming text-to-speech.
   * Sentence-chunks the LLM response and synthesizes concurrently.
   * @cf/deepgram/aura-1 supports high-quality Vietnamese speech output.
   */
  tts = new WorkersAITTS(this.env.AI, {
    model: "@cf/deepgram/aura-1",
  });

  /**
   * Called every time the user finishes a speech turn.
   * Returns a string or AsyncIterable<string> for streaming.
   *
   * Context includes:
   *  - context.messages: full conversation history from SQLite
   *  - context.signal:   AbortSignal fired on interrupt or disconnect
   *
   * TODO: Replace the echo with an LLM call for a production agent, e.g.:
   *   const workersAI = createWorkersAI({ binding: this.env.AI });
   *   const result = streamText({ model: workersAI('@cf/moonshotai/kimi-k2.6'), ... });
   *   return result.textStream;
   */
  async onTurn(transcript: string, context: VoiceTurnContext): Promise<string> {
    // Persist the user message to conversation history.
    await this.saveMessage("user", transcript);

    // Build a simple context-aware response in Vietnamese.
    const historyLength = context.messages.length;
    const response =
      historyLength <= 1
        ? `Xin chào! Tôi đã nghe bạn nói: "${transcript}"`
        : `Bạn vừa nói: "${transcript}". Chúng ta đã nói chuyện ${historyLength} lượt.`;

    // Persist the assistant response.
    await this.saveMessage("assistant", response);

    return response;
  }

  /** Reject the call if there is already an active speaker (single-speaker mode). */
  #activeSpeakerId: string | null = null;

  beforeCallStart(connection: { id: string }): boolean {
    if (this.#activeSpeakerId !== null) return false;
    this.#activeSpeakerId = connection.id;
    return true;
  }

  onCallEnd(connection: { id: string }): void {
    if (this.#activeSpeakerId === connection.id) {
      this.#activeSpeakerId = null;
    }
  }
}

// ─── Worker Entrypoint ───────────────────────────────────────────────────────
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Route all WebSocket upgrade + Agent RPC requests to the Durable Object.
    const agentResponse = await routeAgentRequest(request, env, { cors: true });
    if (agentResponse) return agentResponse;

    // Health-check endpoint for uptime monitoring.
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({ status: "ok", service: "voicevn-agent" });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
