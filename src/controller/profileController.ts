import { auth, db } from "@/lib/firebaseConfig";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const handleProfilePicChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  setProfilePic: (url: string) => void
) => {
  const file = e.target.files?.[0];
  const user = auth.currentUser;

  if (file && user) {
    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${user.uid}`);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update profile in Auth and Firestore
      await updateProfile(user, { photoURL: downloadURL });
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { profilePic: downloadURL });

      // 🔄 Refresh auth user to reflect new photoURL
      await user.reload();

      // ✅ Set in UI
      setProfilePic(auth.currentUser?.photoURL || downloadURL);
    } catch (err) {
      console.error("Profile pic update failed:", err);
    }
  }
};
