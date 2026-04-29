export type LayoutId = "stack" | "split" | "magazine" | "card";

export type LayoutDef = {
  id: LayoutId;
  name: string;
  description: string;
  /** Whether the layout is implemented yet (others fall back to stack). */
  available: boolean;
};

export const LAYOUTS: Record<LayoutId, LayoutDef> = {
  stack: {
    id: "stack",
    name: "Stack",
    description: "Sve vertikalno, jedan scroll. Default.",
    available: true,
  },
  split: {
    id: "split",
    name: "Split",
    description:
      "Sticky sidebar levo (foto, kontakt, social), sadržaj desno.",
    available: true,
  },
  magazine: {
    id: "magazine",
    name: "Magazine",
    description: "Editorial masthead, serif naslovi, centrirana banner kompozicija.",
    available: true,
  },
  card: {
    id: "card",
    name: "Card",
    description: "Sve unutar jedne velike centrirane kartice.",
    available: true,
  },
};

export const LAYOUT_OPTIONS: LayoutId[] = [
  "stack",
  "split",
  "magazine",
  "card",
];
