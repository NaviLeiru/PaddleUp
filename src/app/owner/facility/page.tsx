"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Facility = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  cancellationPolicy: string | null;
  hasQrCode: boolean;
};

export default function FacilitySetupPage() {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/facility")
      .then((res) => res.json())
      .then((data) => {
        const f: Facility = data.facility;
        setFacility(f);
        setName(f.name);
        setLocation(f.location ?? "");
        setDescription(f.description ?? "");
        setCancellationPolicy(f.cancellationPolicy ?? "");
        if (f.hasQrCode) setQrPreview(`/api/facility/qr-code?t=${Date.now()}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/facility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        location: location || null,
        description: description || null,
        cancellationPolicy: cancellationPolicy || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string" ? data.error : "Could not save facility details."
      );
      return;
    }

    setSaved(true);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrError(null);
    setQrUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/facility/qr-code", {
      method: "POST",
      body: formData,
    });

    setQrUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setQrError(typeof data.error === "string" ? data.error : "Upload failed.");
      return;
    }

    setQrPreview(`/api/facility/qr-code?t=${Date.now()}`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return <p className="text-nav/60">Loading…</p>;
  }

  if (!facility) {
    return <p className="text-red-600">Could not load facility.</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-nav">Facility Setup</h1>
        <p className="text-nav/60">Update your facility profile and payment QR code.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Shown to players browsing courts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Facility name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cancellationPolicy">Cancellation policy</Label>
              <Textarea
                id="cancellationPolicy"
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-link">Saved.</p>}
            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment QR code</CardTitle>
          <CardDescription>
            Shown to players during checkout. PNG, JPEG, or WebP, max 2MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {qrPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrPreview}
              alt="Facility payment QR code"
              className="h-48 w-48 rounded-md border border-border object-contain"
            />
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleQrUpload}
            disabled={qrUploading}
          />
          {qrUploading && <p className="text-sm text-nav/60">Uploading…</p>}
          {qrError && <p className="text-sm text-red-600">{qrError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
