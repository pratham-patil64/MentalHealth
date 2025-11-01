// functions/src/index.ts

import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
// --- ‼ FIX 1: Import 'protos' for proper type definitions ---
import { LanguageServiceClient, protos } from "@google-cloud/language";

// --- INITIALIZATION ---
admin.initializeApp();
const db = admin.firestore();
const nlpClient = new LanguageServiceClient();

setGlobalOptions({ maxInstances: 10 });

// --- ‼ EXPANDED KEYWORD SAFETY NET ‼ ---
const HIGH_RISK_KEYWORDS = [
  // Self-Harm / Suicide
  "suicide", "kill myself", "want to die", "end my life",
  "cut my vein", "harm myself", "self-harm", "bleeding",
  "overdose", "hang myself", "jump off", "unalive myself",
  "cut my",

  // Threats to Others / Violence
  "bomb", "shooting", "gun", "shoot up", "weapon",
  "kill him", "kill her", "kill them", "murder", "homicide",
  "killing", "gonna kill", "stab", "assault",
  
  // Specific words from your screenshots
  "knife", "sharp knife", "slide my sharp knife",
  "punch her face", "punch", "beat him", "beat her",
  "stomach", "throat", "teeth fall off", "vein",
  "smashed my teacher's head", "smashed her",
  
  // Specific phrases of severe intent
  "serve that bitch", 
  "i will make a bomb",
  "bomb my college"
];
// ---------------------------------

// --- FUNCTION 1: calculateMonthlyScores (Unchanged) ---
export const calculateMonthlyScores = onDocumentCreated("weeklyChats/{chatId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event");
      return;
    }
    const chatData = snapshot.data();
    const studentUid = chatData.studentUid;
    
    logger.log(`Calculating scores for student: ${studentUid}`);

    // (Your existing scoring logic... no changes here)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyChatsSnapshot = await db
      .collection("weeklyChats")
      .where("studentUid", "==", studentUid)
      .where("chatDate", ">=", startOfMonth)
      .where("chatDate", "<=", endOfMonth)
      .get();

    if (monthlyChatsSnapshot.empty) {
      logger.log("No chats found for this student this month.");
      return;
    }

    let totalAnxietyYes = 0;
    let totalDepressionYes = 0;
    let totalStressYes = 0;

    monthlyChatsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.anxietyResponses) {
          totalAnxietyYes += data.anxietyResponses.filter(Boolean).length;
      }
      if (data.depressionResponses) {
          totalDepressionYes += data.depressionResponses.filter(Boolean).length;
      }
      if (data.stressResponses) {
          totalStressYes += data.stressResponses.filter(Boolean).length;
      }
    });

    logger.log(`Monthly Totals (Yes answers) -> Anxiety: ${totalAnxietyYes}, Depression: ${totalDepressionYes}, Stress: ${totalStressYes}`);

    let anxietyScore = 0;
    if (totalAnxietyYes >= 8) anxietyScore = 1;
    if (totalAnxietyYes >= 12) anxietyScore = 2;
    if (totalAnxietyYes >= 16) anxietyScore = 3;

    let depressionScore = 0;
    if (totalDepressionYes >= 10) depressionScore = 1;
    if (totalDepressionYes >= 15) depressionScore = 2;
    if (totalDepressionYes >= 20) depressionScore = 3;
    
    let stressScore = 0;
    if (totalStressYes >= 3) stressScore = 1;
    if (totalStressYes >= 5) stressScore = 2;
    if (totalStressYes >= 7) stressScore = 3;

    const studentDocRef = db.collection("students").doc(studentUid);
    
    try {
      await studentDocRef.update({
        anxietyScore: anxietyScore,
        depressionScore: depressionScore,
        stressScore: stressScore,
      });
      logger.log(`Successfully updated scores for student ${studentUid}: A=${anxietyScore}, D=${depressionScore}, S=${stressScore}`);
    } catch (error) {
      logger.error(`Failed to update scores for student ${studentUid}:`, error);
    }
});
// --- END OF FUNCTION 1 ---


