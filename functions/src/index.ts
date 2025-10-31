// functions/src/index.ts

import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { LanguageServiceClient } from "@google-cloud/language";

// --- INITIALIZATION ---
admin.initializeApp();
const db = admin.firestore();
const nlpClient = new LanguageServiceClient();

setGlobalOptions({ maxInstances: 10 });

// --- ‼ HIGH-RISK KEYWORD SAFETY NET ‼ ---
const HIGH_RISK_KEYWORDS = [
  "suicide", "kill myself", "want to die", "end my life",
  "bomb", "shooting", "gun", "shoot up",
  "kill him", "kill her", "kill them", "murder", "homicide",
  "cut my vein", "killing", "gonna kill"
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


// --- FUNCTION 2: analyzeSentiment (‼ UPDATED with Score Override) ---
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

    logger.log(`Analyzing sentiment for entry: ${snapshot.id}`);

    const document = {
      content: content,
      type: "PLAIN_TEXT" as const,
    };

    try {
      // 1. Get AI Sentiment
      const [result] = await nlpClient.analyzeSentiment({ document: document });
      const sentiment = result.documentSentiment;

      if (!sentiment || sentiment.score === null || sentiment.score === undefined || sentiment.magnitude === null || sentiment.magnitude === undefined) {
        logger.error("No sentiment result returned from API.");
        return null;
      }

      logger.log(`AI Sentiment score: ${sentiment.score}, AI Magnitude: ${sentiment.magnitude}`);

      // 2. Initialize final scores with AI's result
      let finalScore = sentiment.score;
      let finalMagnitude = sentiment.magnitude;
      let isUrgent = false;
      let flagReason = "";

      // 3. Check Keyword Safety Net
      const lowerCaseContent = content.toLowerCase();
      const hasRiskKeyword = HIGH_RISK_KEYWORDS.some(keyword => lowerCaseContent.includes(keyword));
      const hasLowScore = finalScore <= -0.7;

      // 4. ‼ NEW OVERRIDE LOGIC ‼
      // Check if a high-risk keyword was found
      if (hasRiskKeyword) {
        isUrgent = true;
        flagReason = "High-risk keyword detected.";
        logger.warn(`KEYWORD OVERRIDE for student ${studentUid}. Forcing score to -1.0.`);
        
        // --- THIS IS THE FIX ---
        finalScore = -1.0; // Force the score to be maximum negative
        finalMagnitude = 5.0; // Force a high "severity"
        // ---------------------

      } else if (hasLowScore) {
        isUrgent = true;
        flagReason = "Low sentiment score detected.";
        logger.warn(`LOW SENTIMENT SCORE DETECTED for student ${studentUid}. (Score: ${finalScore}).`);
      }

      // 5. Flag student if urgent
      if (studentUid && isUrgent) {
        const studentDocRef = db.collection("students").doc(studentUid);
        try {
          await studentDocRef.update({ 
            needsHelp: true,
            lastUrgentEntry: content,
            lastUrgentReason: flagReason,
          });
          logger.log(`Successfully flagged student ${studentUid} for urgent help.`);
        } catch (error) {
          logger.error(`Failed to flag student ${studentUid}:`, error);
        }
      }

      // 6. Save the FINAL (potentially overridden) scores to the journal entry
      return snapshot.ref.set(
        {
          sentimentScore: finalScore,
          sentimentMagnitude: finalMagnitude,
        },
        { merge: true }
      );
    } catch (error) {
      logger.error("Error analyzing sentiment:", error);
      return null;
    }
});
// --- END OF FUNCTION 2 ---