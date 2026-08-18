import { useState, useRef } from "react";
import jsPDF from "jspdf";
import "./App.css";

function App() {

  // ==========================================
  // STATE
  // ==========================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Health report
  const [healthReport, setHealthReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");


  // ==========================================
  // IMPORTANT REFS
  // ==========================================

  const recognitionRef = useRef(null);

  const callActiveRef = useRef(false);

  // Always contains latest conversation
  const messagesRef = useRef([]);


  // ==========================================
  // TEXT TO SPEECH
  // ==========================================

  const speakText = (text) => {

    if (!("speechSynthesis" in window)) {

      console.log(
        "Speech synthesis is not supported."
      );

      return;
    }


    window.speechSynthesis.cancel();


    const speech =
      new SpeechSynthesisUtterance(text);


    speech.lang = "en-IN";

    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;


    speech.onstart = () => {

      console.log(
        "🔊 AI voice started"
      );

      setIsSpeaking(true);

    };


    speech.onend = () => {

      console.log(
        "🔊 AI voice ended"
      );

      setIsSpeaking(false);


      // Automatically listen again
      if (callActiveRef.current) {

        console.log(
          "🎤 Starting microphone automatically..."
        );


        setTimeout(() => {

          startVoiceRecognition();

        }, 700);

      }

    };


    speech.onerror = (error) => {

      console.error(
        "TTS error:",
        error
      );

      setIsSpeaking(false);

    };


    window.speechSynthesis.speak(
      speech
    );

  };


  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = async (
    textFromVoice = null
  ) => {

    const userMessage = (
      textFromVoice !== null
        ? textFromVoice
        : message
    ).trim();


    if (!userMessage) {
      return;
    }


    // ======================================
    // GET CURRENT CONVERSATION FROM REF
    // ======================================

    const currentConversation =
      messagesRef.current;


    // ======================================
    // CREATE NEW CONVERSATION
    // ======================================

    const updatedMessages = [

      ...currentConversation,

      {
        role: "user",
        content: userMessage
      }

    ];


    // ======================================
    // UPDATE BOTH STATE AND REF
    // ======================================

    messagesRef.current =
      updatedMessages;


    setMessages(
      updatedMessages
    );


    // Clear input
    setMessage("");


    try {

      setLoading(true);


      // ====================================
      // DEBUG
      // ====================================

      console.log(
        "📤 Sending conversation:"
      );


      console.log(
        JSON.stringify(
          updatedMessages,
          null,
          2
        )
      );


      // ====================================
      // BACKEND REQUEST
      // ====================================

      const response =
        await fetch(
          "http://localhost:5000/api/chat",
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body: JSON.stringify({

              message:
                userMessage,

              conversation:
                updatedMessages

            })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Something went wrong"
        );

      }


      console.log(
        "🤖 AI Response:",
        data.response
      );


      // ====================================
      // CREATE AI MESSAGE
      // ====================================

      const aiMessage = {

        role: "assistant",

        content:
          data.response

      };


      // ====================================
      // UPDATE CONVERSATION
      // ====================================

      const finalMessages = [

        ...updatedMessages,

        aiMessage

      ];


      // IMPORTANT
      // Update ref FIRST
      messagesRef.current =
        finalMessages;


      // Then update UI
      setMessages(
        finalMessages
      );


      // ====================================
      // AI SPEAKS
      // ====================================

      speakText(
        data.response
      );


    } catch (error) {

      console.error(
        "Chat error:",
        error
      );


      const errorMessage = {

        role: "assistant",

        content:
          "Sorry, I could not get a response from the AI."

      };


      const finalMessages = [

        ...updatedMessages,

        errorMessage

      ];


      messagesRef.current =
        finalMessages;


      setMessages(
        finalMessages
      );


    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // SPEECH TO TEXT
  // ==========================================

  const startVoiceRecognition = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      alert(
        "Speech Recognition is not supported. Please use Google Chrome."
      );

      return;

    }


    if (isListening) {

      console.log(
        "Already listening..."
      );

      return;

    }


    if (loading) {

      console.log(
        "AI is still processing..."
      );

      return;

    }


    // Stop AI speech
    if (
      "speechSynthesis" in window
    ) {

      window.speechSynthesis.cancel();

      setIsSpeaking(false);

    }


    const recognition =
      new SpeechRecognition();


    recognitionRef.current =
      recognition;


    recognition.lang =
      "en-IN";


    recognition.continuous =
      false;


    recognition.interimResults =
      false;


    // ====================================
    // START
    // ====================================

    recognition.onstart = () => {

      console.log(
        "🎤 Listening..."
      );

      setIsListening(true);

    };


    // ====================================
    // RESULT
    // ====================================

    recognition.onresult = (
      event
    ) => {

      const text =
        event.results[0][0]
          .transcript
          .trim();


      console.log(
        "🗣️ You said:",
        text
      );


      if (!text) {
        return;
      }


      setMessage(text);


      // ==================================
      // AUTOMATIC SEND
      // ==================================

      console.log(
        "📤 Automatically sending..."
      );


      sendMessage(text);

    };


    // ====================================
    // ERROR
    // ====================================

    recognition.onerror = (
      event
    ) => {

      console.error(
        "Speech recognition error:",
        event.error
      );


      setIsListening(false);


      if (
        event.error ===
        "not-allowed"
      ) {

        alert(
          "Microphone permission was denied."
        );

        return;

      }


      if (
        event.error ===
        "no-speech"
      ) {

        console.log(
          "No speech detected."
        );

        return;

      }

    };


    // ====================================
    // END
    // ====================================

    recognition.onend = () => {

      console.log(
        "🎤 Listening ended"
      );

      setIsListening(false);

    };


    // ====================================
    // START MICROPHONE
    // ====================================

    try {

      recognition.start();

    } catch (error) {

      console.error(
        "Could not start recognition:",
        error
      );

      setIsListening(false);

    }

  };


  // ==========================================
  // START CALL
  // ==========================================

  const startCall = () => {

    console.log(
      "📞 Call started"
    );


    // Reset conversation
    messagesRef.current = [];

    setMessages([]);


    // Reset report
    setHealthReport(null);

    setReportError("");

    setReportLoading(false);


    callActiveRef.current =
      true;


    setIsCallActive(
      true
    );


    // ======================================
    // GREETING
    // ======================================

    const greeting =
      "Hello! I am your health screening assistant. How can I help you?";


    const greetingMessage = {

      role: "assistant",

      content:
        greeting

    };


    // Store greeting
    messagesRef.current = [

      greetingMessage

    ];


    setMessages([

      greetingMessage

    ]);


    // AI speaks
    speakText(
      greeting
    );

  };


  // ==========================================
  // GENERATE HEALTH REPORT
  // ==========================================

  const generateHealthReport = async () => {

    try {

      setReportLoading(true);

      setReportError("");

      setHealthReport(null);


      // ======================================
      // GET LATEST CONVERSATION
      // ======================================

      const conversation =
        messagesRef.current;


      console.log(
        "📋 Generating report from conversation:"
      );


      console.log(
        JSON.stringify(
          conversation,
          null,
          2
        )
      );


      // ======================================
      // VALIDATE CONVERSATION
      // ======================================

      if (
        !conversation ||
        conversation.length === 0
      ) {

        throw new Error(
          "No conversation available for report."
        );

      }


      // ======================================
      // CALL BACKEND
      // ======================================

      const response =
        await fetch(
          "http://localhost:5000/api/screening-report",
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body: JSON.stringify({

              conversation:
                conversation

            })

          }
        );


      const data =
        await response.json();


      // ======================================
      // HANDLE ERROR
      // ======================================

      if (!response.ok) {

        throw new Error(

          data.error ||
          "Failed to generate health report"

        );

      }


      // ======================================
      // SAVE REPORT
      // ======================================

      console.log(
        "📋 Health Report:",
        data.report
      );


      setHealthReport(
        data.report
      );


    } catch (error) {

      console.error(
        "Report error:",
        error
      );


      setReportError(
        error.message ||
        "Failed to generate health report"
      );


    } finally {

      setReportLoading(false);

    }

  };


  // ==========================================
  // DOWNLOAD HEALTH REPORT AS PDF
  // ==========================================

  const downloadHealthReport = () => {

    // Check report
    if (!healthReport) {

      alert(
        "Health report is not available."
      );

      return;

    }


    try {

      // ======================================
      // CREATE PDF
      // ======================================

      const pdf =
        new jsPDF();


      // ======================================
      // TITLE
      // ======================================

      pdf.setFontSize(20);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "AI HEALTH SCREENING REPORT",
        105,
        25,
        {
          align: "center"
        }
      );


      // ======================================
      // LINE
      // ======================================

      pdf.setLineWidth(
        0.5
      );

      pdf.line(
        20,
        32,
        190,
        32
      );


      // ======================================
      // REPORT DATA
      // ======================================

      let y = 50;


      pdf.setFontSize(
        12
      );


      // ======================================
      // PATIENT NAME
      // ======================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Patient Name:",
        20,
        y
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.text(
        healthReport.name ||
        "Not provided",
        70,
        y
      );


      y += 15;


      // ======================================
      // MAIN CONCERN
      // ======================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Main Concern:",
        20,
        y
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.text(
        healthReport.symptom ||
        "Not provided",
        70,
        y
      );


      y += 15;


      // ======================================
      // DURATION
      // ======================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Duration:",
        20,
        y
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.text(
        healthReport.duration ||
        "Not provided",
        70,
        y
      );


      y += 15;


      // ======================================
      // SEVERITY
      // ======================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Severity:",
        20,
        y
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      const severityText =
        healthReport.severity !== null &&
        healthReport.severity !== undefined
          ? `${healthReport.severity} / 10`
          : "Not provided";


      pdf.text(
        severityText,
        70,
        y
      );


      y += 15;


      // ======================================
      // OTHER SYMPTOMS
      // ======================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        "Other Symptoms:",
        20,
        y
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      const otherSymptoms =
        healthReport.otherSymptoms ||
        "Not provided";


      const wrappedSymptoms =
        pdf.splitTextToSize(
          String(otherSymptoms),
          110
        );


      pdf.text(
        wrappedSymptoms,
        70,
        y
      );


      y +=
        15 +
        (
          wrappedSymptoms.length - 1
        ) * 6;


      // ======================================
      // IMPORTANT NOTE
      // ======================================

      y += 10;


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.text(
        "Important Note:",
        20,
        y
      );


      y += 8;


      pdf.setFont(
        "helvetica",
        "normal"
      );


      const note =
        "This is a basic health screening summary " +
        "and not a medical diagnosis. Please consult " +
        "a qualified healthcare professional for " +
        "medical concerns.";


      const wrappedNote =
        pdf.splitTextToSize(
          note,
          170
        );


      pdf.text(
        wrappedNote,
        20,
        y
      );


      // ======================================
      // GENERATED DATE
      // ======================================

      y +=
        wrappedNote.length * 6 +
        15;


      const currentDate =
        new Date().toLocaleDateString(
          "en-IN"
        );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.text(
        "Generated On:",
        20,
        y
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.text(
        currentDate,
        70,
        y
      );


      // ======================================
      // FILE NAME
      // ======================================

      const patientName =
        healthReport.name
          ? String(
              healthReport.name
            )
              .replace(
                /[^a-zA-Z0-9]/g,
                "_"
              )
          : "Patient";


      const fileName =
        `${patientName}_Health_Report.pdf`;


      // ======================================
      // DOWNLOAD
      // ======================================

      pdf.save(
        fileName
      );


      console.log(
        `📥 PDF downloaded: ${fileName}`
      );


    } catch (error) {

      console.error(
        "PDF generation error:",
        error
      );


      alert(
        "Unable to generate PDF report."
      );

    }

  };


  // ==========================================
  // END CALL
  // ==========================================

  const endCall = async () => {

    console.log(
      "📞 Call ended"
    );


    callActiveRef.current =
      false;


    setIsCallActive(
      false
    );


    // Stop microphone
    if (
      recognitionRef.current
    ) {

      try {

        recognitionRef.current.stop();

      } catch (error) {

        console.log(
          "Recognition already stopped."
        );

      }

    }


    // Stop AI speech
    if (
      "speechSynthesis" in window
    ) {

      window.speechSynthesis.cancel();

    }


    setIsListening(false);

    setIsSpeaking(false);


    // ======================================
    // GENERATE REPORT
    // ======================================

    await generateHealthReport();

  };


  // ==========================================
  // STOP SPEAKING
  // ==========================================

  const stopSpeaking = () => {

    if (
      "speechSynthesis" in window
    ) {

      window.speechSynthesis.cancel();

      setIsSpeaking(false);

    }

  };


  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !loading
    ) {

      sendMessage();

    }

  };


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="app">


      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="header">

        <h1>
          AI Health Screening
        </h1>

        <p>
          AI-powered health screening
          assistant
        </p>

      </div>


      {/* ================================= */}
      {/* MAIN */}
      {/* ================================= */}

      <div className="call-container">


        {/* AVATAR */}

        <div className="ai-avatar">
          
        </div>


        <h2>
          AI Health Assistant
        </h2>


        {/* CALL STATUS */}

        <div className="call-status">

          {isCallActive
            ? "🟢 Call Active"
            : "⚪ Call Ended"}

        </div>


        {/* SPEAKING */}

        {isSpeaking && (

          <div className="speaking">

            🔊 AI is speaking...

            <button
              onClick={
                stopSpeaking
              }
            >
              Stop
            </button>

          </div>

        )}


        {/* LISTENING */}

        {isListening && (

          <div className="listening">

            🎤 Listening...

          </div>

        )}


        {/* ================================= */}
        {/* CONVERSATION */}
        {/* ================================= */}

        <div className="conversation">

          {messages.map(
            (msg, index) => (

              <div
                key={index}
                className={`message ${
                  msg.role === "user"
                    ? "user-message"
                    : "ai-message"
                }`}
              >

                <strong>

                  {msg.role === "user"
                    ? "You:"
                    : "AI:"}

                </strong>


                <p>
                  {msg.content}
                </p>

              </div>

            )
          )}

        </div>


        {/* LOADING */}

        {loading && (

          <div className="message ai-message">

            <strong>
              AI:
            </strong>

            <p>
              Thinking...
            </p>

          </div>

        )}


        {/* ================================= */}
        {/* INPUT */}
        {/* ================================= */}

        <div className="input-section">


          <input

            type="text"

            placeholder="Type your message..."

            value={message}

            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }

            onKeyDown={
              handleKeyDown
            }

            disabled={
              loading
            }

          />


          {/* SPEAK */}

          <button

            className="voice-btn"

            onClick={
              startVoiceRecognition
            }

            disabled={
              loading ||
              isListening
            }

          >

            {isListening
              ? "🔴 Listening..."
              : "🎤 Speak"}

          </button>


          {/* SEND */}

          <button

            className="send-btn"

            onClick={() =>
              sendMessage()
            }

            disabled={
              loading ||
              !message.trim()
            }

          >

            {loading
              ? "Thinking..."
              : "Send"}

          </button>

        </div>


        {/* ================================= */}
        {/* CALL BUTTON */}
        {/* ================================= */}

        <div className="call-buttons">

          {!isCallActive ? (

            <button

              className="start-call-btn"

              onClick={
                startCall
              }

            >

              📞 Start Call

            </button>

          ) : (

            <button

              className="end-call-btn"

              onClick={
                endCall
              }

            >

              🛑 End Call

            </button>

          )}

        </div>


        {/* ================================= */}
        {/* HEALTH REPORT */}
        {/* ================================= */}

        {reportLoading && (

          <div className="health-report">

            <h2>
              📋 Generating Health Report...
            </h2>

            <p>
              Please wait while we prepare
              your screening summary.
            </p>

          </div>

        )}


        {reportError && (

          <div className="health-report">

            <h2>
              ⚠️ Report Error
            </h2>

            <p>
              {reportError}
            </p>

            <button
              onClick={
                generateHealthReport
              }
            >
              Try Again
            </button>

          </div>

        )}


        {healthReport && (

          <div className="health-report">

            <h2>
              📋 Health Screening Report
            </h2>


            <div className="report-item">

              <strong>
                Patient Name
              </strong>

              <span>
                {healthReport.name ||
                  "Not provided"}
              </span>

            </div>


            <div className="report-item">

              <strong>
                Main Concern
              </strong>

              <span>
                {healthReport.symptom ||
                  "Not provided"}
              </span>

            </div>


            <div className="report-item">

              <strong>
                Duration
              </strong>

              <span>
                {healthReport.duration ||
                  "Not provided"}
              </span>

            </div>


            <div className="report-item">

              <strong>
                Severity
              </strong>

              <span>

                {healthReport.severity !== null &&
                healthReport.severity !== undefined

                  ? `${healthReport.severity} / 10`

                  : "Not provided"}

              </span>

            </div>


            <div className="report-item">

              <strong>
                Other Symptoms
              </strong>

              <span>
                {healthReport.otherSymptoms ||
                  "Not provided"}
              </span>

            </div>


            <div className="report-note">

              <strong>
                Note:
              </strong>

              <p>
                This is a basic health screening
                summary and not a medical diagnosis.
                Please consult a qualified healthcare
                professional for medical concerns.
              </p>

            </div>


            {/* ================================= */}
            {/* DOWNLOAD REPORT BUTTON */}
            {/* ================================= */}

            <div className="download-report-section">

              <button
                className="download-report-btn"
                onClick={
                  downloadHealthReport
                }
              >

                📥 Download Report

              </button>

            </div>


          </div>

        )}


      </div>

    </div>

  );

}

export default App;