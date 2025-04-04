"use client";

import { useState } from "react";
import { User, Building, CreditCard, Lock, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Import settings components
import { AccountSettings } from "@/components/settings/account-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { PracticeSettings } from "@/components/settings/practice-settings";
import { BillingSettings } from "@/components/settings/billing-settings";

/**
 * Settings page component
 * Provides comprehensive settings management for user account and practice
 */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  // Get the title of the active section
  const getActiveTitle = () => {
    switch (activeTab) {
      case "account":
        return "Account";
      case "security":
        return "Security";
      case "notifications":
        return "Notification";
      case "practice":
        return "Practice";
      case "billing":
        return "Billing & Subscription";
      default:
        return "Account";
    }
  };

  // Render the content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountSettings />;
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "practice":
        return <PracticeSettings />;
      case "billing":
        return <BillingSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Navigation */}
        <div className="md:w-1/4">
          <div className="sticky top-20 rounded-lg border bg-card shadow-sm">
            <div className="p-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">User Settings</h3>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`w-full flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === "account" ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === "security" ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === "notifications" ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Practice Settings</h3>
                <button
                  onClick={() => setActiveTab("practice")}
                  className={`w-full flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === "practice" ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <Building className="mr-2 h-4 w-4" />
                  Practice Info
                </button>
                <button
                  onClick={() => setActiveTab("billing")}
                  className={`w-full flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === "billing" ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing & Subscription
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">{getActiveTitle()} Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your {getActiveTitle().toLowerCase()} settings and preferences.
            </p>
            <Separator className="my-4" />
          </div>
          
          {/* Content for the selected section */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
