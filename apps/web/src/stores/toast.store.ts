import { create } from "zustand";

export interface ToastItem {
  id: string;
  message: string;
  variant: "default" | "success" | "error";
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, variant?: ToastItem["variant"]) => void;
  dismiss: (id: string) => void;
}

/**
 * Kept in its own store file rather than added to Phase 6's
 * `ui.store.ts` — toasts are a distinct, short-lived concern (auto-
 * dismissing notifications) from that store's persistent theme state,
 * and this avoids editing a Phase-6-owned file for something that
 * doesn't need to live there.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, variant = "default") => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
