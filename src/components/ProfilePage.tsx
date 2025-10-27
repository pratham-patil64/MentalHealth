import { useState, useEffect, ChangeEvent } from "react"; // Import ChangeEvent
import { db, storage } from "@/firebase"; // Import storage
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import storage functions
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Student } from "./StudentDashboard"; // Import the Student interface

interface ProfilePageProps {
  user: User;
  studentData: Student | null;
  onProfileUpdate: () => void; // Function to call when profile is updated
}

const ProfilePage = ({ user, studentData, onProfileUpdate }: ProfilePageProps) => {
  // --- Initialize state based on studentData prop ---
  const [name, setName] = useState("");
  const [existingProfilePicUrl, setExistingProfilePicUrl] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parentPhone, setParentPhone] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [division, setDivision] = useState("");
  const [school, setSchool] = useState("");
  const [bloodType, setBloodType] = useState("");

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // --- NEW useEffect to update state when studentData prop changes ---
  useEffect(() => {
    setName(studentData?.name || "");
    setExistingProfilePicUrl(studentData?.profilePicUrl || "");
    setPreviewUrl(studentData?.profilePicUrl || null); // Initialize preview with existing URL
    setParentPhone(studentData?.parentPhone || "");
    setStudentClass(studentData?.class || "");
    setDivision(studentData?.division || "");
    setSchool(studentData?.school || "");
    setBloodType(studentData?.bloodType || "");
    // Reset file input state when data reloads
    setProfilePicFile(null);
  }, [studentData]); // Re-run effect if studentData changes

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePicFile(file);

      // Clean up previous blob URL if it exists before creating a new one
      if (previewUrl && previewUrl.startsWith('blob:')) {
         URL.revokeObjectURL(previewUrl);
      }
      // Create a temporary URL for preview
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      // Revoke blob URL only if it's a blob URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
         URL.revokeObjectURL(previewUrl); // Prevent memory leaks
      }
    };
  }, [previewUrl]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ProfilePage] handleSaveProfile started"); // Log start
    setLoading(true);

    let uploadedImageUrl = existingProfilePicUrl; // Start with the existing URL from state

    try {
      // 1. Upload new image if selected
      if (profilePicFile) {
        console.log("[ProfilePage] Uploading image..."); // Log image upload start
        const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePicFile.name}`);
        const uploadResult = await uploadBytes(storageRef, profilePicFile);
        uploadedImageUrl = await getDownloadURL(uploadResult.ref);
        console.log("[ProfilePage] Image uploaded successfully:", uploadedImageUrl); // Log image upload success
      } else {
        console.log("[ProfilePage] No new image file selected.");
      }

      // 2. Prepare Firestore data
      const profileData = {
        name,
        profilePicUrl: uploadedImageUrl, // Use the potentially updated URL
        parentPhone,
        class: studentClass,
        division,
        school,
        bloodType,
      };
      console.log("[ProfilePage] Profile data to save:", profileData); // Log data being saved

      // 3. Save data to Firestore (merging with existing data)
      const studentDocRef = doc(db, "students", user.uid);
      console.log("[ProfilePage] Saving to Firestore..."); // Log Firestore save start
      await setDoc(studentDocRef, profileData, { merge: true }); // Use merge: true
      console.log("[ProfilePage] Firestore save successful"); // Log Firestore save success

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });

      // Clear file state after successful upload and save
      setProfilePicFile(null);
      console.log("[ProfilePage] Calling onProfileUpdate..."); // Log callback trigger
      onProfileUpdate();
      console.log("[ProfilePage] onProfileUpdate finished"); // Log callback finish

    } catch (error) {
      console.error("[ProfilePage] Error saving profile:", error); // Log the full error object
      toast({
        title: "Error Saving Profile",
        description: `Could not save your profile. ${error instanceof Error ? error.message : String(error)}`, // Show more specific error
        variant: "destructive",
      });
      // setLoading(false); // Let finally handle this, but log indicates error occurred
    } finally {
      console.log("[ProfilePage] handleSaveProfile finally block reached"); // Log finally block
      setLoading(false); // Ensure loading is always reset
    }
  };


  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            {/* Check studentData directly from props for initial title */}
            {studentData?.school ? "Update Your Profile" : "Complete Your Profile"}
          </CardTitle>
          {!studentData?.school && (
            <CardDescription>
              Welcome! Please complete your profile to continue.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                 {/* Show preview OR existing URL from updated state */}
                <AvatarImage src={previewUrl || undefined} alt={name} />
                <AvatarFallback>{name ? name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                 {/* File Input for Profile Picture */}
                <Label htmlFor="profilePicFile">Change Profile Picture</Label>
                <Input
                  id="profilePicFile"
                  type="file"
                  accept="image/*" // Accept only image files
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name} // Use local state
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent's Phone Number</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={parentPhone} // Use local state
                  onChange={(e) => setParentPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School Name</Label>
                <Input
                  id="school"
                  placeholder="Your school name"
                  value={school} // Use local state
                  onChange={(e) => setSchool(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  placeholder="e.g., 10, 11, 12"
                  value={studentClass} // Use local state
                  onChange={(e) => setStudentClass(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Input
                  id="division"
                  placeholder="e.g., A, B, C"
                  value={division} // Use local state
                  onChange={(e) => setDivision(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Input
                  id="bloodType"
                  placeholder="e.g., O+, A-, B+"
                  value={bloodType} // Use local state
                  onChange={(e) => setBloodType(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

