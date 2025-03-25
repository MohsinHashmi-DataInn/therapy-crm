'use client';

import { useState } from 'react';
import { Shield, Lock, FileText, Eye, EyeOff } from 'lucide-react';

interface PrivacyControlsProps {
  containsSensitiveData?: boolean;
  dataCategories?: string[];
  allowDataSharing?: boolean;
  onDataSharingChange?: (allowSharing: boolean) => void;
}

/**
 * Privacy Controls component implementing Compliance & Privacy Framework from section 16.1
 * - HIPAA compliance controls
 * - Data privacy management
 * - User consent tracking
 */
export function PrivacyControls({
  containsSensitiveData = false,
  dataCategories = [],
  allowDataSharing = false,
  onDataSharingChange,
}: PrivacyControlsProps) {
  const [dataSharingEnabled, setDataSharingEnabled] = useState(allowDataSharing);
  const [showPhi, setShowPhi] = useState(false);

  // Handle toggling data sharing permissions
  const handleDataSharingToggle = () => {
    const newValue = !dataSharingEnabled;
    setDataSharingEnabled(newValue);
    if (onDataSharingChange) {
      onDataSharingChange(newValue);
    }
  };

  // Log PHI access for audit trail (HIPAA compliance)
  const handleTogglePhiVisibility = () => {
    const newVisibilityState = !showPhi;
    setShowPhi(newVisibilityState);
    
    // In production, this would log to a secure audit trail
    if (newVisibilityState && containsSensitiveData) {
      console.info('PHI Access:', {
        timestamp: new Date().toISOString(),
        action: 'view',
        categories: dataCategories,
        user: 'current_user', // Would be actual user ID in production
      });
    }
  };

  return (
    <div className="rounded-md bg-white shadow">
      {/* HIPAA compliance banner for PHI data */}
      {containsSensitiveData && (
        <div className="bg-blue-50 px-4 py-2 rounded-t-md border-b border-blue-100">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-blue-800">
              Protected Health Information (PHI)
            </span>
            <button
              onClick={handleTogglePhiVisibility}
              className="ml-auto p-1 rounded-full hover:bg-blue-100"
              aria-label={showPhi ? "Hide protected health information" : "Show protected health information"}
            >
              {showPhi ? (
                <EyeOff className="h-4 w-4 text-blue-500" />
              ) : (
                <Eye className="h-4 w-4 text-blue-500" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main privacy controls */}
      <div className="p-4">
        {dataCategories.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Data Categories</h3>
            <div className="flex flex-wrap gap-2">
              {dataCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Data sharing controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Data Sharing</span>
          </div>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              type="checkbox"
              name="data-sharing"
              id="data-sharing"
              checked={dataSharingEnabled}
              onChange={handleDataSharingToggle}
              className="sr-only"
              aria-labelledby="data-sharing-label"
            />
            <label
              htmlFor="data-sharing"
              className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                dataSharingEnabled ? 'bg-teal-500' : ''
              }`}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                  dataSharingEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </label>
          </div>
        </div>

        {/* HIPAA Privacy Policy link */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href="/legal/hipaa-notice"
            className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700"
          >
            <FileText className="h-4 w-4 mr-1" />
            HIPAA Notice of Privacy Practices
          </a>
        </div>
      </div>
    </div>
  );
}
