import Groq from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error('Missing GROQ_API_KEY environment variable');
}

export const groq = new Groq({ apiKey: groqApiKey });

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
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const contextMessage = formatDeadlockContextForAgent(context);
  
  const messages: Groq.Messages.MessageParam[] = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];

  // Add context as first user message if it's the first turn
  if (messages.length === 0) {
    messages.push({
      role: 'user',
      content: contextMessage,
    });
  }

  const response = await groq.messages.create({
    model: 'mixtral-8x7b-32768',
    max_tokens: 1024,
    system: DEADLOCK_ASSISTANT_SYSTEM_PROMPT,
    messages: messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function chatWithAssistant(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const messages: Groq.Messages.MessageParam[] = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const response = await groq.messages.create({
    model: 'mixtral-8x7b-32768',
    max_tokens: 1024,
    system: DEADLOCK_ASSISTANT_SYSTEM_PROMPT,
    messages: messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
