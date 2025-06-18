"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Import the server action at the top level
  const verifyDatabase = async () => {
    try {
      setLoading(true);
      // Use the server action to verify database models
      const { verifyDatabase } = await import('@/actions/database');
      const result = await verifyDatabase();
      setDbStatus(result);
    } catch (error) {
      console.error("Error verifying database:", error);
      setDbStatus({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <p className="text-xl">Hello, {user?.name || "Guest"}!</p>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Database Status</h2>
        <div className="space-x-4">
          <Button 
            onClick={verifyDatabase} 
            disabled={loading}
          >
            {loading ? "Checking..." : "Verify Database Models"}
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <>
              <Button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { seedDatabase } = await import('@/actions/database');
                    const result = await seedDatabase();
                    
                    if (result.needsConfirmation) {
                      alert(`${result.message}\n\n${result.tablesWithDataDetails}\n\nUse "Force Seed" if you want to add more test data anyway.`);
                    } else {
                      alert(result.message);
                    }
                    
                    // Refresh the database status after seeding
                    verifyDatabase();
                  } catch (error) {
                    console.error("Error seeding database:", error);
                    alert(`Error seeding database: ${error.message}`);
                  } finally {
                    setLoading(false);
                  }
                }} 
                disabled={loading}
                variant="outline"
              >
                Seed Test Data
              </Button>
              
              <Button 
                onClick={async () => {
                  if (confirm("WARNING: This will delete ALL data in your database. This action cannot be undone. Are you absolutely sure?")) {
                    setLoading(true);
                    try {
                      const { clearDatabase } = await import('@/actions/database');
                      const result = await clearDatabase();
                      alert(result.message);
                      // Refresh the database status after clearing
                      verifyDatabase();
                    } catch (error) {
                      console.error("Error clearing database:", error);
                      alert(`Error clearing database: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }
                }} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="ml-2 bg-red-500 text-white hover:bg-red-600"
              >
                Clear DB
              </Button>
            </>
          )}
        </div>
        
        {dbStatus && (
          <div className="mt-4">
            <Card className="p-4">
              <h3 className="text-xl font-semibold mb-2">
                {dbStatus.success ? "✅ Database Models Verified" : "❌ Database Check Failed"}
              </h3>
              
              {dbStatus.success && dbStatus.counts && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {Object.entries(dbStatus.counts).map(([model, count]) => (
                    <Card key={model} className="p-3 bg-gray-50">
                      <div className="text-lg font-medium capitalize">{model}</div>
                      <div className="text-2xl font-bold">{count}</div>
                    </Card>
                  ))}
                </div>
              )}
              
              {!dbStatus.success && (
                <p className="text-red-500">{dbStatus.message || dbStatus.error}</p>
              )}
            </Card>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <Card className="p-4">
          <p className="mb-4">
            To start using your manufacturing system, you need to:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Make sure your MongoDB database is properly set up and connected</li>
            <li>Configure your environment variables (check your .env file)</li>
            <li>Create initial users, products, and raw materials</li>
            <li>Set up your inventory and bills of materials</li>
          </ol>
          <p className="mt-4">
            Use the above database verification tool to ensure your models are properly registered.
          </p>
        </Card>
      </div>
    </div>
  );
}
