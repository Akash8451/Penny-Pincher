
import { AppHeader } from "@/components/layout/app-header";
import DataManagement from "@/components/settings/data-management";
import ProFeatures from "@/components/settings/pro-features";
import ThemeSettings from "@/components/settings/theme-settings";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <ThemeSettings />
        <DataManagement />
        <ProFeatures />
      </div>
    </>
  );
}
