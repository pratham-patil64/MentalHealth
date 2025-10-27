import { useState, useEffect } from "react";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  serverTimestamp,
  DocumentData, // Import DocumentData
} from "firebase/firestore";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface JournalEntry {
  id: string;
  timestamp: Timestamp;
  content: string;
  studentUid: string; // Keep track of student UID
}

interface JournalProps {
  user: User;
}

const Journal = ({ user }: JournalProps) => {
  const [newEntry, setNewEntry] = useState("");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Format Timestamp to readable date
  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return "No date";
    const date = timestamp.toDate();
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Fetch journal entries on load
  useEffect(() => {
    const fetchJournalEntries = async () => {
      if (!user) return;
      try {
        // Query the 'journalEntries' collection for docs matching the user's UID
        const entriesCollectionRef = collection(db, "journalEntries");
        const q = query(
          entriesCollectionRef,
          where("studentUid", "==", user.uid),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedEntries: JournalEntry[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEntries.push({
            id: doc.id,
            ...doc.data(),
          } as JournalEntry);
        });

        setJournalEntries(fetchedEntries);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
        toast({
          title: "Error",
          description: "Could not load your past journal entries.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJournalEntries();
  }, [user, toast]);

  // Save new journal entry
  const handleSaveEntry = async () => {
    if (newEntry.trim() === "") {
      toast({
        title: "Empty Entry",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      // ✅ Create the journal entry
      const newJournalEntry = {
        studentUid: user.uid,
        content: newEntry.trim(),
        timestamp: serverTimestamp(),
      };

      // ✅ Add to the 'journalEntries' collection
      const docRef = await addDoc(collection(db, "journalEntries"), newJournalEntry);

      // ✅ Add immediately to UI using local timestamp
      const tempEntryForUI: JournalEntry = {
        id: docRef.id,
        studentUid: user.uid,
        content: newEntry.trim(),
        timestamp: Timestamp.now(),
      };

      setJournalEntries([tempEntryForUI, ...journalEntries]);
      setNewEntry("");

      toast({
        title: "Journal Saved",
        description: "Your entry has been successfully saved.",
      });
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* New Entry Section */}
      <Card>
        <CardHeader>
          <CardTitle>New Journal Entry</CardTitle>
          <CardDescription>
            What's on your mind today? Writing it down can help.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Start writing here..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className="min-h-[150px] text-base"
          />
          <Button onClick={handleSaveEntry}>Save Entry</Button>
        </CardContent>
      </Card>

      {/* Past Entries Section */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">
          Past Entries
        </h3>
        <div className="space-y-4">
          {loading ? (
            <p>Loading entries...</p>
          ) : journalEntries.length > 0 ? (
            journalEntries.map((entry) => (
              <Card key={entry.id} className="bg-muted/50">
                <CardHeader>
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">
              You don't have any journal entries yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;