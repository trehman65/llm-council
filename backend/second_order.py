"""Second-Order Impact Analysis Engine for Product Management.

This module implements the analytical frameworks from "The Second-Order Toolkit"
to analyze cascading consequences of product decisions.
"""

import re
from typing import List, Dict, Any, Tuple
from .openrouter import query_model
from .config import CHAIRMAN_MODEL


# System Archetypes and Mental Models from the research
SYSTEM_ARCHETYPES = [
    "Shifting the Burden",
    "Tragedy of the Commons",
    "Limits to Growth",
    "Drifting Goals",
    "Success to the Successful"
]

MENTAL_MODELS = [
    "Chesterton's Fence",
    "The Cobra Effect (Perverse Incentives)",
    "Inversion",
    "The 10-10-10 Rule"
]


async def analyze_first_order_impacts(problem: str, solution: str) -> Dict[str, Any]:
    """
    Stage 1: Analyze immediate, first-order consequences.
    
    First-order consequences are the direct, intended results of an action.
    They are characterized by immediate feedback loops and high visibility.
    """
    prompt = f"""You are a strategic product management advisor analyzing a product decision.

PROBLEM STATEMENT:
{problem}

PROPOSED SOLUTION:
{solution}

CRITICAL INSTRUCTIONS:
1. Focus ONLY on IMMEDIATE, DIRECT impacts that happen right away
2. Do NOT include reactions, adaptations, or downstream effects (those are second-order)
3. Do NOT include long-term structural changes (those are third-order)
4. First-order = what happens immediately as a direct result of the solution

Analyze the FIRST-ORDER CONSEQUENCES (immediate, direct, intended results) of this solution.

Structure your analysis as follows:

1. IMMEDIATE METRICS IMPACT
   - What metrics will improve immediately?
   - What KPIs will show positive movement?
   - Quantify expected changes where possible

2. DIRECT USER IMPACT
   - How will users immediately experience this change?
   - What immediate behaviors will change?
   - What immediate value will users receive?

3. IMMEDIATE OPERATIONAL IMPACT
   - What immediate changes to processes/workflows?
   - What immediate resource requirements?
   - What immediate costs or savings?

4. IMMEDIATE MARKET IMPACT
   - How will competitors react immediately?
   - What immediate market signals?
   - What immediate positioning changes?

Provide a comprehensive, structured analysis. Be specific and actionable."""

    messages = [{"role": "user", "content": prompt}]
    response = await query_model(CHAIRMAN_MODEL, messages)
    
    if not response:
        return {
            "analysis": "Failed to generate first-order analysis. Please try again.",
            "metrics_impact": [],
            "user_impact": [],
            "operational_impact": [],
            "market_impact": []
        }
    
    return {
        "analysis": response.get('content', ''),
        "stage": "first_order"
    }


