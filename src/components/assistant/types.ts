/**
 * Frontend tipovi za asistent UI.
 */

export type Proposal = {
  type:
    | "create_lesson"
    | "mark_payment"
    | "reschedule_lesson"
    | "cancel_lesson"
    | "add_homework";
  params: Record<string, unknown>;
  summary: Record<string, unknown>;
};

export type ChatBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export type UIMessage = {
  id: string;
  role: "user" | "assistant";
  /** Pretvoren u plain text + opcioni proposal/navigation pin. */
  text: string;
  proposal?: Proposal;
  /** Kad je proposal potvrđen ili odbijen, prelazi u final state. */
  proposalState?: "pending" | "confirmed" | "rejected";
};
