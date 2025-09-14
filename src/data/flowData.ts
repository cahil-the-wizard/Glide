export interface FlowStep {
  id: number;
  title: string;
  status: 'complete' | 'current' | 'pending';
  estimatedTime?: string;
  description?: string;
  tasks?: string[];
  tools?: Array<{
    name: string;
    url?: string;
  }>;
  canSplit?: boolean;
}

export interface FlowDetail {
  id: number;
  title: string;
  totalSteps: number;
  completedSteps: number;
  steps: FlowStep[];
}

// Sample flow data - this will later be populated by AI responses
export const sampleFlowDetail: FlowDetail = {
  id: 1,
  title: "Job Application",
  totalSteps: 5,
  completedSteps: 2,
  steps: [
    {
      id: 1,
      title: "Step 1: Find & Save the Job Posting",
      status: 'complete',
    },
    {
      id: 2,
      title: "Step 2: Update Your Résumé",
      status: 'complete',
    },
    {
      id: 3,
      title: "Step 3: Write a Targeted Cover Letter",
      status: 'current',
      estimatedTime: "25-30 minutes",
      tools: [
        { name: "Kickresume", url: "https://kickresume.com" },
        { name: "Novoresume", url: "https://novoresume.com" }
      ],
      tasks: [
        "✍️ Write an opening that frames you enthusiasm for the role",
        "💡 Share 1–2 examples of your experience",
        "✅ Save as a PDF"
      ],
      canSplit: true
    },
    {
      id: 4,
      title: "Step 4: Prepare for the Application Portal",
      status: 'pending',
      estimatedTime: "5–10 minutes",
      tasks: [
        "📂 Gather your résumé, cover letter, and references in one folder",
        "🔍 Double-check the application requirements",
        "✅ Keep everything ready for upload"
      ],
      canSplit: true
    },
    {
      id: 5,
      title: "Step 5: Submit Your Application",
      status: 'pending',
      estimatedTime: "5–10 minutes",
      tasks: [
        "📂 Gather your résumé, cover letter, and references in one folder",
        "🔍 Double-check the application requirements",
        "✅ Keep everything ready for upload"
      ],
      canSplit: true
    }
  ]
};

// This will be expanded to include all flows
export const flowsDetailData = {
  1: sampleFlowDetail,
  // Additional flows will be added here when AI generates them
};