async def analyze_second_order_impacts(
    problem: str,
    solution: str,
    first_order_analysis: str
) -> Dict[str, Any]:
    """
    Stage 2: Analyze second-order consequences using the "And Then What?" protocol.
    
    Second-order consequences are the reactions of the system to the first-order change.
    They often involve a time delay and a response from system agents.
    """
    # Extract key first-order points for linking
    prompt = f"""You are a strategic product management advisor using Second-Order Thinking.

PROBLEM STATEMENT:
{problem}

PROPOSED SOLUTION:
{solution}

FIRST-ORDER ANALYSIS:
{first_order_analysis}

CRITICAL INSTRUCTIONS:
1. DO NOT repeat or restate anything from the first-order analysis
2. Second-order consequences are the NEXT LEVEL - reactions and adaptations that happen AFTER the first-order impacts
3. Focus on what happens NEXT, not what already happened
4. Start your analysis with: "First Order: [brief 1-2 sentence summary of key first-order impact]. And Then What? (Second Order):"

Now analyze SECOND-ORDER CONSEQUENCES using the "And Then What?" protocol.

Second-order consequences are the REACTIONS of the system to the first-order change.
They involve time delays and responses from users, competitors, internal teams, and the market.

These are NOT the same as first-order impacts. They are what happens NEXT as a result of those first-order changes.

For each first-order impact, ask "And then what?" to identify:

1. USER ADAPTATION & BEHAVIORAL SHIFTS
   - How will users adapt to the first-order change?
   - What new behaviors will emerge?
   - What unintended usage patterns?
   - How will power users vs casual users react differently?

2. COMPETITIVE & MARKET REACTIONS
   - How will competitors respond?
   - What market dynamics will shift?
   - How will pricing/positioning change?
   - What new threats or opportunities emerge?

3. INTERNAL SYSTEM STRESSES
   - What operational bottlenecks will emerge?
   - How will support/engineering teams be impacted?
   - What new infrastructure demands?
   - What team capacity constraints?

4. TECHNICAL DEBT & ARCHITECTURAL CONSEQUENCES
   - What technical shortcuts will be taken?
   - What scalability issues will emerge?
   - What maintenance burden increases?
   - What architectural compromises?

5. ORGANIZATIONAL & CULTURAL SHIFTS
   - How will team dynamics change?
   - What new processes will be needed?
   - How will decision-making change?
   - What cultural implications?

Apply these mental models where relevant:
- Chesterton's Fence: What "fences" (safeguards) might this remove?
- The Cobra Effect: What perverse incentives might this create?
- System Archetypes: Which archetypes (Shifting the Burden, Tragedy of the Commons, etc.) apply?

Provide a comprehensive analysis with specific, actionable insights."""

    messages = [{"role": "user", "content": prompt}]
    response = await query_model(CHAIRMAN_MODEL, messages)
    
    if not response:
        return {
            "analysis": "Failed to generate second-order analysis. Please try again.",
            "user_adaptations": [],
            "competitive_reactions": [],
            "system_stresses": [],
            "technical_debt": [],
            "organizational_shifts": []
        }
    
    return {
        "analysis": response.get('content', ''),
        "stage": "second_order"
    }


async def analyze_third_order_impacts(
    problem: str,
    solution: str,
    first_order_analysis: str,
    second_order_analysis: str
) -> Dict[str, Any]:
    """
    Stage 3: Analyze third-order consequences (structural, long-term shifts).
    
    Third-order consequences are the long-term shifts in the system's structure,
    culture, or market position caused by the accumulation of previous effects.
    """
    prompt = f"""You are a strategic product management advisor analyzing THIRD-ORDER CONSEQUENCES.

PROBLEM STATEMENT:
{problem}

PROPOSED SOLUTION:
{solution}

FIRST-ORDER ANALYSIS:
{first_order_analysis}

SECOND-ORDER ANALYSIS:
{second_order_analysis}

CRITICAL INSTRUCTIONS:
1. DO NOT repeat anything from first-order or second-order analyses
2. Third-order consequences are the NEXT LEVEL - structural shifts that happen AFTER the second-order reactions
3. Focus on what happens NEXT at a deeper, more fundamental level
4. Start your analysis with: "Second Order: [brief 1-2 sentence summary of key second-order impact]. Third Order (The Structural Shift):"

Now analyze THIRD-ORDER CONSEQUENCES (structural, long-term, often irreversible shifts).

Third-order consequences are the LONG-TERM STRUCTURAL CHANGES that occur AFTER the second-order reactions.
These are NOT the same as first or second-order impacts. They represent fundamental shifts in the system's structure.

Third-order consequences are the LONG-TERM STRUCTURAL CHANGES to:
- System architecture and capabilities
- Market position and brand identity
- Organizational culture and capabilities
- User relationships and trust
- Competitive landscape

Consider:

1. STRUCTURAL SYSTEM CHANGES
   - How does this fundamentally alter the product architecture?
   - What irreversible technical decisions?
   - What new dependencies or lock-ins?
   - How does this change the product's DNA?

2. MARKET POSITION & BRAND IDENTITY
   - How does this change how the market perceives us?
   - What new category do we compete in?
   - How does this affect brand positioning?
   - What strategic moats are created or destroyed?

3. ORGANIZATIONAL CAPABILITY SHIFTS
   - What new capabilities must we build?
   - What capabilities become obsolete?
   - How does this change our organizational structure?
   - What new hiring/team needs?

4. USER RELATIONSHIP & TRUST EVOLUTION
   - How does this fundamentally change user trust?
   - What new user expectations are set?
   - How does this affect customer lifetime value?
   - What relationship dynamics shift?

5. COMPETITIVE LANDSCAPE TRANSFORMATION
   - How does this reshape the competitive field?
   - What new competitors emerge?
   - What competitive advantages erode?
   - What new moats or vulnerabilities?

6. IRREVERSIBILITY & PATH DEPENDENCY
   - What decisions become irreversible?
   - What paths does this commit us to?
   - What future options does this close?
   - What strategic flexibility is lost?

Apply the 10-10-10 Rule:
- 10 Minutes: Immediate reaction
- 10 Months: Strategic consequence
- 10 Years: Legacy/systemic shift

Provide a comprehensive analysis focusing on long-term, structural implications."""

    messages = [{"role": "user", "content": prompt}]
    response = await query_model(CHAIRMAN_MODEL, messages)
    
    if not response:
        return {
            "analysis": "Failed to generate third-order analysis. Please try again.",
            "structural_changes": [],
            "market_position": [],
            "organizational_shifts": [],
            "user_relationship": [],
            "competitive_landscape": [],
            "irreversibility": []
        }
    
    return {
        "analysis": response.get('content', ''),
        "stage": "third_order"
    }


