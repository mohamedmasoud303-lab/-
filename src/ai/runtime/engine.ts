import { GoogleGenAI, Type } from "@google/genai";
import { RentrixOperatorAgent } from '../agents/RentrixOperatorAgent';
import { fetchSystemContext } from '../memory/systemContext';
import { AgentResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const runRentrixAgent = async (input: string): Promise<AgentResult> => {
  const context = await fetchSystemContext();
  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are the ${RentrixOperatorAgent.name}, an ${RentrixOperatorAgent.role}.
    Your goals are: ${RentrixOperatorAgent.goals.join(', ')}.
    
    Current System Context:
    - Total Units: ${context.total_units}
    - Active Contracts: ${context.active_contracts}
    - Tenants Count: ${context.tenants_count}
    - Overdue Invoices: ${context.overdue_invoices}
    - Monthly Revenue: ${context.monthly_revenue}
    - Timestamp: ${context.timestamp}

    You have access to tools. Use them to execute tasks.
    When a user asks for a report, reminder, or data, use the appropriate tool.
    Always provide a thought process before calling a tool.
  `;

  const tools = RentrixOperatorAgent.tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters || { type: Type.OBJECT, properties: {} }
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: input,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: tools as any }],
      }
    });

    const thought = response.text || "Analyzing the request...";
    const functionCalls = response.functionCalls;
    const toolResults: any[] = [];

    if (functionCalls) {
      for (const call of functionCalls) {
        const tool = RentrixOperatorAgent.tools.find(t => t.name === call.name);
        if (tool) {
          const result = await tool.execute(call.args);
          toolResults.push({
            tool: call.name,
            args: call.args,
            result
          });
        }
      }
    }

    // If there were tool calls, we might want to get a final response from the model
    // But for simplicity in this runtime, we'll return the results directly
    let finalResponse = thought;
    if (toolResults.length > 0) {
      const summaryResponse = await ai.models.generateContent({
        model,
        contents: [
          { text: input },
          { text: `Tool results: ${JSON.stringify(toolResults)}` }
        ],
        config: {
          systemInstruction: "Summarize the actions taken and the results for the user."
        }
      });
      finalResponse = summaryResponse.text || "Tasks completed successfully.";
    }

    return {
      thought,
      toolCalls: toolResults,
      response: finalResponse,
      status: 'success'
    };
  } catch (error: any) {
    console.error('Agent Runtime Error:', error);
    return {
      thought: "An error occurred during execution.",
      response: `Error: ${error.message}`,
      status: 'error'
    };
  }
};
