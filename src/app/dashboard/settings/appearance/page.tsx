import type { Metadata } from "next";
import { ThemeForm } from "@/components/settings/theme-form";

export const metadata: Metadata = { title: "Appearance" };

export default function AppearanceSettingsPage() {
  return <ThemeForm />;
}
