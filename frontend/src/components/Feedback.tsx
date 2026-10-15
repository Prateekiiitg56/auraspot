import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

/*
 * Lightweight, dependency-free toasts and confirm dialogs.
 * `toast` and `confirmDialog` are plain functions so they can be called from
 * any event handler; <FeedbackHost /> renders them once at the app root.
 */

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; tone: Tone; message: string };
type ConfirmRequest = {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
};

let pushToast: ((t: ToastItem) => void) | null = null;
let openConfirm: ((c: ConfirmRequest) => void) | null = null;
let nextId = 1;

const show = (tone: Tone) => (message: string) => pushToast?.({ id: nextId++, tone, message });

// eslint-disable-next-line react-refresh/only-export-components
export const toast = Object.assign(show("info"), {
  success: show("success"),
  error: show("error"),
  info: show("info")
});

// eslint-disable-next-line react-refresh/only-export-components
export const confirmDialog = (
  title: string,
  options: { message?: string; confirmLabel?: string; danger?: boolean } = {}
): Promise<boolean> =>
  new Promise((resolve) => {
    if (!openConfirm) return resolve(window.confirm(title));
    openConfirm({ title, ...options, resolve });
  });

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

export const FeedbackHost = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  useEffect(() => {
    pushToast = (t) => {
      setToasts((list) => [...list.slice(-3), t]);
      setTimeout(() => dismiss(t.id), t.tone === "error" ? 6000 : 4000);
    };
    openConfirm = setConfirm;
    return () => {
      pushToast = null;
      openConfirm = null;
    };
  }, [dismiss]);

  const close = useCallback(
    (ok: boolean) => {
      confirm?.resolve(ok);
      setConfirm(null);
    },
    [confirm]
  );

  useEffect(() => {
    if (!confirm) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, close]);

  return (
    <>
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div key={t.id} className={`toast toast-${t.tone}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{t.message}</span>
              <button className="icon-btn" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {confirm && (
        <div className="modal-backdrop" onClick={() => close(false)}>
          <div
            className="modal-panel modal-sm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-title" className="modal-title">{confirm.title}</h3>
            {confirm.message && <p className="modal-text">{confirm.message}</p>}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => close(false)}>
                Cancel
              </button>
              <button
                ref={confirmBtnRef}
                className={`btn ${confirm.danger ? "btn-danger" : "btn-solid"}`}
                onClick={() => close(true)}
              >
                {confirm.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
