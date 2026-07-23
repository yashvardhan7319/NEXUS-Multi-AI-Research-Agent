from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search , scrape_url 
from dotenv import load_dotenv, find_dotenv
import os

# Load .env file if it exists (local dev), but never override system env vars
dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path)

GROQ_KEY = os.getenv("GROQ_API_KEY")
print("GROQ KEY LOADED:", "YES" if GROQ_KEY else "MISSING!")

#model setup — explicitly pass the key so there's zero ambiguity
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    groq_api_key=GROQ_KEY
)


#1st agent 
def build_search_agent():
    return create_agent(
        model = llm,
        tools= [web_search]
    )

#2nd agent 

def build_reader_agent():
    return create_agent(
        model = llm,
        tools = [scrape_url]
    )


#writer chain 

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer and analyst. You synthesize evidence across multiple sources into original analytical insight — you do not summarize sources one by one. Every section must say something the previous sections didn't. Repetition across sections is a critical failure."),
    ("human", """Write a highly detailed, analytical research report on the topic below. Use every piece of research provided, but synthesize it — do not restate the same facts in multiple sections.

Topic: {topic}

Research Gathered:
{research}

RULES (violating these lowers report quality):
- Each section must add NEW information or a NEW angle. Never repeat a fact, statistic, or claim already stated in an earlier section.
- Don't just describe what sources say — explain WHY it matters, what mechanism connects cause to effect, and what the evidence implies.
- Where sources disagree, conflict, or have gaps/limitations, say so explicitly — don't smooth over uncertainty.
- Open with one clear thesis statement (your central argument about this topic) and make every section serve that thesis.
- Prefer specific numbers, named studies, and named sources over vague phrases like "research shows" or "studies suggest."
- Distinguish correlation from causation explicitly wherever the research only supports correlation.

Structure the report EXACTLY in this order with these section headers:

## 1. Executive Summary
State the central thesis in 1-2 sentences first, then 4-6 sentences of supporting overview. No findings detail here — that belongs in later sections.

## 2. Topic Overview
Background and context only — definitions, scope, why this topic exists as a field of study. No statistics or findings yet.

## 3. Key Findings
Minimum 5 points. Each point = one DISTINCT mechanism or causal pathway, not restated facts. Cite the specific source/study per point.

## 4. Statistics & Data
Numbers not already used as supporting evidence in Section 3. Present as a table or bullet list with source attribution per stat.

## 5. Case Studies
Specific named real-world events/studies, explained with what makes each one distinct from the others — not a repeat of Key Findings in narrative form.

## 6. Impact Analysis
NEW analytical layer: connect findings + data + case studies into cause-effect chains. Explicitly state what's correlation vs causation. This section should not be a recap.

## 7. Stakeholder Insights
Who is affected and how their incentives/behavior differs — analytical, not just a list of groups.

## 8. Risks & Challenges
Open questions, research limitations, conflicting evidence, or unresolved debates found in the research — not generic risks.

## 9. Future Outlook
Specific trends or named initiatives from the research, not generic speculation.

## 10. Recommendations
Actionable, specific to findings above — not generic advice ("eat healthy", "stay informed").

## 11. FAQs
3-5 questions a skeptical reader would ask, with answers that cite specific evidence.

## 12. Sources
List all URLs found in the research.

If research lacks data for a section, state that clearly rather than inventing facts. Aim for analytical depth over breadth — a sharp 5-point analysis beats a vague 10-point list."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()

#critic_chain 

critic_prompt = ChatPromptTemplate.from_messages([
     ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()

search_agent = build_search_agent()
reader_agent = build_reader_agent()

#compare chain — judges two reports against each other

compare_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a sharp, impartial research report judge. Compare two reports objectively."),
    ("human", """Compare the two research reports below on the same topic. Evaluate depth, accuracy, structure, and use of evidence.

Topic: {topic}

Report A:
{report_a}

Report B:
{report_b}

Respond in this exact format:

Report A Score: X/10
Report B Score: X/10

Report A Strengths:
- ...

Report B Strengths:
- ...

Key Differences:
- ...

Winner: A or B
Reason: ..."""),
])

compare_chain = compare_prompt | llm | StrOutputParser()