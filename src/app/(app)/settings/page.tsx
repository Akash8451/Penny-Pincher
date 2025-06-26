
import { AppHeader } from "@/components/layout/app-header";
import DataManagement from "@/components/settings/data-management";
import ProFeatures from "@/components/settings/pro-features";
import RegionalSettings from "@/components/settings/regional-settings";
import ThemeSettings from "@/components/settings/theme-settings";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ThemeSettings />
          <RegionalSettings />
        </div>
        <DataManagement />
        <ProFeatures />
      </div>
    </>
  );
}