async def generate_recommendations(
    problem: str,
    solution: str,
    first_order: str,
    second_order: str,
    third_order: str
) -> Dict[str, Any]:
    """
    Stage 4: Generate actionable recommendations and mitigation strategies.
    """
    prompt = f"""You are a strategic product management advisor providing recommendations.

PROBLEM STATEMENT:
{problem}

PROPOSED SOLUTION:
{solution}

FIRST-ORDER ANALYSIS:
{first_order}

SECOND-ORDER ANALYSIS:
{second_order}

THIRD-ORDER ANALYSIS:
{third_order}

Based on this comprehensive impact analysis, provide:

1. GO/NO-GO RECOMMENDATION
   - Should this solution proceed as-is, be modified, or be reconsidered?
   - What is the risk level (Low/Medium/High/Critical)?
   - What is the confidence level in this analysis?

2. CRITICAL RISKS TO MITIGATE
   - What are the top 3-5 highest-risk second/third-order consequences?
   - Why are these critical?
   - What early warning signals should we monitor?

3. MITIGATION STRATEGIES
   - For each critical risk, provide specific mitigation actions
   - What safeguards can we build in?
   - What monitoring/metrics should we track?
   - What rollback plans do we need?

4. ALTERNATIVE APPROACHES
   - Are there alternative solutions that achieve the goal with lower risk?
   - What modifications to the current solution would reduce negative impacts?
   - What phased rollout approach would minimize risk?

5. SUCCESS METRICS & MONITORING PLAN
   - What metrics will indicate success?
   - What metrics will indicate emerging problems?
   - What is the monitoring cadence?
   - What are the threshold values for action?

6. PRE-MORTEM ANALYSIS
   - Assume this solution fails catastrophically in 6 months
   - What would be the most likely failure modes?
   - What would cause these failures?
   - How can we prevent them now?

Provide actionable, specific recommendations that a product manager can implement."""

    messages = [{"role": "user", "content": prompt}]
    response = await query_model(CHAIRMAN_MODEL, messages)
    
    if not response:
        return {
            "recommendation": "Failed to generate recommendations. Please try again.",
            "go_no_go": "Unable to determine",
            "critical_risks": [],
            "mitigations": [],
            "alternatives": [],
            "metrics": [],
            "pre_mortem": []
        }
    
    return {
        "analysis": response.get('content', ''),
        "stage": "recommendations"
    }


async def run_full_second_order_analysis(
    problem: str,
    solution: str
) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    """
    Run the complete second-order impact analysis.
    
    Returns:
        Tuple of (first_order, second_order, third_order, recommendations)
    """
    # Stage 1: First-order impacts
    first_order = await analyze_first_order_impacts(problem, solution)
    
    # Stage 2: Second-order impacts
    second_order = await analyze_second_order_impacts(
        problem,
        solution,
        first_order.get("analysis", "")
    )
    
    # Stage 3: Third-order impacts
    third_order = await analyze_third_order_impacts(
        problem,
        solution,
        first_order.get("analysis", ""),
        second_order.get("analysis", "")
    )
    
    # Stage 4: Recommendations
    recommendations = await generate_recommendations(
        problem,
        solution,
        first_order.get("analysis", ""),
        second_order.get("analysis", ""),
        third_order.get("analysis", "")
    )
    
    return first_order, second_order, third_order, recommendations


async def generate_key_takeaways(analysis_text: str, stage_type: str = 'first') -> List[str]:
    """
    Generate key takeaways from analysis text using a different model than the chairman.
    Uses gemini-2.5-flash for fast, cost-effective summarization.
    
    Args:
        analysis_text: The full analysis text to summarize
        stage_type: Type of analysis ('first', 'second', 'third', 'recommendations')
    
    Returns:
        List of key takeaway strings (3-5 items)
    """
    if not analysis_text or len(analysis_text.strip()) < 100:
        return []
    
    stage_context = {
        'first': 'first-order (immediate, direct impacts)',
        'second': 'second-order (reactions and adaptations)',
        'third': 'third-order (structural, long-term shifts)',
        'recommendations': 'recommendations and mitigation strategies'
    }.get(stage_type, 'analysis')
    
    prompt = f"""You are a strategic product management advisor creating an executive summary.

ANALYSIS TYPE: {stage_context}

FULL ANALYSIS TEXT:
{analysis_text}

TASK: Generate 3-5 concise, actionable key takeaways that summarize the most important insights from this analysis.

REQUIREMENTS:
1. Each takeaway should be a complete, standalone sentence (40-150 characters)
2. Focus on the most critical insights, risks, opportunities, or recommendations
3. Use clear, executive-friendly language
4. Avoid redundancy - each takeaway should be distinct
5. Prioritize actionable insights over descriptive statements
6. If the analysis mentions specific metrics, risks, or recommendations, include the most important ones

FORMAT: Return ONLY a numbered list (1., 2., 3., etc.) with no additional text, explanations, or formatting.
Each takeaway should be on its own line.

Example format:
1. [First key insight]
2. [Second key insight]
3. [Third key insight]
"""

    messages = [{"role": "user", "content": prompt}]
    # Use gemini-2.5-flash instead of chairman model for faster, cheaper summarization
    response = await query_model("google/gemini-2.5-flash", messages, timeout=30.0)
    
    if not response:
        return []
    
    content = response.get('content', '').strip()
    if not content:
        return []
    
    # Parse the numbered list
    takeaways = []
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Extract numbered items (1., 2., etc.) or bullet points (-, *, •)
        # Remove numbering/bullets and clean up
        cleaned = re.sub(r'^\d+[\.\)]\s*', '', line)  # Remove "1. " or "1) "
        cleaned = re.sub(r'^[-*•]\s*', '', cleaned)  # Remove "- ", "* ", "• "
        cleaned = cleaned.strip()
        
        # Remove markdown formatting
        cleaned = cleaned.replace('**', '')  # Remove bold
        cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', cleaned)  # Remove links, keep text
        
        if cleaned and len(cleaned) > 30 and len(cleaned) < 200:
            # Ensure it ends with punctuation
            if not re.search(r'[.!?]$', cleaned):
                cleaned += '.'
            takeaways.append(cleaned)
    
    # If parsing failed, try splitting by common delimiters
    if len(takeaways) < 2 and len(content) > 50:
        # Try splitting by periods, semicolons, or newlines
        sentences = re.split(r'[.!?;]\s+', content)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 40]
        for sentence in sentences[:5]:
            cleaned = sentence.strip()
            cleaned = re.sub(r'^\d+[\.\)]\s*', '', cleaned)
            cleaned = re.sub(r'^[-*•]\s*', '', cleaned)
            cleaned = cleaned.replace('**', '')
            cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', cleaned)
            if cleaned and len(cleaned) > 30 and len(cleaned) < 200:
                if not re.search(r'[.!?]$', cleaned):
                    cleaned += '.'
                if cleaned not in takeaways:
                    takeaways.append(cleaned)
    
    # Limit to 5 takeaways max
    return takeaways[:5]

