"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SurfaceType = "INDOOR" | "OUTDOOR";

type Court = {
  id: string;
  name: string;
  surfaceType: SurfaceType;
  pricePerHour: string;
};

const selectClass =
  "flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-nav focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nav";

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCourts = () => {
    fetch("/api/courts")
      .then((res) => res.json())
      .then((data) => setCourts(data.courts))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourts();
  }, []);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-nav">Courts</h1>
        <p className="text-nav/60">Manage courts, surface type, and pricing.</p>
      </div>

      <AddCourtForm onCreated={loadCourts} />

      {loading ? (
        <p className="text-nav/60">Loading…</p>
      ) : courts.length === 0 ? (
        <p className="text-nav/60">No courts yet — add your first one above.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {courts.map((court) =>
            editingId === court.id ? (
              <EditCourtForm
                key={court.id}
                court={court}
                onSaved={() => {
                  setEditingId(null);
                  loadCourts();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card key={court.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-nav">{court.name}</p>
                    <p className="text-sm text-nav/60">
                      {court.surfaceType === "INDOOR" ? "Indoor" : "Outdoor"} · ₱
                      {Number(court.pricePerHour).toFixed(2)}/hr
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditingId(court.id)}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}

function AddCourtForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [surfaceType, setSurfaceType] = useState<SurfaceType>("OUTDOOR");
  const [pricePerHour, setPricePerHour] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/courts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        surfaceType,
        pricePerHour: Number(pricePerHour),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not add court.");
      return;
    }

    setName("");
    setSurfaceType("OUTDOOR");
    setPricePerHour("");
    onCreated();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add court</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[160px] flex-1 flex-col gap-2">
            <Label htmlFor="court-name">Name</Label>
            <Input id="court-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="court-surface">Surface</Label>
            <select
              id="court-surface"
              className={selectClass}
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
            >
              <option value="OUTDOOR">Outdoor</option>
              <option value="INDOOR">Indoor</option>
            </select>
          </div>
          <div className="flex w-32 flex-col gap-2">
            <Label htmlFor="court-price">Price/hr</Label>
            <Input
              id="court-price"
              type="number"
              min="0"
              step="0.01"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add court"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

function EditCourtForm({
  court,
  onSaved,
  onCancel,
}: {
  court: Court;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(court.name);
  const [surfaceType, setSurfaceType] = useState<SurfaceType>(court.surfaceType);
  const [pricePerHour, setPricePerHour] = useState(court.pricePerHour);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/courts/${court.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        surfaceType,
        pricePerHour: Number(pricePerHour),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not save court.");
      return;
    }

    onSaved();
  };

  return (
    <Card className={cn("border-nav")}>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[160px] flex-1 flex-col gap-2">
            <Label htmlFor={`name-${court.id}`}>Name</Label>
            <Input id={`name-${court.id}`} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`surface-${court.id}`}>Surface</Label>
            <select
              id={`surface-${court.id}`}
              className={selectClass}
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
            >
              <option value="OUTDOOR">Outdoor</option>
              <option value="INDOOR">Indoor</option>
            </select>
          </div>
          <div className="flex w-32 flex-col gap-2">
            <Label htmlFor={`price-${court.id}`}>Price/hr</Label>
            <Input
              id={`price-${court.id}`}
              type="number"
              min="0"
              step="0.01"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
