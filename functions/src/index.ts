/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// --- MERGED IMPORTS ---
import {setGlobalOptions} from "firebase-functions";
// import {onRequest} from "firebase-functions/https"; // <-- THIS LINE IS REMOVED
import * as logger from "firebase-functions/logger";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// --- NEW INITIALIZATION ---
// Initialize the Firebase Admin SDK to interact with Firestore
admin.initializeApp();
const db = admin.firestore();

// --- YOUR ORIGINAL SETUP CODE (UNCHANGED) ---
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
setGlobalOptions({ maxInstances: 10 });

// --- YOUR NEW FUNCTION STARTS HERE ---
/**
 * Triggered when a new weekly chat is completed and saved to Firestore.
 * This function calculates the student's monthly scores and updates their profile.
 */
export const calculateMonthlyScores = onDocumentCreated("weeklyChats/{chatId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event");
      return;
    }
    const chatData = snapshot.data();
    const studentUid = chatData.studentUid;
    
    logger.log(`Calculating scores for student: ${studentUid}`);

    // 1. Define the current month's time range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 2. Query all of the student's chats for the current month
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

    // 3. Count the total "Yes" (true) answers for each category
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

    // 4. Apply your scoring logic
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

    // 5. Update the student's main profile document
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
// --- YOUR NEW FUNCTION ENDS HERE ---


// --- YOUR ORIGINAL HELLOWORLD EXAMPLE (UNCHANGED) ---
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });