import { ForceGraphData } from "@/types/force-graph";
import { openai } from "./openai";
import summaryPrompts from "@/utils/summaryPrompts.json";

export async function processContentToGraph(
  content: string,
  type: "pdf" | "video"
): Promise<ForceGraphData> {
  try {
    // Initial content logging
    console.log("\n=== FORCE GRAPH PROCESSING START ===");
    console.log("Content Type:", type);
    console.log("Content Stats:", {
      totalLength: content.length,
      isEmpty: content.length === 0,
      hasWhitespace: content.trim().length !== content.length,
      firstNewlineAt: content.indexOf("\n"),
      numberOfLines: content.split("\n").length,
    });

    // Log content samples from different positions
    console.log("\nContent Samples:");
    console.log("Start (500 chars):", content.substring(0, 500));
    console.log(
      "Middle (500 chars):",
      content.substring(
        Math.max(0, Math.floor(content.length / 2) - 250),
        Math.min(content.length, Math.floor(content.length / 2) + 250)
      )
    );
    console.log(
      "End (500 chars):",
      content.substring(Math.max(0, content.length - 500))
    );

    // Validate content
    if (!content || content.trim().length === 0) {
      console.error("[ERROR] Empty content received");
      throw new Error("Content is empty");
    }

    // Get and log prompt template
    console.log("\n=== PROMPT TEMPLATE ===");
    const initialPrompt =
      type === "pdf"
        ? summaryPrompts["pdf-default"].userPrompt
        : summaryPrompts["default"].userPrompt;
    console.log("Template Type:", type === "pdf" ? "pdf-default" : "default");
    console.log("Template Length:", initialPrompt.length);

    // Process prompt
    const processedPrompt =
      type === "pdf"
        ? initialPrompt
            .replace("{title}", "Document")
            .replace("{pageCount}", "1")
            .replace("{full extracted PDF text}", content)
        : initialPrompt.replace("{transcript}", content);

    console.log("\n=== PROCESSED PROMPT ===");
    console.log("Start (500 chars):", processedPrompt.substring(0, 500));
    console.log("Replacements Made:", {
      title: type === "pdf",
      pageCount: type === "pdf",
      contentReplaced: true,
    });

    // First OpenAI call for summary
    console.log("\n=== GENERATING SUMMARY ===");
    console.time("summaryGeneration");

    const summaryResponse = await openai.chat.completions
      .create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              type === "pdf"
                ? summaryPrompts["pdf-default"].systemPrompt
                : summaryPrompts["default"].systemPrompt,
          },
          {
            role: "user",
            content: processedPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
      .catch((error) => {
        console.error("[ERROR] Summary Generation Failed:", {
          error: error.message,
          status: error.status,
          type: error.type,
        });
        throw error;
      });

    console.timeEnd("summaryGeneration");

    const summary = summaryResponse.choices[0]?.message?.content || "";
    console.log("\n=== GENERATED SUMMARY ===");
    console.log("Summary Stats:", {
      length: summary.length,
      sections: summary.split("#").length - 1,
      bulletPoints: summary.split("*").length - 1,
    });
    console.log("Summary Start (500 chars):", summary.substring(0, 500));

    // Prepare graph generation prompt
    const graphPrompt = `Create a knowledge graph from this content and its summary. Content: ${content}\n\nSummary: ${summary}`;

    console.log("\n=== GENERATING GRAPH ===");
    console.time("graphGeneration");

    const graphResponse = await openai.chat.completions
      .create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a knowledge graph generator. Create a JSON structure with nodes representing concepts and links representing relationships. Each node should have an id, name, val (importance 1-5), and group (category number). Links should have source, target, and value (strength 1-3). Focus on the main concepts and their relationships. IMPORTANT: Use actual concepts from the content, not generic placeholders.",
          },
          {
            role: "user",
            content: graphPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
      .catch((error) => {
        console.error("[ERROR] Graph Generation Failed:", {
          error: error.message,
          status: error.status,
          type: error.type,
        });
        throw error;
      });

    console.timeEnd("graphGeneration");

    const result = graphResponse.choices[0]?.message?.content;
    if (!result) {
      console.error("[ERROR] Empty OpenAI Response");
      throw new Error("No response from OpenAI");
    }

    console.log("\n=== RAW OPENAI RESPONSE ===");
    console.log(result);

    // Parse and validate graph data
    let graphData: ForceGraphData;
    try {
      graphData = JSON.parse(result);
    } catch (error) {
      console.error("[ERROR] JSON Parse Failed:", {
        error: error.message,
        result: result,
      });
      throw new Error("Failed to parse OpenAI response as JSON");
    }

    // Validate graph structure
    if (!graphData.nodes || !graphData.links) {
      console.error("[ERROR] Invalid Graph Structure:", graphData);
      throw new Error("Invalid graph data structure");
    }

    // Validate node and link data
    const validation = {
      nodes: {
        total: graphData.nodes.length,
        withMissingFields: graphData.nodes.filter(
          (n) => !n.id || !n.name || !n.val || !n.group
        ).length,
        valueRange: {
          min: Math.min(...graphData.nodes.map((n) => n.val)),
          max: Math.max(...graphData.nodes.map((n) => n.val)),
        },
      },
      links: {
        total: graphData.links.length,
        withMissingFields: graphData.links.filter(
          (l) => !l.source || !l.target || !l.value
        ).length,
        valueRange: {
          min: Math.min(...graphData.links.map((l) => l.value)),
          max: Math.max(...graphData.links.map((l) => l.value)),
        },
      },
    };

    console.log("\n=== FINAL GRAPH DATA ===");
    console.log("Validation Results:", validation);
    console.log("Nodes:", graphData.nodes);
    console.log("Links:", graphData.links);
    console.log("\n=== FORCE GRAPH PROCESSING COMPLETE ===\n");

    return graphData;
  } catch (error) {
    console.error("\n=== FORCE GRAPH PROCESSING ERROR ===");
    console.error("Error Type:", error.constructor.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("=== ERROR DETAILS END ===\n");
    throw error;
  }
}
