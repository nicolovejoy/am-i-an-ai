import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { useMatch } from "@/store/server-state/match.queries";
// import { useAuth } from "@/contexts/useAuth";

interface HealthCheckResult {
  endpoint: string;
  status: "checking" | "healthy" | "error" | "not-checked";
  responseTime?: number;
  error?: string;
}

export function AdminConsole() {
  const [healthChecks, setHealthChecks] = useState<
    Record<string, HealthCheckResult>
  >({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const [showDebugState, setShowDebugState] = useState(false);
  // const { user } = useAuth(); // TODO: Use for authentication when admin service is deployed
  
  // Get current match state for debug view
  const currentMatchId = sessionStorage.getItem('currentMatchId');
  const { data: matchState } = useMatch(currentMatchId);

  // Get all configured endpoints
  const endpoints = {
    MATCH_SERVICE_API: import.meta.env.VITE_MATCH_SERVICE_API || "NOT SET",
    MATCH_HISTORY_API: import.meta.env.VITE_MATCH_HISTORY_API || "NOT SET",
    COGNITO_USER_POOL_ID:
      import.meta.env.VITE_COGNITO_USER_POOL_ID || "NOT SET",
    COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || "NOT SET",
    DOMAIN_NAME: import.meta.env.VITE_DOMAIN_NAME || "NOT SET",
  };

  // Fallback URLs that are used in the code
  const fallbacks = {
    MATCH_SERVICE_API: "https://api.robotorchestra.org",
    MATCH_HISTORY_API: "https://api.robotorchestra.org/matches/history",
  };

  // API endpoints to test
  const apiEndpoints = [
    {
      name: "Create Match",
      url: `${endpoints.MATCH_SERVICE_API}/matches`,
      method: "OPTIONS", // Use OPTIONS to avoid creating actual matches
    },
    {
      name: "Get Match",
      url: `${endpoints.MATCH_SERVICE_API}/matches/test-id`,
      method: "OPTIONS",
    },
    {
      name: "Submit Response",
      url: `${endpoints.MATCH_SERVICE_API}/matches/test-id/responses`,
      method: "OPTIONS",
    },
    {
      name: "Submit Vote",
      url: `${endpoints.MATCH_SERVICE_API}/matches/test-id/votes`,
      method: "OPTIONS",
    },
    {
      name: "Match History",
      url: endpoints.MATCH_HISTORY_API,
      method: "OPTIONS",
    },
  ];

  const checkEndpointHealth = async (endpoint: (typeof apiEndpoints)[0]) => {
    setHealthChecks((prev) => ({
      ...prev,
      [endpoint.name]: { endpoint: endpoint.url, status: "checking" },
    }));

    const startTime = Date.now();

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseTime = Date.now() - startTime;

      setHealthChecks((prev) => ({
        ...prev,
        [endpoint.name]: {
          endpoint: endpoint.url,
          status: response.ok ? "healthy" : "error",
          responseTime,
          error: !response.ok ? `Status: ${response.status}` : undefined,
        },
      }));
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setHealthChecks((prev) => ({
        ...prev,
        [endpoint.name]: {
          endpoint: endpoint.url,
          status: "error",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
  };

  const checkAllEndpoints = () => {
    apiEndpoints.forEach((endpoint) => {
      if (endpoint.url !== "NOT SET") {
        checkEndpointHealth(endpoint);
      }
    });
  };

  const getStatusColor = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "checking":
        return "text-yellow-600";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "error":
        return "❌";
      case "checking":
        return "⏳";
      default:
        return "⭕";
    }
  };

  // Check which API URL is actually being used
  const getActiveApiUrl = () => {
    const configured = import.meta.env.VITE_MATCH_SERVICE_API;
    return configured || fallbacks.MATCH_SERVICE_API;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          🔧 Admin Console
        </h1>
        <p className="text-sm text-slate-600">
          System configuration and health monitoring
        </p>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          📋 Environment Configuration
        </h2>
        <div className="space-y-3">
          {Object.entries(endpoints).map(([key, value]) => (
            <div key={key} className="border-b pb-3 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-sm font-medium">{key}</div>
                  <div
                    className={`text-sm mt-1 ${
                      value === "NOT SET" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {value}
                  </div>
                  {fallbacks[key as keyof typeof fallbacks] &&
                    value === "NOT SET" && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⚠️ Using fallback:{" "}
                        {fallbacks[key as keyof typeof fallbacks]}
                      </div>
                    )}
                </div>
                <div
                  className={`text-sm ${
                    value === "NOT SET" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {value === "NOT SET" ? "❌ Not Configured" : "✅ Configured"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Configuration */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">🎯 Active Configuration</h2>
        <div className="bg-slate-100 p-4 rounded-lg">
          <div className="text-sm">
            <strong>API requests will go to:</strong>
            <div className="font-mono mt-2 text-blue-600">
              {getActiveApiUrl()}
            </div>
            {!import.meta.env.VITE_MATCH_SERVICE_API && (
              <div className="text-amber-600 text-xs mt-2">
                ⚠️ Using fallback URL because VITE_MATCH_SERVICE_API is not set
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* API Health Checks */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🏥 API Health Checks</h2>
          <Button onClick={checkAllEndpoints} size="sm">
            Check All Endpoints
          </Button>
        </div>

        <div className="space-y-3">
          {apiEndpoints.map((endpoint) => {
            const health = healthChecks[endpoint.name];
            const isConfigured = endpoint.url !== "NOT SET";

            return (
              <div key={endpoint.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{endpoint.name}</div>
                    <div className="text-xs text-slate-600 font-mono mt-1">
                      {endpoint.method} {endpoint.url}
                    </div>
                    {health?.error && (
                      <div className="text-xs text-red-600 mt-2">
                        Error: {health.error}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {isConfigured ? (
                      <>
                        <div
                          className={`font-medium ${getStatusColor(
                            health?.status || "not-checked"
                          )}`}
                        >
                          {getStatusIcon(health?.status || "not-checked")}{" "}
                          {health?.status || "Not checked"}
                        </div>
                        {health?.responseTime !== undefined && (
                          <div className="text-xs text-slate-500 mt-1">
                            {health.responseTime}ms
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-red-600">❌ Not configured</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">ℹ️ System Information</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Build Mode:</span>{" "}
            {process.env.NODE_ENV}
          </div>
          <div>
            <span className="font-medium">User Agent:</span>{" "}
            {typeof window !== "undefined" ? navigator.userAgent : "N/A"}
          </div>
          <div>
            <span className="font-medium">Current URL:</span>{" "}
            {typeof window !== "undefined" ? window.location.href : "N/A"}
          </div>
        </div>
      </Card>

      {/* Admin Actions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">🛠️ Admin Actions</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-red-50">
            <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              These actions cannot be undone. Please be careful.
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="danger"
                onClick={async () => {
                  if (
                    !confirm(
                      "Are you sure you want to delete ALL matches? This cannot be undone!"
                    )
                  ) {
                    return;
                  }

                  setIsDeleting(true);
                  setDeleteResult(null);

                  try {
                    // For now, skip authentication - admin service not deployed yet
                    setDeleteResult(
                      "❌ Admin service not yet deployed. Use AWS CLI to delete matches."
                    );

                    // Clear sessionStorage anyway
                    sessionStorage.clear();
                  } catch (error) {
                    setDeleteResult(
                      `❌ Error: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`
                    );
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete All Matches"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  // Only clear match-related data, not auth
                  sessionStorage.removeItem("currentMatchId");
                  sessionStorage.removeItem("matchState");

                  // Clear any match-related items from localStorage
                  const keysToRemove = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (
                      key &&
                      (key.includes("match") || key.includes("Match"))
                    ) {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach((key) => localStorage.removeItem(key));

                  setDeleteResult("✅ Match data cleared - redirecting...");
                  setTimeout(() => {
                    window.location.href = "/dashboard";
                  }, 1000);
                }}
              >
                Clear Match Data
              </Button>
            </div>

            {deleteResult && (
              <div className="mt-4 p-3 rounded bg-slate-100">
                <p className="text-sm font-mono">{deleteResult}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Debug Actions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">🐛 Debug Actions</h2>
        <div className="space-y-3">
          <Button
            onClick={() => {
              console.log("Environment Variables:", endpoints);
              console.log("Active API URL:", getActiveApiUrl());
              console.log("Health Check Results:", healthChecks);
              alert("Check browser console for debug information");
            }}
            variant="secondary"
            size="sm"
          >
            Log Debug Info to Console
          </Button>

          <Button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              alert("Local storage cleared. Refresh the page.");
            }}
            variant="danger"
            size="sm"
            className="ml-3"
          >
            Clear Local Storage
          </Button>
        </div>
      </Card>

      {/* Match State Debug View */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🔍 Match State Debug View</h2>
          <Button
            onClick={() => setShowDebugState(!showDebugState)}
            variant="secondary"
            size="sm"
          >
            {showDebugState ? 'Hide' : 'Show'} Raw State
          </Button>
        </div>
        
        {currentMatchId ? (
          <>
            <div className="text-sm text-slate-600 mb-2">
              Current Match ID: <span className="font-mono">{currentMatchId}</span>
            </div>
            
            {showDebugState && matchState && (
              <div className="bg-slate-100 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs font-mono">
                  {JSON.stringify(matchState, null, 2)}
                </pre>
              </div>
            )}
            
            {showDebugState && !matchState && (
              <div className="text-sm text-slate-500">
                Loading match state...
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-500">
            No active match. Start a match to see debug information.
          </div>
        )}
      </Card>

      {/* AWS Cost Monitoring */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">💰 AWS Cost Monitoring</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Bedrock Usage & Quotas</h3>
            <p className="text-sm text-blue-800 mb-3">
              Monitor your AWS Bedrock usage to avoid rate limiting issues:
            </p>
            <ol className="text-sm text-blue-800 space-y-2 ml-4">
              <li>1. Open AWS Console → Bedrock → Model access</li>
              <li>2. Check your enabled models (Claude 3 Haiku/Sonnet)</li>
              <li>3. Go to Service Quotas → AWS Bedrock</li>
              <li>4. Monitor "Tokens per minute" limits</li>
            </ol>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Estimated Monthly Costs</h3>
            <div className="text-sm space-y-1">
              <div>• Lambda: ~$5-10 (invocations + compute)</div>
              <div>• DynamoDB: ~$1-2 (storage + requests)</div>
              <div>• S3/CloudFront: ~$1 (hosting)</div>
              <div>• Bedrock: ~$1-5 (AI responses)</div>
              <div className="font-medium mt-2">Total: ~$8-18/month</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
