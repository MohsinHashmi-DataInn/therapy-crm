"use client";

import { MessageSquare, Mail, Phone, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Communications page component (placeholder)
 * Future implementation will handle client communications, messages, and notifications
 */
export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState("messages");

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Communications</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            New Email
          </Button>
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
      </div>

      {/* Custom tab navigation */}
      <div className="border-b mb-4">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("messages")}
            className={`pb-2 pt-1 px-1 ${activeTab === "messages" ? "border-b-2 border-primary font-medium" : "text-gray-500"}`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("emails")}
            className={`pb-2 pt-1 px-1 ${activeTab === "emails" ? "border-b-2 border-primary font-medium" : "text-gray-500"}`}
          >
            Emails
          </button>
          <button
            onClick={() => setActiveTab("calls")}
            className={`pb-2 pt-1 px-1 ${activeTab === "calls" ? "border-b-2 border-primary font-medium" : "text-gray-500"}`}
          >
            Phone Calls
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-2 pt-1 px-1 ${activeTab === "templates" ? "border-b-2 border-primary font-medium" : "text-gray-500"}`}
          >
            Templates
          </button>
        </div>
      </div>
      
      {/* Messages Tab Content */}
      {activeTab === "messages" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Manage client messages and communication history.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-center text-gray-500 max-w-md">
              The messaging functionality is currently under development. 
              This feature will allow you to send and manage messages to clients.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Emails Tab Content */}
      {activeTab === "emails" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Emails</CardTitle>
            <CardDescription>
              Send and manage email communications with clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            <Mail className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-center text-gray-500 max-w-md">
              Email functionality is currently under development.
              This feature will allow you to send, track, and manage client emails.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Phone Calls Tab Content */}
      {activeTab === "calls" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Phone Calls</CardTitle>
            <CardDescription>
              Log and track phone communications with clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            <Phone className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-center text-gray-500 max-w-md">
              Call logging functionality is currently under development.
              This feature will allow you to record and track client phone calls.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Templates Tab Content */}
      {activeTab === "templates" && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Communication Templates</CardTitle>
            <CardDescription>
              Create and manage reusable message templates.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            <Settings className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-center text-gray-500 max-w-md">
              Template management is currently under development.
              This feature will allow you to create reusable message templates for common communications.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
