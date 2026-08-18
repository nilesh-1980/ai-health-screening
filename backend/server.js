const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


// =====================================
// TEST ROUTE
// =====================================

app.get("/", (req, res) => {

    res.json({
        message: "AI Health Screening Backend is running"
    });

});


// =====================================
// OPENROUTER API FUNCTION
// =====================================

async function callOpenRouter(messages, temperature = 0.2) {

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "Authorization":
                    `Bearer ${process.env.OPENROUTER_API_KEY}`,

                "HTTP-Referer":
                    "http://localhost:5173",

                "X-Title":
                    "AI Health Screening"
            },

            body: JSON.stringify({

                model:
                    "openai/gpt-4o-mini",

                messages:
                    messages,

                temperature:
                    temperature

            })
        }
    );


    const data = await response.json();


    if (!response.ok) {

        console.error(
            "OpenRouter error:",
            data
        );

        throw new Error(
            data?.error?.message ||
            "OpenRouter request failed"
        );

    }


    const content =
        data.choices?.[0]?.message?.content;


    if (!content) {

        throw new Error(
            "No AI response received"
        );

    }


    return content.trim();
}


// =====================================
// OPENROUTER LLM - CHAT
// =====================================

app.post("/api/chat", async (req, res) => {

    try {

        const {
            message,
            conversation
        } = req.body;


        // =================================
        // VALIDATE MESSAGE
        // =================================

        if (!message || !message.trim()) {

            return res.status(400).json({

                error:
                    "Message is required"

            });

        }


        // =================================
        // SYSTEM PROMPT
        // =================================

        const systemMessage = {

            role: "system",

            content: `
You are an AI health screening assistant.

Your job is to conduct a short, friendly,
basic health screening conversation.

You are NOT a doctor.

You must NOT diagnose diseases.

You must NOT prescribe medicines.

Your job is only to collect information
and summarize what the user tells you.

---------------------------------------
INFORMATION TO COLLECT
---------------------------------------

Try to collect these details:

1. Name
2. Main health concern or symptom
3. Duration of the symptom
4. Severity from 1 to 10
5. Other related symptoms

---------------------------------------
VERY IMPORTANT CONVERSATION RULES
---------------------------------------

1. Ask ONLY ONE question at a time.

2. Carefully read the COMPLETE conversation
   history before asking a question.

3. Remember information that the user has
   already provided.

4. NEVER ask for information that the user
   has already clearly provided.

5. If the user says their name, remember it.

6. If the user already provided their symptom,
   do NOT ask for their symptom again.

7. If the user already provided the duration,
   do NOT ask for duration again.

8. If the user already provided severity,
   do NOT ask for severity again.

9. If the user already provided related symptoms,
   do NOT ask the same question again.

10. If the user's answer contains multiple pieces
    of information, remember ALL of them.

---------------------------------------
CONVERSATION FLOW
---------------------------------------

If the name is missing:
ask for the name.

If the name is known but the main symptom
is missing:
ask about the main concern or symptom.

If name and symptom are known but duration
is missing:
ask how long the symptom has been present.

If duration is known but severity is missing:
ask for severity from 1 to 10.

If severity is known but related symptoms
are missing:
ask about other related symptoms.

If all important information has been collected,
ask a relevant final follow-up question only
if necessary.

Do not keep asking questions forever.

---------------------------------------
ANSWER STYLE
---------------------------------------

Keep responses short and natural because
your responses will be converted to speech.

Use simple English.

Be empathetic but concise.

Do not give a medical diagnosis.

Do not prescribe medication.

If the user describes something potentially
urgent or severe, advise them to seek appropriate
medical attention instead of diagnosing them.

---------------------------------------
IMPORTANT
---------------------------------------

The conversation history is the source of truth.

Before asking any question, check what the user
has already answered.

NEVER repeat a question whose answer is already
clearly present in the conversation.
`

        };


        // =================================
        // BUILD CONVERSATION
        // =================================

        const messages = [
            systemMessage
        ];


        // =================================
        // ADD CONVERSATION HISTORY
        // =================================

        if (
            conversation &&
            Array.isArray(conversation)
        ) {

            conversation.forEach((item) => {

                if (
                    item &&
                    (
                        item.role === "user" ||
                        item.role === "assistant"
                    ) &&
                    item.content
                ) {

                    messages.push({

                        role:
                            item.role,

                        content:
                            item.content

                    });

                }

            });

        } else {

            messages.push({

                role:
                    "user",

                content:
                    message.trim()

            });

        }


        // =================================
        // DEBUG
        // =================================

        console.log(
            "\n================================="
        );

        console.log(
            "Conversation sent to OpenRouter:"
        );

        console.log(
            JSON.stringify(
                messages,
                null,
                2
            )
        );

        console.log(
            "=================================\n"
        );


        // =================================
        // CALL OPENROUTER
        // =================================

        const aiResponse =
            await callOpenRouter(
                messages,
                0.2
            );


        // =================================
        // LOG AI RESPONSE
        // =================================

        console.log(
            "🤖 AI:",
            aiResponse
        );


        // =================================
        // SEND RESPONSE
        // =================================

        return res.json({

            response:
                aiResponse

        });


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );

        return res.status(500).json({

            error:
                error.message ||
                "Failed to communicate with AI"

        });

    }

});


