import { useState } from "react";
import type { FormEvent } from "react";
import { CATEGORIES, PRIORITIES } from "./maintenanceMeta";
import { apiJson, readError } from "../services/api";
import { toast } from "./Feedback";

/** Tenant form for raising a maintenance request on a rented property. */
export const MaintenanceRequestForm = ({
  properties,
  onCreated,
  onCancel
}: {
  properties: { _id: string; title: string }[];
  onCreated: () => void;
  onCancel: () => void;
}) => {
  const [propertyId, setPropertyId] = useState(properties[0]?._id || "");
  const [category, setCategory] = useState("PLUMBING");
  const [priority, setPriority] = useState("MEDIUM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiJson("/maintenance", "POST", { propertyId, category, priority, title, description });
      if (!res.ok) throw new Error(await readError(res, "Could not submit the request"));
      toast.success("Request sent to the owner");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit the request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {properties.length > 1 && (
        <div className="field">
          <label htmlFor="m-property">Property</label>
          <select id="m-property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            {properties.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div className="form-row">
        <div className="field">
          <label htmlFor="m-category">Category</label>
          <select id="m-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="m-priority">Priority</label>
          <select id="m-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="m-title">Short summary</label>
        <input id="m-title" type="text" maxLength={100} placeholder="e.g. Kitchen sink is leaking" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="m-desc">Details</label>
        <textarea id="m-desc" rows={4} maxLength={1000} placeholder="What happened, since when, and when you’re available for a visit" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-solid" disabled={submitting || !propertyId || !title.trim() || !description.trim()}>
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </form>
  );
};