// --- FUNCTION 2: analyzeSentiment (‼ UPGRADED with Resilient API Calls) ---
export const analyzeSentiment = onDocumentCreated("journalEntries/{entryId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event for journal entry.");
      return;
    }

    const data = snapshot.data();
    if (!data) {
      logger.warn("No data found for snapshot");
      return null;
    }

    const content = data.content;
    const studentUid = data.studentUid; 

    if (!content || typeof content !== "string") {
      logger.log("No content to analyze, exiting function.");
      return null;
    }
    
    if (!studentUid) {
      logger.warn("No studentUid found on journal entry, cannot flag student.");
    }

    logger.log(`Analyzing entry: ${snapshot.id}`);

    const document = {
      content: content,
      type: "PLAIN_TEXT" as const,
    };

    try {
      // --- ‼ UPDATED LOGIC: Run APIs separately ---

      // 1. Get AI Sentiment (This is our baseline)
      // --- ‼ FIX 2: Use correct type 'ISentiment' ---
      let sentiment: protos.google.cloud.language.v1.ISentiment | { score: number, magnitude: number } = { score: 0, magnitude: 0 };
      try {
        const [sentimentResult] = await nlpClient.analyzeSentiment({ document });
        if (sentimentResult.documentSentiment) {
          sentiment = sentimentResult.documentSentiment;
        }
      } catch (error) {
        logger.error("Error calling analyzeSentiment API:", error);
        sentiment = { score: 0, magnitude: 0 }; // Default to neutral if it fails
      }

      if (!sentiment || sentiment.score === null || sentiment.score === undefined || sentiment.magnitude === null || sentiment.magnitude === undefined) {
        logger.warn("Sentiment result was null or undefined, defaulting to neutral.");
        sentiment = { score: 0, magnitude: 0 };
      }

      // 2. Get AI Content Classification (This might fail on short text, so wrap it)
      // --- ‼ FIX 3: Use proper types to fix lint errors ---
      let categories: protos.google.cloud.language.v1.IClassificationCategory[] = [];
      try {
        // This API call is the one that fails on short text
        const [classificationResult] = await nlpClient.classifyText({ document });
        categories = classificationResult.categories || [];
      } catch (error) {
        // This is EXPECTED for short text (like "i will bomb my college")
        // We will ignore this error and proceed to the keyword check.
        logger.log("Info: classifyText API failed (likely text too short)");
      }

      logger.log(`AI Sentiment score: ${sentiment.score}, AI Magnitude: ${sentiment.magnitude}`);
      if (categories.length > 0) {
        // --- ‼ FIX 4: Add type for 'c' ---
        logger.log(`AI Classification: ${categories.map((c: protos.google.cloud.language.v1.IClassificationCategory) => c.name).join(", ")}`);
      }

      // 3. Initialize final scores with AI's result
      let finalScore = sentiment.score || 0;
      let finalMagnitude = sentiment.magnitude || 0;
      let isUrgent = false;
      let flagReason = "";

      // 4. ‼ 3-Layered Risk Detection ‼
      
      // Layer 1: Check AI Classification (Catches nuanced threats)
      // --- ‼ FIX 5: Add type for 'category' ---
      const highRiskCategories = categories.filter((category: protos.google.cloud.language.v1.IClassificationCategory) =>
        (
          category.name?.includes("/Sensitive_Subjects/Violence") ||
          category.name?.includes("/Health/Self-Harm")
        ) && (category.confidence || 0) > 0.6
      );

      if (highRiskCategories.length > 0) {
        isUrgent = true;
        flagReason = `AI Threat Detected: ${highRiskCategories[0].name}`;
        logger.warn(`AI THREAT DETECTED for student ${studentUid}. Category: ${flagReason}`);
      }

      // Layer 2: Check Keyword Safety Net (Our most reliable check)
      const lowerCaseContent = content.toLowerCase();
      const hasRiskKeyword = HIGH_RISK_KEYWORDS.some(keyword => lowerCaseContent.includes(keyword));
      
      if (hasRiskKeyword && !isUrgent) {
        isUrgent = true;
        flagReason = "High-risk keyword detected.";
        logger.warn(`KEYWORD OVERRIDE for student ${studentUid}.`);
      }

      // Layer 3: Check Low Sentiment Score (Catches general despair)
      const hasLowScore = finalScore <= -0.7;
      
      if (hasLowScore && !isUrgent) {
        isUrgent = true;
        flagReason = "Low sentiment score detected.";
        logger.warn(`LOW SENTIMENT SCORE DETECTED for student ${studentUid}. (Score: ${finalScore}).`);
      }

      // 5. ‼ OVERRIDE LOGIC ‼
      // If ANY of our safety nets were triggered, force the score to be negative.
      if (isUrgent && finalScore > -0.7) {
        logger.log(`Overriding score. Original: ${finalScore}. New: -1.0`);
        finalScore = -1.0; 
        finalMagnitude = 5.0; 
      }
      
      // 6. Flag student if urgent
      if (studentUid && isUrgent) {
        const studentDocRef = db.collection("students").doc(studentUid);
        await studentDocRef.update({ 
          needsHelp: true,
          lastUrgentEntry: content,
          lastUrgentReason: flagReason,
        });
        logger.log(`Successfully flagged student ${studentUid} for urgent help. Reason: ${flagReason}`);
      }

      // 7. Save the FINAL scores to the journal entry
      return snapshot.ref.set(
        {
          sentimentScore: finalScore,
          sentimentMagnitude: finalMagnitude,
        },
        { merge: true }
      );

    } catch (error) { // This is a final catch-all for any other unexpected error
      logger.error("Error in analyzeSentiment function:", error);
      return null;
    }
});
// --- END OF FUNCTION 2 ---