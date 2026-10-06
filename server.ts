import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize Gemini SDK
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// API: Check AI status
app.get('/api/ai/status', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ available: true, hasCustomKey: hasKey, model: 'gemini-3.8-flash' });
});

// API: AI Assistant Chat
app.post('/api/ai/chat', async (req, res) => {
  const { message, context, chatHistory = [] } = req.body;
  const fallbackAnswers: Record<string, string> = {
    default: `**DataBiz Strategic Operations Insight:**

Based on your current business metrics:
• **High Demand:** Your Power BI Dashboard and SQL Data Analysis offerings generate your highest inquiry volume and conversion rates (~38%).
• **Client Strategy:** Focus on reaching out to your warm leads in "Proposal Sent" stage with an interactive sample preview or a brief 2-minute Loom video audit.
• **Content Tip:** Share a breakdown on LinkedIn showing before-and-after KPI transformation to attract more inbound enterprise inquiries.

How can I help you optimize your business pipeline next?`,
  };

  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are DataBiz AI, an elite virtual operations and strategy copilot built exclusively for a top-earning freelance Data Analyst & Business Intelligence Consultant.
The user's core specialization is:
"Data Analyst | Business Data Analysis | Power BI | Python | SQL | Excel | Data Visualization | Business Intelligence"

Current Business State Context:
${context ? JSON.stringify(context, null, 2) : 'No live context provided'}

Guidelines:
- Provide sharp, data-driven, practical, and highly actionable advice.
- When asked for proposals, outreach, or scripts, tailor them directly to high-ticket clients (founders, operations heads, e-commerce managers, CFOs).
- Keep communication confident, professional, and clear.
- Use markdown formatting with bullet points and bold headers for readability.`;

    if (ai) {
      const formattedHistory = chatHistory.slice(-6).map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.content || item.text || '' }]
      }));

      const contents = [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const reply = response.text || 'Unable to generate response.';
      return res.json({ reply, success: true });
    }

    return res.json({
      reply: fallbackAnswers.default,
      success: true,
      note: 'Generated with built-in business intelligence rules.'
    });
  } catch (error: any) {
    console.warn('Gemini chat API notice (using built-in BI rules):', error.message || error);
    return res.json({
      reply: fallbackAnswers.default,
      success: true,
      note: 'Generated with built-in business intelligence rules.'
    });
  }
});

// API: Proposal Generator
app.post('/api/ai/proposal', async (req, res) => {
  const { jobDescription, platform, budget, deadline, skills, tone = 'Professional & ROI-Focused' } = req.body;
  const fallbackProposal = `Hi there,

I reviewed your project description regarding your business reporting needs. Often with datasets like this, the bottleneck isn't just visualizing the numbers—it's ensuring clean relational data models in SQL/Power Query so your metrics never drift or lag.

Here is how I will deliver this for you:
1. **Audit & Data Modeling:** Connect your raw data sources (SQL/Excel), standardize KPIs, and build a star-schema model for lightning-fast querying.
2. **Interactive Power BI / BI Dashboard:** Build an intuitive executive view with dynamic drill-throughs, automated refreshes, and clear variance tracking.
3. **Actionable Insights & Handover:** Provide a recorded walkthrough and clean documentation so your team can self-serve reports with zero friction.

I have completed 45+ similar BI dashboards with a 100% 5-star rating across freelance platforms.

Would you prefer scheduled weekly automated refreshes or a live direct-query setup for this dataset? Looking forward to reviewing a sample table!

Best regards,
Adnan | Senior Business Data Analyst`;

  try {
    const ai = getGeminiClient();

    const prompt = `Write a winning, client-focused proposal for a Data Analyst project on ${platform || 'Upwork'}.

Details:
- Client Job Description: "${jobDescription || 'Need a Data Analyst to build a dashboard and clean SQL/Excel data'}"
- Budget: ${budget || 'Competitive hourly/fixed'}
- Target Deadline: ${deadline || 'Flexible'}
- Core Skills to highlight: ${skills || 'Power BI, SQL, Python, Excel, Business Intelligence'}
- Desired Tone: ${tone}

Strict Proposal Rules:
1. NO generic spam greetings ("Dear Hiring Manager, I am a great fit").
2. Start directly with an insightful observation about their data problem and how solving it impacts their business (revenue, time saved, clarity).
3. Outline a clear 3-step execution plan (1. Data Cleaning & Modeling, 2. Dashboard/Analysis Architecture, 3. Insights Handover & Training).
4. Cite relevant tooling (e.g., DAX, Python Pandas, SQL window functions, or Excel Power Query).
5. Provide a crisp question to prompt a reply.
6. Keep length under 280 words. Direct, punchy, persuasive.`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.65,
        }
      });
      return res.json({ proposal: response.text, success: true });
    }

    return res.json({ proposal: fallbackProposal, success: true });
  } catch (error: any) {
    console.warn('Gemini proposal API notice (using built-in proposal engine):', error.message || error);
    return res.json({ proposal: fallbackProposal, success: true });
  }
});

// API: Content Generator
app.post('/api/ai/content', async (req, res) => {
  const { contentType, topic, platform, targetAudience = 'Business owners, founders, and hiring managers' } = req.body;
  const fallbackContent = `📌 **Hook:** Most businesses don't have a sales problem—they have a data visibility problem.

Here is what happens when a company scales past $50k/month relying purely on static spreadsheets:
❌ 4+ hours wasted every Monday copy-pasting CSVs into Excel
❌ Formula errors causing discrepancies in revenue reports
❌ Zero visibility into customer retention or product return trends

Here is the exact framework I used to save an e-commerce client 18 hours/week:
1. Migrated fragmented Google Sheets into a centralized SQL database.
2. Built an automated Power BI executive dashboard with hourly sync.
3. Automated customer churn alerts directly to Slack.

The result? The leadership team now spots margin leaks in seconds instead of discovering them 3 weeks late during month-end closing.

👉 **Call to Action:** If your team is still spending hours duct-taping Excel reports, send me a message for a free 15-minute Data Architecture audit. Let's automate your reporting.

#DataAnalytics #PowerBI #BusinessIntelligence #SQL #DataVisualization #Excel #FractionalDataAnalyst`;

  try {
    const ai = getGeminiClient();

    const prompt = `You are a social media strategist for a freelance Data Analyst & Business Intelligence Consultant.
Generate high-value, client-attracting content for ${platform || 'LinkedIn'} focused on:
Content Type: ${contentType || 'LinkedIn Post'}
Topic: ${topic || 'Why spreadsheets fail at 100k rows and how Power BI fixes it'}
Target Audience: ${targetAudience}

Output must include:
1. Catchy Hook / Title
2. Main Content / Script / Caption
3. Highly Relevant Hashtags (#PowerBI #DataAnalytics #BusinessIntelligence #SQL #Python #Excel)
4. Call To Action (Encourage booking an audit or messaging for data analysis consulting)
5. Thumbnail / Visual idea (brief 1-2 sentence recommendation)`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.75,
        }
      });
      return res.json({ content: response.text, success: true });
    }

    return res.json({ content: fallbackContent, success: true });
  } catch (error: any) {
    console.warn('Gemini content API notice (using built-in content engine):', error.message || error);
    return res.json({ content: fallbackContent, success: true });
  }
});

// Configure Vite or Static Serve
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DataBiz Hub server listening on http://0.0.0.0:${port}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
