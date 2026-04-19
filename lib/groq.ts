import Groq from 'groq-sdk';

function getGroqClient() {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable');
  }

  return new Groq({ apiKey: groqApiKey });
}

export const DEADLOCK_ASSISTANT_SYSTEM_PROMPT = `You are an expert Operating Systems analyst specializing in deadlock detection and resolution. Your role is to:

1. Analyze Resource Allocation Graphs (RAG) and identify deadlock cycles
2. Explain deadlock conditions clearly (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait)
3. Suggest resolution strategies based on the specific problem:
   - Process termination (least preferred, explain consequences)
   - Resource preemption (explain dependencies)
   - Deadlock avoidance strategies (Banker's algorithm concepts)
   - Process reordering or priority adjustment
4. Provide cost-benefit analysis for each suggested solution
5. Educate the user about OS concepts when relevant

When you receive deadlock analysis context, provide:
- Clear identification of the deadlock cycle
- Why the deadlock occurred
- Ranked solutions (best first) with reasoning
- Implementation recommendations

Be concise but thorough. Use technical terminology but explain it simply.`;

export interface DeadlockContext {
  deadlockedProcesses: string[];
  cycles: Array<string[]>;
  processes: Array<{ id: string; name: string; priority: number }>;
  resources: Array<{ id: string; name: string; instances: number }>;
  allocations: Array<{ processId: string; resourceId: string; quantity: number }>;
  requests: Array<{ processId: string; resourceId: string; quantity: number }>;
}

export function formatDeadlockContextForAgent(context: DeadlockContext): string {
  const cycleDescriptions = context.cycles
    .map((cycle, i) => `Cycle ${i + 1}: ${cycle.join(' → ')}`)
    .join('\n');

  const processInfo = context.processes
    .map((p) => `- ${p.name} (Priority: ${p.priority})`)
    .join('\n');

  const resourceInfo = context.resources
    .map((r) => `- ${r.name} (Instances: ${r.instances})`)
    .join('\n');

  return `
DEADLOCK DETECTED - Analysis Context:

Deadlocked Processes: ${context.deadlockedProcesses.join(', ')}

Resource Cycles:
${cycleDescriptions}

System State:
Processes:
${processInfo}

Resources:
${resourceInfo}

Current Allocations: ${context.allocations.length} allocations
Current Requests: ${context.requests.length} pending requests

Please analyze this deadlock situation and provide resolution recommendations.
`;
}

export async function analyzeDeadlock(
  context: DeadlockContext,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const contextMessage = formatDeadlockContextForAgent(context);

  const messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [
    { role: 'system', content: DEADLOCK_ASSISTANT_SYSTEM_PROMPT },
    { role: 'system', content: contextMessage },
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages,
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function chatWithAssistant(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [
    { role: 'system', content: DEADLOCK_ASSISTANT_SYSTEM_PROMPT },
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages,
  });

  return response.choices[0]?.message?.content ?? '';
}