// =====================================
// GENERATE HEALTH SCREENING REPORT
// =====================================

app.post(
    "/api/screening-report",
    async (req, res) => {

        try {

            const {
                conversation
            } = req.body;


            // =================================
            // VALIDATE CONVERSATION
            // =================================

            if (
                !conversation ||
                !Array.isArray(conversation) ||
                conversation.length === 0
            ) {

                return res.status(400).json({

                    error:
                        "Conversation is required"

                });

            }


            // =================================
            // CONVERT CONVERSATION TO TEXT
            // =================================

            const conversationText =
                conversation
                    .filter((item) => {

                        return (
                            item &&
                            (
                                item.role === "user" ||
                                item.role === "assistant"
                            ) &&
                            item.content
                        );

                    })
                    .map((item) => {

                        const speaker =
                            item.role === "user"
                                ? "USER"
                                : "ASSISTANT";

                        return (
                            speaker +
                            ": " +
                            item.content
                        );

                    })
                    .join("\n");


            // =================================
            // REPORT PROMPT
            // =================================

            const reportPrompt = {

                role: "system",

                content: `
You are a health screening information
extraction assistant.

Read the conversation below and extract ONLY
information that the USER actually provided.

Do NOT diagnose any disease.

Do NOT give medical advice.

Do NOT invent information.

Return ONLY a valid JSON object.

Required JSON format:

{
  "name": "",
  "symptom": "",
  "duration": "",
  "severity": null,
  "otherSymptoms": ""
}

Rules:

name:
The user's name.

symptom:
The user's main health concern or symptom.

duration:
How long the user has had the symptom.

severity:
The numerical severity from 1 to 10.
Use null if not provided.

otherSymptoms:
Other related symptoms.
If the user clearly said "no", "none",
"nothing", or equivalent, use "None".

If information is missing, use an empty
string except severity, which should use null.

Use ONLY information from the USER messages.

Do not use information invented by the assistant.

Do not include Markdown.

Do not include explanations.

Return JSON only.

---------------------------------------

CONVERSATION:

${conversationText}
`

            };


            // =================================
            // DEBUG
            // =================================

            console.log(
                "\n================================="
            );

            console.log(
                "Generating Health Screening Report"
            );

            console.log(
                conversationText
            );

            console.log(
                "=================================\n"
            );


            // =================================
            // CALL OPENROUTER
            // =================================

            let reportResponse =
                await callOpenRouter(
                    [reportPrompt],
                    0
                );


            // =================================
            // CLEAN AI RESPONSE
            // =================================

            reportResponse =
                reportResponse
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();


            // =================================
            // FIND JSON
            // =================================

            const firstBrace =
                reportResponse.indexOf("{");

            const lastBrace =
                reportResponse.lastIndexOf("}");


            if (
                firstBrace === -1 ||
                lastBrace === -1 ||
                lastBrace <= firstBrace
            ) {

                console.error(
                    "Invalid report response:",
                    reportResponse
                );

                return res.status(500).json({

                    error:
                        "AI returned invalid report data",

                    raw:
                        reportResponse

                });

            }


            const jsonString =
                reportResponse.substring(
                    firstBrace,
                    lastBrace + 1
                );


            // =================================
            // PARSE JSON
            // =================================

            let reportData;

            try {

                reportData =
                    JSON.parse(jsonString);

            } catch (error) {

                console.error(
                    "JSON parsing error:",
                    error
                );

                console.error(
                    "AI response:",
                    reportResponse
                );

                return res.status(500).json({

                    error:
                        "Unable to parse health report",

                    raw:
                        reportResponse

                });

            }


            // =================================
            // NORMALIZE REPORT
            // =================================

            const finalReport = {

                name:
                    reportData.name || "",

                symptom:
                    reportData.symptom || "",

                duration:
                    reportData.duration || "",

                severity:
                    reportData.severity === null ||
                    reportData.severity === undefined ||
                    reportData.severity === ""
                        ? null
                        : Number(
                            reportData.severity
                        ),

                otherSymptoms:
                    reportData.otherSymptoms || ""

            };


            // =================================
            // LOG FINAL REPORT
            // =================================

            console.log(
                "\n================================="
            );

            console.log(
                "📋 FINAL HEALTH SCREENING REPORT"
            );

            console.log(
                JSON.stringify(
                    finalReport,
                    null,
                    2
                )
            );

            console.log(
                "=================================\n"
            );


            // =================================
            // SEND REPORT
            // =================================

            return res.json({

                success:
                    true,

                report:
                    finalReport

            });


        } catch (error) {

            console.error(
                "Screening report error:",
                error
            );

            return res.status(500).json({

                error:
                    error.message ||
                    "Failed to generate health screening report"

            });

        }

    }
);


// =====================================
// START SERVER
// =====================================

const PORT = 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);