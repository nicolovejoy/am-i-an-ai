import { Card } from "./ui";
import { useEffect, useState } from "react";

interface RobotInfo {
  id: string;
  name: string;
  personality: string;
  status: 'waiting' | 'thinking' | 'responded';
  delay: number;
}

const ROBOTS: RobotInfo[] = [
  { id: 'B', name: 'Doc', personality: 'Philosophical & poetic', status: 'waiting', delay: 0 },
  { id: 'C', name: 'Happy', personality: 'Analytical & scientific', status: 'waiting', delay: 2000 },
  { id: 'D', name: 'Dopey', personality: 'Whimsical & comedic', status: 'waiting', delay: 4000 },
];

interface RobotResponseStatusProps {
  responsesReceived: number;
}

export default function RobotResponseStatus({ responsesReceived }: RobotResponseStatusProps) {
  const [robotStatuses, setRobotStatuses] = useState<RobotInfo[]>(ROBOTS);
  const startTime = useState(Date.now())[0];

  useEffect(() => {
    // Update robot statuses based on elapsed time
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      setRobotStatuses(ROBOTS.map(robot => {
        if (elapsed >= robot.delay && elapsed < robot.delay + 3000) {
          return { ...robot, status: 'thinking' };
        } else if (elapsed >= robot.delay + 3000) {
          return { ...robot, status: 'responded' };
        }
        return { ...robot, status: 'waiting' };
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const getStatusIcon = (status: RobotInfo['status']) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'thinking': return '🤔';
      case 'responded': return '✅';
    }
  };

  const getStatusText = (status: RobotInfo['status']) => {
    switch (status) {
      case 'waiting': return 'Waiting...';
      case 'thinking': return 'Thinking...';
      case 'responded': return 'Ready!';
    }
  };

  return (
    <Card className="text-center">
      <div className="py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium mb-2">Response submitted!</h3>
        <p className="text-slate-600 mb-6">
          Waiting for other participants...
        </p>
        
        {/* Robot Status Grid */}
        <div className="space-y-3 max-w-md mx-auto">
          <div className="text-sm font-medium text-slate-700 mb-2">
            AI Participants Status:
          </div>
          
          {robotStatuses.map((robot) => (
            <div key={robot.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(robot.status)}</span>
                    <span>{robot.name} (Player {robot.id})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {robot.personality}
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  robot.status === 'responded' ? 'text-green-600' : 
                  robot.status === 'thinking' ? 'text-amber-600' : 
                  'text-slate-400'
                }`}>
                  {getStatusText(robot.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 space-y-2">
          <div className="text-sm text-slate-500">
            {responsesReceived}/4 responses received
          </div>
          
          {/* Fun fact about staggered processing */}
          <div className="text-xs text-slate-400 italic max-w-sm mx-auto mt-4">
            💡 AI responses are processed with slight delays to ensure smooth operation
          </div>
        </div>
      </div>
    </Card>
  );
}